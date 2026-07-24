from django.db import models
from django.conf import settings

class Restaurant(models.Model):
    # Workflow Status Choices
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('suspended', 'Suspended'),
        ('rejected', 'Rejected'),
    ]

    # 1. Ownership & Identity
    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='restaurant'
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to='restaurant_logos/', null=True, blank=True)
    banner = models.ImageField(upload_to='restaurant_banners/', null=True, blank=True)
    
    # 2. Location & Area (For your Recommendation Engine)
    address = models.TextField()
    area = models.CharField(max_length=100, help_text="e.g. Dhanmondi, Banani, Narsingdi")
    city = models.CharField(max_length=100, default="Dhaka")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    # 3. Admin Control Fields (The "Control Center" Logic)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_verified = models.BooleanField(default=False, help_text="Official blue-tick verification")
    rejection_reason = models.TextField(blank=True, null=True, help_text="Why the admin rejected this restaurant")
    
    # 4. Operational Status & Fees
    is_open = models.BooleanField(default=True)
    delivery_fee = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    
    # 5. Performance Metrics (For Analytics Dashboard)
    rating = models.FloatField(default=0.0)
    total_orders = models.PositiveIntegerField(default=0)

    # 6. Business Hours
    opening_time = models.TimeField(null=True, blank=True)
    closing_time = models.TimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.get_status_display()})"