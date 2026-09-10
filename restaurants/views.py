from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Restaurant, Review
from .serializers import RestaurantSerializer, ReviewSerializer
from users.permissions import IsSystemAdmin
from django.shortcuts import get_object_or_404
from menu.models import Order

# --- ADMIN VIEWS ---

class AdminRestaurantListView(generics.ListAPIView):
    """Admin can see ALL restaurants to monitor the platform"""
    queryset = Restaurant.objects.all().order_by('-created_at')
    serializer_class = RestaurantSerializer
    permission_classes = [IsSystemAdmin]

class AdminRestaurantApprovalView(generics.UpdateAPIView):
    """Admin can Approve, Suspend, or Reject a restaurant"""
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
    permission_classes = [IsSystemAdmin]

    def patch(self, request, *args, **kwargs):
        # Using get_object_or_404 to prevent server crashes on bad IDs
        restaurant = self.get_object()
        new_status = request.data.get('status')
        
        valid_statuses = ['approved', 'suspended', 'rejected', 'pending']
        
        if new_status in valid_statuses:
            restaurant.status = new_status
            
            # Auto-verify only if approved
            if new_status == 'approved':
                restaurant.is_verified = True
            else:
                restaurant.is_verified = False
                
            restaurant.save()
            
            # Return the updated object so React can update the UI instantly
            return Response({
                "message": f"Restaurant status updated to {new_status}",
                "status": restaurant.status,
                "is_verified": restaurant.is_verified
            }, status=status.HTTP_200_OK)
        
        return Response({"error": "Invalid status value"}, status=status.HTTP_400_BAD_REQUEST)

# --- RESTAURANT OWNER VIEWS ---

class RestaurantProfileView(generics.RetrieveUpdateAPIView):
    """Allows Owners to see/update their own restaurant profile"""
    serializer_class = RestaurantSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        """
        Return the restaurant owned by the current user. 
        If it doesn't exist, this will return a 404 instead of a 500 error.
        """
        return get_object_or_404(Restaurant, owner=self.request.user)

    def post(self, request, *args, **kwargs):
        """Used for initial restaurant setup"""
        # Check if they already have a restaurant
        if Restaurant.objects.filter(owner=self.request.user).exists():
            return Response(
                {"error": "You already have a restaurant profile setup."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # Force the owner to be the current logged-in user
            serializer.save(owner=self.request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- PUBLIC VIEWS (CUSTOMER FEED) ---

class PublicRestaurantListView(generics.ListAPIView):
    """
    Public feed for customers. 
    Shows restaurants that have been approved by Admin.
    """
    serializer_class = RestaurantSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Restaurant.objects.filter(
            status='approved'
        ).order_by('-created_at')


class PublicRestaurantDetailView(generics.RetrieveAPIView):
    """
    Public view to get a SINGLE restaurant's details for the menu page.
    """
    queryset = Restaurant.objects.filter(status='approved')
    serializer_class = RestaurantSerializer
    permission_classes = [AllowAny]


class RestaurantReviewListCreateView(generics.ListCreateAPIView):
    """
    GET: List all reviews for a restaurant.
    POST: Authenticated customer submits a 1-5 star review for an order.
    """
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        restaurant_id = self.kwargs.get('pk')
        return Review.objects.filter(restaurant_id=restaurant_id).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        restaurant_id = self.kwargs.get('pk')
        restaurant = get_object_or_404(Restaurant, id=restaurant_id)

        rating = request.data.get('rating')
        comment = request.data.get('comment', '').strip()
        order_id = request.data.get('order_id')

        try:
            rating = int(rating)
            if rating < 1 or rating > 5:
                return Response({'error': 'Rating must be an integer between 1 and 5.'}, status=status.HTTP_400_BAD_REQUEST)
        except (TypeError, ValueError):
            return Response({'error': 'Valid rating (1-5) is required.'}, status=status.HTTP_400_BAD_REQUEST)

        order = None
        if order_id:
            try:
                order = Order.objects.get(id=order_id, customer=request.user)
            except Order.DoesNotExist:
                return Response({'error': 'Associated order not found or does not belong to you.'}, status=status.HTTP_404_NOT_FOUND)

            # Check if this order was already reviewed
            existing = Review.objects.filter(order=order).first()
            if existing:
                existing.rating = rating
                existing.comment = comment
                existing.save()
                serializer = self.get_serializer(existing)
                return Response(serializer.data, status=status.HTTP_200_OK)

        review = Review.objects.create(
            restaurant=restaurant,
            customer=request.user,
            order=order,
            rating=rating,
            comment=comment
        )

        serializer = self.get_serializer(review)
        return Response(serializer.data, status=status.HTTP_201_CREATED)