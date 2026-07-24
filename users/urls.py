from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
# Import views from the current 'users' app
from .views import (
    RegisterView,
    UserProfileView,
    AdminUserListView,
    AdminUserDetailView,
    AdminRestrictUserView,
    AdminUserToggleStatusView,
    ChangePasswordView,
)
# Import restaurant-related admin views from the 'restaurants' app
from restaurants.views import (
    AdminRestaurantListView,
    AdminRestaurantApprovalView
)

urlpatterns = [
    # --- AUTHENTICATION & PROFILE ---
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),

    # --- ADMIN: RESTAURANT MANAGEMENT ---
    path('admin/list/', AdminRestaurantListView.as_view(), name='admin-restaurant-list'),
    path('admin/approve/<int:pk>/', AdminRestaurantApprovalView.as_view(), name='admin-restaurant-approve'),

    # --- ADMIN: USER MANAGEMENT ---
    path('admin/users/', AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/users/<int:pk>/toggle/', AdminUserToggleStatusView.as_view(), name='admin-user-toggle'),
    path('admin/users/<int:pk>/restrict/', AdminRestrictUserView.as_view(), name='admin-user-restrict'),
]