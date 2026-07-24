from django.db import models
from django.contrib.auth import get_user_model
from restaurants.models import Restaurant

# Grab the User model
User = get_user_model()

# --- 1. YOUR EXISTING MENU ITEM MODEL ---
class MenuItem(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='menu_items')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=100, default='Main Course')
    calories = models.PositiveIntegerField(null=True, blank=True)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.restaurant.name}"

# --- 2. YOUR EXISTING ORDER MODELS ---
class Order(models.Model):
    STATUS_CHOICES = [
        ('Payment Pending', 'Payment Pending'), # Waiting for payment
        ('Pending', 'Pending'),       # Customer placed it, waiting for owner
        ('Preparing', 'Preparing'),   # Owner accepted it
        ('Ready', 'Ready'),           # Owner finished cooking, waiting for rider
        ('Out for Delivery', 'Out for Delivery'), # Rider picked it up
        ('Rejected', 'Rejected'),     # Owner rejected it
        ('Delivered', 'Delivered'),   # Food arrived
    ]

    customer = models.ForeignKey(User, related_name='customer_orders', on_delete=models.CASCADE)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE)
    rider = models.ForeignKey(User, related_name='rider_deliveries', null=True, blank=True, on_delete=models.SET_NULL)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_fee = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Payment Pending')
    is_paid = models.BooleanField(default=False)
    delivery_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    delivery_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    rider_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    rider_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.id} - {self.restaurant.name}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.quantity}x {self.menu_item.name}"

# --- 3. YOUR NEW OFFER MODEL ---
class Offer(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='offers')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name='offers', null=True, blank=True)
    title = models.CharField(max_length=255) # e.g., "50% Off Burgers!"
    description = models.TextField(blank=True, null=True)
    discount_percentage = models.PositiveIntegerField(default=10) # e.g., 10 for 10%
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.restaurant.name}"