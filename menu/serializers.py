from rest_framework import serializers
from .models import MenuItem, Order, OrderItem, Offer


class MenuItemSerializer(serializers.ModelSerializer):
    discounted_price = serializers.SerializerMethodField()
    active_offer_title = serializers.SerializerMethodField()
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)

    class Meta:
        model = MenuItem
        fields = '__all__'
        read_only_fields = ['restaurant', 'created_at']

    def get_discounted_price(self, obj):
        offer = obj.offers.filter(is_active=True).order_by('-created_at').first()
        if not offer:
            offer = obj.restaurant.offers.filter(is_active=True, menu_item__isnull=True).order_by('-created_at').first()
            
        if offer:
            discount = float(obj.price) * (offer.discount_percentage / 100.0)
            return round(float(obj.price) - discount, 2)
        return None

    def get_active_offer_title(self, obj):
        offer = obj.offers.filter(is_active=True).order_by('-created_at').first()
        if not offer:
            offer = obj.restaurant.offers.filter(is_active=True, menu_item__isnull=True).order_by('-created_at').first()
        return offer.title if offer else None


class OrderItemSerializer(serializers.ModelSerializer):
    # Show item name alongside the ID for readability
    item_name = serializers.ReadOnlyField(source='menu_item.name')
    item_price = serializers.ReadOnlyField(source='menu_item.price')

    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'item_name', 'item_price', 'quantity']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer_username = serializers.ReadOnlyField(source='customer.username')
    restaurant_name = serializers.ReadOnlyField(source='restaurant.name')
    restaurant_lat = serializers.ReadOnlyField(source='restaurant.latitude')
    restaurant_lng = serializers.ReadOnlyField(source='restaurant.longitude')

    rider_username = serializers.ReadOnlyField(source='rider.username')
    rider_phone = serializers.ReadOnlyField(source='rider.phone_number')

    class Meta:
        model = Order
        fields = [
            'id', 'customer', 'customer_username', 'restaurant',
            'restaurant_name', 'total_price', 'delivery_fee', 'status', 'items', 'created_at',
            'delivery_lat', 'delivery_lng', 'restaurant_lat', 'restaurant_lng',
            'rider_lat', 'rider_lng',
            'rider', 'rider_username', 'rider_phone'
        ]
        read_only_fields = ['customer', 'restaurant', 'total_price', 'created_at']


class OwnerOfferSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.CharField(source='menu_item.name', read_only=True)

    class Meta:
        model = Offer
        fields = '__all__'
        read_only_fields = ['restaurant', 'created_at']


class PublicOfferSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)
    restaurant_id = serializers.IntegerField(source='restaurant.id', read_only=True)
    banner = serializers.ImageField(source='restaurant.banner', read_only=True)
    menu_item_name = serializers.CharField(source='menu_item.name', read_only=True)
    menu_item_id = serializers.IntegerField(source='menu_item.id', read_only=True)
    
    class Meta:
        model = Offer
        fields = ['id', 'restaurant_id', 'restaurant_name', 'menu_item_id', 'menu_item_name', 'title', 'description', 'discount_percentage', 'banner']