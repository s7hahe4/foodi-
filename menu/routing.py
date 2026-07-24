from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/orders/track/(?P<order_id>\w+)/$', consumers.OrderTrackerConsumer.as_asgi()),
]
