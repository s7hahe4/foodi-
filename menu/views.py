from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.core.mail import send_mail
from django.conf import settings
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import MenuItem, Order, OrderItem, Offer
from .serializers import MenuItemSerializer, OrderSerializer, OwnerOfferSerializer, PublicOfferSerializer
from restaurants.models import Restaurant


# ──────────────────────────────────────────
#  HELPER
# ──────────────────────────────────────────
def get_user_restaurant(user):
    """Return the restaurant owned by this user or raise a clean error."""
    try:
        return Restaurant.objects.get(owner=user)
    except Restaurant.DoesNotExist:
        raise ValidationError({"detail": "No restaurant is linked to this account."})


# ──────────────────────────────────────────
#  OWNER – MENU MANAGEMENT
# ──────────────────────────────────────────
class OwnerMenuListCreateView(generics.ListCreateAPIView):
    serializer_class = MenuItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        restaurant = get_user_restaurant(self.request.user)
        return MenuItem.objects.filter(restaurant=restaurant).order_by('-created_at')

    def perform_create(self, serializer):
        restaurant = get_user_restaurant(self.request.user)
        serializer.save(restaurant=restaurant)


class OwnerMenuDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MenuItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        restaurant = get_user_restaurant(self.request.user)
        return MenuItem.objects.filter(restaurant=restaurant)


# ──────────────────────────────────────────
#  PUBLIC – MENU BROWSING (no auth required)
# ──────────────────────────────────────────
class PublicMenuListView(generics.ListAPIView):
    serializer_class = MenuItemSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        restaurant_id = self.kwargs['restaurant_id']
        return MenuItem.objects.filter(
            restaurant__id=restaurant_id,
            is_available=True
        ).order_by('category', 'name')


# ──────────────────────────────────────────
#  CUSTOMER – GLOBAL FEED & SEARCH
# ──────────────────────────────────────────
class GlobalFeedView(generics.ListAPIView):
    """
    Public view for the customer home page.
    Shows all available food, and allows searching by food name or restaurant.
    """
    serializer_class = MenuItemSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # Start with all available food items, newest first
        queryset = MenuItem.objects.filter(is_available=True).order_by('-created_at')
        
        # Check if the user typed something in the search bar
        search_query = self.request.query_params.get('search', None)
        
        if search_query:
            # Search for the query in the food name OR the restaurant name
            queryset = queryset.filter(
                Q(name__icontains=search_query) | 
                Q(restaurant__name__icontains=search_query)
            )
            
        return queryset


# ──────────────────────────────────────────
#  CUSTOMER – PLACE ORDER
# ──────────────────────────────────────────
class PlaceOrderView(APIView):
    """
    Customer submits a cart and creates an Order.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        restaurant_id = request.data.get('restaurant_id')
        items_data    = request.data.get('items', [])

        if not restaurant_id or not items_data:
            return Response(
                {"error": "restaurant_id and items are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        restaurant = get_object_or_404(Restaurant, id=restaurant_id, status='approved')

        # Calculate total price from DB (never trust the client for prices)
        total = 0
        resolved_items = []

        for entry in items_data:
            menu_item = get_object_or_404(MenuItem, id=entry['menu_item_id'], restaurant=restaurant)
            qty = max(1, int(entry.get('quantity', 1)))
            
            # Apply item-specific discount if an active offer exists
            active_offer = menu_item.offers.filter(is_active=True).order_by('-created_at').first()
            if not active_offer:
                active_offer = restaurant.offers.filter(is_active=True, menu_item__isnull=True).order_by('-created_at').first()
            
            discount_multiplier = (100 - active_offer.discount_percentage) / 100.0 if active_offer else 1.0
            
            price_to_use = float(menu_item.price) * discount_multiplier
            total += price_to_use * qty
            resolved_items.append((menu_item, qty))

        # Get the dynamically calculated delivery fee from the frontend (OSRM-based)
        delivery_fee = float(request.data.get('delivery_fee', 0))

        # Create the Order
        order = Order.objects.create(
            customer=request.user,
            restaurant=restaurant,
            total_price=total + delivery_fee,
            delivery_fee=delivery_fee,
            status='Payment Pending',
            delivery_lat=request.data.get('delivery_lat'),
            delivery_lng=request.data.get('delivery_lng')
        )

        # Create OrderItems
        for menu_item, qty in resolved_items:
            OrderItem.objects.create(order=order, menu_item=menu_item, quantity=qty)

        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class ConfirmPaymentView(APIView):
    """
    Mock payment confirmation endpoint.
    Updates the order status to 'Pending' (paid and sent to restaurant).
    Sends an automated email receipt to the customer.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        order = get_object_or_404(Order, pk=pk, customer=request.user, status='Payment Pending')
        order.is_paid = True
        order.status = 'Pending'
        order.save()

        # Broadcast status update via WebSocket channels so the customer tracker updates
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'order_{order.id}',
            {
                'type': 'order_status_update',
                'status': 'Pending'
            }
        )

        # --- SEND AUTOMATED EMAIL RECEIPT ---
        if order.customer.email:
            subject = f"Receipt for Foodi++ Order #{order.id}"

            # Format order items
            items_text = ""
            for order_item in order.items.all():
                items_text += f"- {order_item.quantity}x {order_item.menu_item.name}\n"

            message = f"""
Hello {order.customer.username},

Thank you for your order from {order.restaurant.name}!
Your payment of ৳{order.total_price} was successful.

Order Details:
{items_text}
Total: ৳{order.total_price}

The restaurant has received your order and will begin preparing it shortly.
Track your order live on your Foodi++ Dashboard.

Stay hungry,
The Foodi++ Team
"""
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[order.customer.email],
                    fail_silently=False,
                )
            except Exception as e:
                print(f"Failed to send email receipt: {e}")

        return Response({"message": "Payment successful. Order sent to restaurant."}, status=status.HTTP_200_OK)


# ──────────────────────────────────────────
#  CUSTOMER – TRACK OWN ORDER
# ──────────────────────────────────────────
class CustomerOrderListView(generics.ListAPIView):
    """Returns all orders placed by the logged-in customer."""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(customer=self.request.user).order_by('-created_at')


class CustomerOrderTrackView(generics.RetrieveAPIView):
    """Returns a single order's current status for live tracking."""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(customer=self.request.user)


# ──────────────────────────────────────────
#  OWNER – MANAGE INCOMING ORDERS
# ──────────────────────────────────────────
class OwnerOrderListView(generics.ListAPIView):
    """Owner sees all pending orders for their restaurant."""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        restaurant = get_user_restaurant(self.request.user)
        return Order.objects.filter(restaurant=restaurant).order_by('-created_at')


class OwnerOrderManageView(generics.UpdateAPIView):
    """Owner accepts (Preparing) or rejects an order via PATCH."""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        restaurant = get_user_restaurant(self.request.user)
        return Order.objects.filter(restaurant=restaurant)

    def patch(self, request, *args, **kwargs):
        order = self.get_object()
        new_status = request.data.get('status')

        valid = ['Preparing', 'Ready', 'Rejected', 'Delivered']
        if new_status not in valid:
            return Response(
                {"error": f"Invalid status. Choose from: {valid}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = new_status
        order.save()

        # Broadcast via WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'order_{order.id}',
            {
                'type': 'order_status_update',
                'status': new_status
            }
        )

        return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)


# ──────────────────────────────────────────
#  RIDER – MANAGE DELIVERIES
# ──────────────────────────────────────────
class AvailableOrdersListView(generics.ListAPIView):
    """Returns orders that are 'Ready' but have no rider assigned."""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'rider':
            return Order.objects.none()
        return Order.objects.filter(status='Ready', rider__isnull=True).order_by('created_at')

class MyDeliveriesListView(generics.ListAPIView):
    """Returns orders assigned to the logged-in rider."""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'rider':
            return Order.objects.none()
        return Order.objects.filter(rider=self.request.user).exclude(status='Delivered').order_by('created_at')

class AcceptOrderView(APIView):
    """Rider accepts a ready order."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != 'rider':
            return Response({"error": "Only riders can accept orders."}, status=status.HTTP_403_FORBIDDEN)
        
        order = get_object_or_404(Order, pk=pk, status='Ready', rider__isnull=True)
        order.rider = request.user
        order.status = 'Out for Delivery'
        order.save()

        # Broadcast via WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'order_{order.id}',
            {
                'type': 'order_status_update',
                'status': 'Out for Delivery'
            }
        )

        return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)

class CompleteDeliveryView(APIView):
    """Rider marks an order as delivered."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != 'rider':
            return Response({"error": "Only riders can complete deliveries."}, status=status.HTTP_403_FORBIDDEN)
        
        order = get_object_or_404(Order, pk=pk, rider=request.user, status='Out for Delivery')
        order.status = 'Delivered'
        order.save()

        # Broadcast via WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'order_{order.id}',
            {
                'type': 'order_status_update',
                'status': 'Delivered'
            }
        )

        return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)


class RiderStatsView(APIView):
    """Returns aggregated stats + full delivery history for the logged-in rider."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'rider':
            return Response({'error': 'Only riders can access this.'}, status=status.HTTP_403_FORBIDDEN)

        from django.db.models import Count, Sum, Avg
        from django.utils import timezone
        from datetime import timedelta

        all_deliveries = Order.objects.filter(rider=request.user)
        completed     = all_deliveries.filter(status='Delivered')
        today         = timezone.now().date()
        week_start    = today - timedelta(days=today.weekday())
        month_start   = today.replace(day=1)

        total_earned       = completed.aggregate(s=Sum('delivery_fee'))['s'] or 0
        today_earned       = completed.filter(created_at__date=today).aggregate(s=Sum('delivery_fee'))['s'] or 0
        week_earned        = completed.filter(created_at__date__gte=week_start).aggregate(s=Sum('delivery_fee'))['s'] or 0
        month_earned       = completed.filter(created_at__date__gte=month_start).aggregate(s=Sum('delivery_fee'))['s'] or 0
        total_deliveries   = completed.count()
        today_deliveries   = completed.filter(created_at__date=today).count()
        week_deliveries    = completed.filter(created_at__date__gte=week_start).count()
        active_count       = all_deliveries.filter(status='Out for Delivery').count()

        # Acceptance rate: accepted / (accepted + available at time — approximated by total assigned)
        total_assigned = all_deliveries.exclude(status='Ready').count()
        acceptance_rate = round((total_deliveries / total_assigned * 100) if total_assigned > 0 else 100, 1)

        history = OrderSerializer(completed.order_by('-created_at')[:50], many=True).data

        return Response({
            'stats': {
                'total_deliveries': total_deliveries,
                'today_deliveries': today_deliveries,
                'week_deliveries': week_deliveries,
                'active_deliveries': active_count,
                'total_earned': float(total_earned),
                'today_earned': float(today_earned),
                'week_earned': float(week_earned),
                'month_earned': float(month_earned),
                'acceptance_rate': acceptance_rate,
            },
            'history': history,
        })


# ──────────────────────────────────────────
#  OWNER – MANAGE OFFERS
# ──────────────────────────────────────────
class OwnerOfferListCreateView(generics.ListCreateAPIView):
    serializer_class = OwnerOfferSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        restaurant = get_user_restaurant(self.request.user)
        return Offer.objects.filter(restaurant=restaurant).order_by('-created_at')

    def perform_create(self, serializer):
        restaurant = get_user_restaurant(self.request.user)
        serializer.save(restaurant=restaurant)

class OwnerOfferDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = OwnerOfferSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        restaurant = get_user_restaurant(self.request.user)
        return Offer.objects.filter(restaurant=restaurant)


# ──────────────────────────────────────────
#  PUBLIC – GLOBAL ACTIVE OFFERS
# ──────────────────────────────────────────
class PublicOfferListView(generics.ListAPIView):
    """Returns all currently active offers across all approved restaurants."""
    serializer_class = PublicOfferSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # Only return active offers from approved restaurants
        return Offer.objects.filter(is_active=True, restaurant__status='approved').order_by('-created_at')


# ──────────────────────────────────────────
#  CHATBOT – SMART FOOD RECOMMENDATION
# ──────────────────────────────────────────
class BotRecommendationView(APIView):
    """
    Accepts ?mood=<keyword>&budget=<max_price> and returns
    matching MenuItems, prioritizing those with active discounts.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        mood = request.query_params.get('mood', '').strip()
        budget = request.query_params.get('budget', None)
        max_calories = request.query_params.get('max_calories', None)

        if not mood:
            return Response(
                {"error": "Please provide a 'mood' parameter."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # --- Build base queryset: available items from approved restaurants ---
        qs = MenuItem.objects.filter(
            is_available=True,
            restaurant__status='approved'
        )

        # --- Filter by mood (search in category, name, description) ---
        qs = qs.filter(
            Q(category__icontains=mood) |
            Q(name__icontains=mood) |
            Q(description__icontains=mood)
        )

        # --- Filter by budget if provided ---
        if budget:
            try:
                budget_val = float(budget)
                qs = qs.filter(price__lte=budget_val)
            except (ValueError, TypeError):
                pass  # ignore bad budget values

        # --- Filter by calories if provided ---
        if max_calories:
            try:
                cal_val = int(max_calories)
                qs = qs.filter(calories__lte=cal_val)
            except (ValueError, TypeError):
                pass  # ignore bad calorie values

        # --- Serialize each item with offer data ---
        results = []
        for item in qs.select_related('restaurant')[:20]:
            # Check for active offer (item-specific first, then restaurant-wide)
            offer = item.offers.filter(is_active=True).order_by('-created_at').first()
            if not offer:
                offer = item.restaurant.offers.filter(
                    is_active=True, menu_item__isnull=True
                ).order_by('-created_at').first()

            discounted_price = None
            offer_title = None
            discount_pct = None
            if offer:
                discount = float(item.price) * (offer.discount_percentage / 100.0)
                discounted_price = round(float(item.price) - discount, 2)
                offer_title = offer.title
                discount_pct = offer.discount_percentage

            results.append({
                'id': item.id,
                'name': item.name,
                'description': item.description,
                'price': float(item.price),
                'discounted_price': discounted_price,
                'category': item.category,
                'calories': item.calories,
                'offer_title': offer_title,
                'discount_percentage': discount_pct,
                'restaurant_id': item.restaurant.id,
                'restaurant_name': item.restaurant.name,
                'has_offer': offer is not None,
            })

        # --- Sort: items WITH offers come first ---
        results.sort(key=lambda x: (not x['has_offer'], x['discounted_price'] or x['price']))

        return Response(results, status=status.HTTP_200_OK)