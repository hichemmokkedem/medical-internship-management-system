from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from core.views import CustomTokenObtainPairView, CurrentUserView

from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Authentication endpoints
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/me/', CurrentUserView.as_view(), name='current_user'),
    
    # App-specific endpoints
    path('api/student/', include('student.urls')),
    path('api/medecin/', include('medecin.urls')),
    path('api/departement/', include('departement.urls')),
    path('api/core/', include('core.urls')),
    path('api/', include('internship.urls')),
    path('api/', include('api.urls')),  # Transversal endpoints (documents)
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
