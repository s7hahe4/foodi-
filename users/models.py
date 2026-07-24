from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    # Defining the roles clearly
    ROLE_CHOICES = (
        ('customer', 'Customer'),
        ('owner', 'Restaurant Owner'),
        ('rider', 'Delivery Rider'),
        ('admin', 'Admin'),
    )
    
    # Existing custom fields
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    phone_number = models.CharField(max_length=15, unique=True, null=True, blank=True)
    address = models.TextField(null=True, blank=True)

    # --- NEW: RESTRICTION LOGIC FIELDS ---
    # is_active = False means they CANNOT login at all.
    # is_restricted = True means they CAN login, but we will kick them out via React/Middleware.
    is_restricted = models.BooleanField(
        default=False, 
        help_text="Designates whether this user has limited access to the platform."
    )
    
    restriction_reason = models.TextField(
        default="Your account has been restricted by the Admin. Please contact support.",
        blank=True,
        null=True
    )

    def __str__(self):
        status = "[RESTRICTED]" if self.is_restricted else ""
        return f"{self.username} ({self.role}) {status}"