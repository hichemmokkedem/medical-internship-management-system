from django.urls import path
from .views import CurrentUserView, AdminUserManagementView, AdminUserDetailView

urlpatterns = [
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('admin/users', AdminUserManagementView.as_view(), name='admin-users-list-create'),
    path('admin/users/<uuid:pk>', AdminUserDetailView.as_view(), name='admin-users-detail'),
]
