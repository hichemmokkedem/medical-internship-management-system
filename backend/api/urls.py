from django.urls import path
from . import views

urlpatterns = [
    # Document management endpoints (transversal)
    path('upload', views.upload_document, name='upload_document'),
    path('applications/<uuid:application_id>/documents', views.get_application_documents, name='get_application_documents'),
]
