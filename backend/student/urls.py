from django.urls import path
from . import views

urlpatterns = [
    path('profile', views.get_student_profile, name='student_profile'),
    path('applications', views.get_student_applications, name='student_applications'),
    path('documents', views.get_student_documents, name='student_documents'),
]
