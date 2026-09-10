from django.urls import path
from .views import (
    AdminRestaurantListView, 
    AdminRestaurantApprovalView, 
    RestaurantProfileView,
    PublicRestaurantListView,
    PublicRestaurantDetailView,
    RestaurantReviewListCreateView,
)

urlpatterns = [
    # Admin routes
    path('admin/list/', AdminRestaurantListView.as_view(), name='admin-restaurant-list'),
    path('admin/approve/<int:pk>/', AdminRestaurantApprovalView.as_view(), name='admin-restaurant-approve'),

    # Owner route
    path('profile/', RestaurantProfileView.as_view(), name='restaurant-profile'),

    # Customer feed & reviews routes
    path('feed/', PublicRestaurantListView.as_view(), name='public-restaurant-feed'),
    path('feed/<int:pk>/', PublicRestaurantDetailView.as_view(), name='public-restaurant-detail'),
    path('feed/<int:pk>/reviews/', RestaurantReviewListCreateView.as_view(), name='restaurant-reviews'),
    path('<int:pk>/reviews/', RestaurantReviewListCreateView.as_view(), name='restaurant-reviews-direct'),
]