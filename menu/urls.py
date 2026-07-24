from django.urls import path
from .views import (
    OwnerMenuListCreateView,
    OwnerMenuDetailView,
    PublicMenuListView,
    GlobalFeedView,
    PlaceOrderView,
    CustomerOrderListView,
    CustomerOrderTrackView,
    OwnerOrderListView,
    OwnerOrderManageView,
    OwnerOfferListCreateView,
    OwnerOfferDetailView,
    PublicOfferListView,
    AvailableOrdersListView,
    MyDeliveriesListView,
    AcceptOrderView,
    CompleteDeliveryView,
    ConfirmPaymentView,
    BotRecommendationView,
    RiderStatsView,
)

urlpatterns = [
    # --- Menu Management ---
    path('manage/', OwnerMenuListCreateView.as_view(), name='owner-menu-list-create'),
    path('manage/<int:pk>/', OwnerMenuDetailView.as_view(), name='owner-menu-detail'),
    path('public/<int:restaurant_id>/', PublicMenuListView.as_view(), name='public-menu-list'),
    
    # --- Customer Global Feed ---
    path('feed/', GlobalFeedView.as_view(), name='global-feed'),

    # --- Orders (Customer Side) ---
    path('orders/place/', PlaceOrderView.as_view(), name='place-order'),
    path('orders/pay/<int:pk>/', ConfirmPaymentView.as_view(), name='confirm-payment'),
    path('orders/my-orders/', CustomerOrderListView.as_view(), name='my-orders'),
    path('orders/track/<int:pk>/', CustomerOrderTrackView.as_view(), name='track-order'),

    # --- Orders (Owner Side) ---
    path('orders/manage/', OwnerOrderListView.as_view(), name='owner-orders'),
    path('orders/manage/<int:pk>/', OwnerOrderManageView.as_view(), name='owner-order-manage'),

    # --- Offers (Owner Side) ---
    path('offers/manage/', OwnerOfferListCreateView.as_view(), name='owner-offer-list-create'),
    path('offers/manage/<int:pk>/', OwnerOfferDetailView.as_view(), name='owner-offer-detail'),

    # --- Offers (Public) ---
    path('offers/public/', PublicOfferListView.as_view(), name='public-offer-list'),

    # --- Orders (Rider Side) ---
    path('orders/rider/available/', AvailableOrdersListView.as_view(), name='rider-available-orders'),
    path('orders/rider/my-deliveries/', MyDeliveriesListView.as_view(), name='rider-my-deliveries'),
    path('orders/rider/accept/<int:pk>/', AcceptOrderView.as_view(), name='rider-accept-order'),
    path('orders/rider/complete/<int:pk>/', CompleteDeliveryView.as_view(), name='rider-complete-delivery'),
    path('orders/rider/stats/', RiderStatsView.as_view(), name='rider-stats'),

    # --- Chatbot Recommendation ---
    path('recommend/', BotRecommendationView.as_view(), name='bot-recommend'),
]