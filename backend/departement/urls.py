from django.urls import path
from . import views

urlpatterns = [
    path('students/add', views.add_student, name='departement_add_student'),
    path('students/<uuid:pk>/', views.manage_student, name='departement_manage_student'),
    path('students/upload', views.upload_students, name='departement_upload_students'),
    path('hospital-network/', views.get_hospital_network, name='department_hospital_network'),
]
