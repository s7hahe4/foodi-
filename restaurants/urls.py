from django.urls import path
from .views import (
    AdminRestaurantListView, 
    AdminRestaurantApprovalView, 
    RestaurantProfileView,
    PublicRestaurantListView,
    PublicRestaurantDetailView,
)

urlpatterns = [
    # Admin routes
    path('admin/list/', AdminRestaurantListView.as_view(), name='admin-restaurant-list'),
    path('admin/approve/<int:pk>/', AdminRestaurantApprovalView.as_view(), name='admin-restaurant-approve'),

    # Owner route
    path('profile/', RestaurantProfileView.as_view(), name='restaurant-profile'),

    # Customer feed routes
    path('feed/', PublicRestaurantListView.as_view(), name='public-restaurant-feed'),
    path('feed/<int:pk>/', PublicRestaurantDetailView.as_view(), name='public-restaurant-detail'),
]