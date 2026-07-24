from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from django.db.models import Sum

# Internal imports
from .serializers import UserSerializer, RegisterSerializer
from .permissions import IsSystemAdmin
from restaurants.models import Restaurant

User = get_user_model()

# --- AUTHENTICATION VIEWS ---

class RegisterView(generics.CreateAPIView):
    """Allows new users to sign up"""
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

class UserProfileView(generics.RetrieveUpdateAPIView):
    """Allows users to see and edit their own profile"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        user = serializer.save()
        password = self.request.data.get('password')
        if password:
            user.set_password(password)
            user.save()

# --- ADMIN: USER MANAGEMENT VIEWS ---

class AdminUserListView(generics.ListAPIView):
    """Allows Admin to see all users with filtering"""
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [IsSystemAdmin]

class AdminUserDetailView(generics.RetrieveAPIView):
    """
    Deep dive into a user's activity.
    Admin can see profile, business sales (if owner), and order history.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsSystemAdmin]
    
    def get(self, request, *args, **kwargs):
        user = self.get_object()
        
        # Base Data: Profile & Basic Activity
        data = {
            "profile": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "phone": user.phone_number,
                "date_joined": user.date_joined,
                "is_restricted": user.is_restricted,
                "is_active": user.is_active,
                "restriction_reason": user.restriction_reason,
            },
            "activity": {
                "total_orders_placed": 0, # Placeholder for Order app
                "total_spent": 0,         # Placeholder for Order app
            }
        }

        # If the user is an Owner, pull their Restaurant/Business stats
        if user.role == 'owner':
            restaurant = Restaurant.objects.filter(owner=user).first()
            if restaurant:
                # Check if menu_items relation exists (requires related_name='menu_items' in MenuItem model)
                menu_count = 0
                if hasattr(restaurant, 'menu_items'):
                    menu_count = restaurant.menu_items.count()
                elif hasattr(restaurant, 'menuitem_set'):
                    menu_count = restaurant.menuitem_set.count()

                data["business"] = {
                    "restaurant_name": restaurant.name,
                    "status": restaurant.status,
                    "is_verified": restaurant.is_verified,
                    "total_sales": 0,  # Placeholder for Revenue logic
                    "menu_items_count": menu_count
                }
        
        return Response(data)

class AdminRestrictUserView(APIView):
    """
    The 'Restriction' Logic: 
    Flips the is_restricted flag. React will use this to auto-logout the user.
    """
    permission_classes = [IsSystemAdmin]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            # Toggle the restriction
            user.is_restricted = not user.is_restricted
            
            # If the admin sent a specific reason, update it
            reason = request.data.get('reason')
            if reason:
                user.restriction_reason = reason
                
            user.save()
            
            status_text = "Restricted" if user.is_restricted else "Restored"
            return Response({
                "message": f"User {user.username} has been {status_text}",
                "is_restricted": user.is_restricted
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

class AdminUserToggleStatusView(APIView):
    """Traditional Block/Unblock (is_active)"""
    permission_classes = [IsSystemAdmin]

    def patch(self, request, pk):
        user = User.objects.get(pk=pk)
        user.is_active = not user.is_active
        user.save()
        return Response({"is_active": user.is_active})


class ChangePasswordView(APIView):
    """Allows any authenticated user to change their own password securely."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current_password = request.data.get('current_password')
        new_password     = request.data.get('new_password')

        if not current_password or not new_password:
            return Response({'error': 'Both current_password and new_password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if not user.check_password(current_password):
            return Response({'error': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 8:
            return Response({'error': 'New password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password changed successfully.'}, status=status.HTTP_200_OK)