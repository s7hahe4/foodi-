from rest_framework import serializers
from .models import Restaurant

class RestaurantSerializer(serializers.ModelSerializer):
    # This pulls the owner's name so the Admin knows who they are dealing with
    owner_username = serializers.ReadOnlyField(source='owner.username')
    active_offer_title = serializers.SerializerMethodField()
    active_offer_discount = serializers.SerializerMethodField()

    class Meta:
        model = Restaurant
        fields = [
            'id', 
            'owner_username', 
            'name', 
            'description', 
            'address', 
            'area',
            'city',
            'latitude',
            'longitude',
            'logo', 
            'banner', 
            'status',
            'is_verified',
            'is_open', 
            'delivery_fee', 
            'opening_time', 
            'closing_time',
            'created_at',
            'active_offer_title',
            'active_offer_discount'
        ]
        read_only_fields = ['is_verified', 'created_at']

    def get_active_offer_title(self, obj):
        offer = obj.offers.filter(is_active=True).order_by('-discount_percentage').first()
        return offer.title if offer else None

    def get_active_offer_discount(self, obj):
        offer = obj.offers.filter(is_active=True).order_by('-discount_percentage').first()
        return offer.discount_percentage if offer else None