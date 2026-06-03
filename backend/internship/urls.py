from django.urls import path
from departement.views import add_student, upload_students
from .views import (
    InternshipListView,
    ApplicationListCreateView,
    NotificationListView,
    NotificationMarkReadView,
    ApplicationEvaluationView,
    SupervisorInternshipListCreateView,
    SupervisorInternshipDetailView,
    SupervisorApplicationListView,
    ApplicationReviewView,
    SupervisorApplicationListView,
    ApplicationReviewView,
    MedicineSupervisorListView,
    DocumentUploadView,
    ReuseDocumentView,
    ApplicationDocumentListView,
    MedicineAssignedApplicationsView,
    AttendanceRecordListCreateView,
    AttendanceRecordDetailView,
    AssignSupervisorView,
    DepartmentInternshipListView,
    DepartmentApplicationListView,
    StudentListView,
    SupervisorListView
)

urlpatterns = [
    # Student endpoints
    path('internships/', InternshipListView.as_view(), name='internship-list'),
    path('applications/', ApplicationListCreateView.as_view(), name='application-list-create'),
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/<uuid:pk>/mark-read/', NotificationMarkReadView.as_view(), name='notification-mark-read'),
    path('applications/<uuid:application_id>/get-evaluation', ApplicationEvaluationView.as_view(), name='application-evaluation-get'),
    path('applications/<uuid:application_id>/evaluation', ApplicationEvaluationView.as_view(), name='application-evaluation-post'),
    path('upload', DocumentUploadView.as_view(), name='document-upload'),
    path('reuse-document', ReuseDocumentView.as_view(), name='document-reuse'),
    path('applications/<uuid:application_id>/documents', ApplicationDocumentListView.as_view(), name='application-documents'),
    
    # Supervisor endpoints
    path('supervisor/internships/', SupervisorInternshipListCreateView.as_view(), name='supervisor-internship-list-create'),
    path('supervisor/internships/<uuid:pk>/', SupervisorInternshipDetailView.as_view(), name='supervisor-internship-detail'),
    path('supervisor/applications/', SupervisorApplicationListView.as_view(), name='supervisor-application-list'),
    path('supervisor/applications/<uuid:pk>/review/', ApplicationReviewView.as_view(), name='application-review'),
    path('applications/<uuid:pk>/assign-supervisor', AssignSupervisorView.as_view(), name='assign-supervisor'),
    
    # Medicine endpoints
    path('medicine-supervisors/', MedicineSupervisorListView.as_view(), name='medicine-supervisor-list'),
    path('medicine/applications/', MedicineAssignedApplicationsView.as_view(), name='medicine-assigned-applications'),
    path('attendance', AttendanceRecordListCreateView.as_view(), name='attendance-create'),
    path('applications/<uuid:application_id>/attendance', AttendanceRecordListCreateView.as_view(), name='attendance-list'),
    path('attendance/<uuid:pk>', AttendanceRecordDetailView.as_view(), name='attendance-detail'),
    
    # Department endpoints
    path('department/internships/', DepartmentInternshipListView.as_view(), name='department-internship-list'),
    path('department/applications/', DepartmentApplicationListView.as_view(), name='department-application-list'),
    path('department/students/', StudentListView.as_view(), name='student-list'),
    path('department/students/add', add_student, name='add_student'),
    path('department/students/upload', upload_students, name='upload_students'),
    path('department/supervisors/', SupervisorListView.as_view(), name='supervisor-list'),
]
