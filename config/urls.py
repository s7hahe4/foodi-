from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse 
from django.conf import settings
from django.conf.urls.static import static

from django.core.management import call_command
from django.http import HttpResponse, JsonResponse

def api_home(request):
    return HttpResponse("🍔 Welcome to the Foodi++ Backend API! Everything is running smoothly.")

def seed_demo_view(request):
    try:
        call_command('seed_demo_data')
        return JsonResponse({
            'status': 'success',
            'message': 'All Foodi++ demo accounts, restaurant, menu items, and sample reviews have been seeded successfully!',
            'credentials': {
                'admin': {'username': 'admin', 'password': 'AdminPassword123!'},
                'restaurant_owner': {'username': 'restaurant_owner', 'password': 'OwnerPassword123!'},
                'delivery_rider': {'username': 'delivery_rider', 'password': 'RiderPassword123!'},
                'customer': {'username': 'customer_demo', 'password': 'CustomerPassword123!'},
            }
        })
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

urlpatterns = [
    path('', api_home, name='api-home'), 
    path('api/seed-demo/', seed_demo_view, name='seed-demo'),
    path('admin/', admin.site.urls),
    
    # ─── YOUR APP ROUTES ───
    path('api/users/', include('users.urls')),
    path('api/restaurants/', include('restaurants.urls')),
    path('api/menu/', include('menu.urls')),
    path('api/admin/', include('admin_panel.urls')), 
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)