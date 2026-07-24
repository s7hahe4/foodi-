from rest_framework import generics, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model

from restaurants.models import Restaurant
from menu.models import Order, Offer # <--- Importing our models!
from users.permissions import IsSystemAdmin
from .models import SiteSettings

User = get_user_model()

# ─── QUICK ADMIN SERIALIZERS ────────────────────────────────────
# We create specific serializers here so the admin gets easy-to-read names instead of just IDs
class AdminOrderSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    
    class Meta:
        model = Order
        fields = ['id', 'customer_email', 'restaurant_name', 'total_price', 'status', 'created_at']

class AdminOfferSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)
    menu_item_name = serializers.CharField(source='menu_item.name', read_only=True)

    class Meta:
        model = Offer
        fields = ['id', 'restaurant_name', 'menu_item_name', 'title', 'discount_percentage', 'is_active', 'created_at']

class SiteSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        fields = ['promo_banner_text']

# ─── ADMIN VIEWS ────────────────────────────────────────────────
class AdminStatsView(APIView):
    permission_classes = [IsSystemAdmin]

    def get(self, request):
        stats = {
            "total_users": User.objects.count(),
            "total_restaurants": Restaurant.objects.count(),
            "pending_approvals": Restaurant.objects.filter(status='pending').count(),
            
            # Count only orders that are currently in progress!
            "active_orders": Order.objects.filter(status__in=['Pending', 'Preparing']).count(), 
        }
        return Response(stats)

class AdminGlobalOrderListView(generics.ListAPIView):
    """Returns ALL ongoing orders across the entire platform."""
    serializer_class = AdminOrderSerializer
    permission_classes = [IsSystemAdmin]

    def get_queryset(self):
        # Exclude delivered or rejected orders to only show active ones
        return Order.objects.exclude(status__in=['Delivered', 'Rejected']).order_by('-created_at')

class AdminGlobalOfferListView(generics.ListAPIView):
    """Returns ALL offers created by any restaurant."""
    serializer_class = AdminOfferSerializer
    permission_classes = [IsSystemAdmin]

    def get_queryset(self):
        return Offer.objects.all().order_by('-created_at')

class AdminGlobalOfferDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Allows system admins to toggle or delete any offer."""
    serializer_class = AdminOfferSerializer
    permission_classes = [IsSystemAdmin]

    def get_queryset(self):
        return Offer.objects.all()

class AdminSiteSettingsView(APIView):
    """Allows system admins to view and update global settings."""
    permission_classes = [IsSystemAdmin]

    def get(self, request):
        settings = SiteSettings.load()
        serializer = SiteSettingsSerializer(settings)
        return Response(serializer.data)

    def put(self, request):
        settings = SiteSettings.load()
        serializer = SiteSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

class PublicSiteSettingsView(APIView):
    """Allows anyone to fetch the promo banner text."""
    permission_classes = [AllowAny]

    def get(self, request):
        settings = SiteSettings.load()
        return Response({"promo_banner_text": settings.promo_banner_text})