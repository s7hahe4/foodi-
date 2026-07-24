import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.apps import apps

class OrderTrackerConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.order_id = self.scope['url_route']['kwargs']['order_id']
        self.room_group_name = f'order_{self.order_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from client WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)
        if data.get('type') == 'rider_location_update':
            lat = data.get('rider_lat')
            lng = data.get('rider_lng')
            
            # Save the coordinates to the database
            await self.save_rider_location(self.order_id, lat, lng)
            
            # Broadcast location update to all group members
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'rider_location_broadcast',
                    'rider_lat': lat,
                    'rider_lng': lng
                }
            )

    @database_sync_to_async
    def save_rider_location(self, order_id, lat, lng):
        Order = apps.get_model('menu', 'Order')
        Order.objects.filter(id=order_id).update(rider_lat=lat, rider_lng=lng)

    # Broadcast handler for rider location updates
    async def rider_location_broadcast(self, event):
        await self.send(text_data=json.dumps({
            'type': 'rider_location_update',
            'rider_lat': event['rider_lat'],
            'rider_lng': event['rider_lng']
        }))

    # Receive status update from room group
    async def order_status_update(self, event):
        status = event['status']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'order_status_update',
            'status': status
        }))
