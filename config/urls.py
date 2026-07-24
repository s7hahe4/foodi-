from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse 
from django.conf import settings
from django.conf.urls.static import static

def api_home(request):
    return HttpResponse("🍔 Welcome to the Foodi++ Backend API! Everything is running smoothly.")

urlpatterns = [
    path('', api_home, name='api-home'), 
    path('admin/', admin.site.urls),
    
    # ─── YOUR APP ROUTES ───
    path('api/users/', include('users.urls')),
    path('api/restaurants/', include('restaurants.urls')),
    path('api/menu/', include('menu.urls')),
    path('api/admin/', include('admin_panel.urls')), 
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)