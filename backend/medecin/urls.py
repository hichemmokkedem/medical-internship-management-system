from django.urls import path
from . import views

urlpatterns = [
    path('attendance', views.record_attendance, name='medecin_record_attendance'),
    path('attendance/<str:id>', views.handle_attendance_detail, name='medecin_attendance_detail'),
    path('supervisors', views.get_medicine_supervisors, name='medecin_supervisors'),
    path('applications/<uuid:application_id>/assign-supervisor', views.assign_supervisor, name='medecin_assign_supervisor'),
    path('applications/<uuid:application_id>/evaluation', views.submit_evaluation, name='medecin_submit_evaluation'),
    path('applications/<uuid:application_id>/get-evaluation', views.get_evaluation, name='medecin_get_evaluation'),
    path('add', views.add_doctor, name='medecin_add_doctor'),
    path('<uuid:pk>/update', views.update_doctor, name='medecin_update_doctor'),
    path('<uuid:pk>/delete', views.delete_doctor, name='medecin_delete_doctor'),
]
