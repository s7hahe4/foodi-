from django.urls import path
from .views import (
    AdminStatsView,
    AdminGlobalOrderListView,
    AdminGlobalOfferListView,
    AdminGlobalOfferDetailView,
    AdminSiteSettingsView,
    PublicSiteSettingsView
)

urlpatterns = [
    path('stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('orders/', AdminGlobalOrderListView.as_view(), name='admin-orders'),
    path('offers/', AdminGlobalOfferListView.as_view(), name='admin-offers'),
    path('offers/<int:pk>/', AdminGlobalOfferDetailView.as_view(), name='admin-offer-detail'),
    path('settings/', AdminSiteSettingsView.as_view(), name='admin-settings'),
    path('settings/public/', PublicSiteSettingsView.as_view(), name='public-settings'),
]