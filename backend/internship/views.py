from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Document, Internship, Application, Evaluation, AttendanceRecord
from core.models import Notification, Profile
from .serializers import (
    InternshipSerializer,
    ApplicationSerializer,
    ApplicationCreateSerializer,
    EvaluationSerializer,
    NotificationSerializer,
    AttendanceRecordSerializer
)
from core.serializers import ProfileSerializer


class InternshipListView(generics.ListAPIView):
    """List all internships, optionally filtered by status"""
    serializer_class = InternshipSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Internship.objects.all().order_by('-created_at')
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset


class SupervisorInternshipListCreateView(generics.ListCreateAPIView):
    """List and create internships for the current supervisor"""
    serializer_class = InternshipSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Return only internships created by the current supervisor
        return Internship.objects.filter(
            supervisor=self.request.user
        ).order_by('-created_at')
    
    def perform_create(self, serializer):
        # Automatically set the supervisor to the current user
        serializer.save(supervisor=self.request.user)


class SupervisorInternshipDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete an internship (supervisor only)"""
    serializer_class = InternshipSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only allow supervisors to modify their own internships
        return Internship.objects.filter(supervisor=self.request.user)


class SupervisorApplicationListView(generics.ListAPIView):
    """List applications for internships created by the supervisor"""
    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Get all applications for internships created by this supervisor
        supervisor_internships = Internship.objects.filter(
            supervisor=self.request.user
        ).values_list('id', flat=True)
        
        return Application.objects.filter(
            internship_id__in=supervisor_internships
        ).select_related('internship', 'student').order_by('-applied_at')


class ApplicationReviewView(APIView):
    """Review an application (accept/reject)"""
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, pk):
        application = get_object_or_404(Application, pk=pk)
        
        # Verify the supervisor owns the internship
        if application.internship.supervisor != request.user:
            return Response(
                {'error': 'You do not have permission to review this application'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        new_status = request.data.get('status')
        review_notes = request.data.get('review_notes', '')
        
        if new_status not in ['accepted', 'rejected']:
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        application.status = new_status
        application.review_notes = review_notes
        application.reviewed_by = request.user.id
        from django.utils import timezone
        application.reviewed_at = timezone.now()
        application.save()
        
        # Create notification for the student
        try:
            Notification.objects.create(
                user=application.student,
                title="Candidature Acceptée" if new_status == 'accepted' else "Candidature Refusée",
                message=f"Félicitations ! Votre candidature pour le stage '{application.internship.title}' a été acceptée." if new_status == 'accepted' else f"Votre candidature pour le stage '{application.internship.title}' a été refusée.",
                type="application_status",
                is_read=False
            )
        except Exception as notif_error:
            print(f"Error creating notification: {str(notif_error)}")

        serializer = ApplicationSerializer(application)
        return Response(serializer.data)



class ApplicationListCreateView(generics.ListCreateAPIView):
    """List applications for the current user or create a new application"""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ApplicationCreateSerializer
        return ApplicationSerializer
    
    def get_queryset(self):
        # Return applications for the current user (student)
        return Application.objects.filter(
            student=self.request.user
        ).select_related('internship').order_by('-applied_at')
    
    def perform_create(self, serializer):
        # Automatically set the student to the current user
        serializer.save(student=self.request.user)


class NotificationListView(generics.ListAPIView):
    """List notifications for the current user"""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(
            user=self.request.user
        ).order_by('-created_at')[:20]


class NotificationMarkReadView(APIView):
    """Mark a notification as read"""
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, pk):
        notification = get_object_or_404(
            Notification,
            pk=pk,
            user=request.user
        )
        notification.is_read = True
        notification.save()
        serializer = NotificationSerializer(notification)
        return Response(serializer.data)


class ApplicationEvaluationView(APIView):
    """Get evaluation for a specific application"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, application_id):
        supervisor_id = request.query_params.get('supervisorId')
        
        if not supervisor_id:
            return Response(
                {'evaluation': None},
                status=status.HTTP_200_OK
            )
        
        try:
            evaluation = Evaluation.objects.get(
                application_id=application_id,
                supervisor_id=supervisor_id
            )
            serializer = EvaluationSerializer(evaluation)
            return Response({'evaluation': serializer.data})
        except Evaluation.DoesNotExist:
            return Response({'evaluation': None})

    def post(self, request, application_id):
        supervisor_id = request.data.get('supervisorId')
        rating = request.data.get('rating')
        comments = request.data.get('comments')
        
        if not all([supervisor_id, rating]):
            return Response(
                {'error': 'Missing required fields'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        evaluation, created = Evaluation.objects.update_or_create(
            application_id=application_id,
            supervisor_id=supervisor_id,
            defaults={
                'rating': rating,
                'comments': comments
            }
        )
        
        serializer = EvaluationSerializer(evaluation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MedicineSupervisorListView(generics.ListAPIView):
    """List all medicine supervisors"""
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Profile.objects.filter(role='medicine')
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = ProfileSerializer(queryset, many=True)
        return Response(serializer.data)


class DocumentUploadView(APIView):
    """Upload a document for an application"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        file = request.FILES.get('file')
        application_id = request.data.get('applicationId')
        document_type = request.data.get('documentType')
        user_id = request.data.get('userId')
        
        if not all([file, application_id, document_type]):
            return Response(
                {'error': 'Missing required fields'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        application = get_object_or_404(Application, pk=application_id)
        
        # Verify user is the student or supervisor
        if request.user.id != application.student.id and request.user.id != application.internship.supervisor.id:
             return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Save file
        from django.core.files.storage import default_storage
        from django.core.files.base import ContentFile
        import os
        
        file_name = f"{application_id}_{document_type}_{file.name}"
        path = default_storage.save(f"documents/{file_name}", ContentFile(file.read()))
        file_url = default_storage.url(path)
        
        from django.utils import timezone
        
        document = Document.objects.create(
            application=application,
            document_type=document_type,
            file_name=file.name,
            file_url=file_url,
            file_size=file.size,
            uploaded_by=request.user.id,
            uploaded_at=timezone.now(),
            created_at=timezone.now()
        )
        
        from .serializers import DocumentSerializer
        serializer = DocumentSerializer(document)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ReuseDocumentView(APIView):
    """Reuse an existing document for a new application"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        application_id = request.data.get('applicationId')
        document_id = request.data.get('documentId')
        
        if not all([application_id, document_id]):
            return Response(
                {'error': 'Missing required fields'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Get the new application
            application = get_object_or_404(Application, pk=application_id)
            
            # Verify user owns the application
            if application.student.id != request.user.id:
                 return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

            # Get the original document and verify ownership
            original_doc = get_object_or_404(Document, pk=document_id)
            if original_doc.uploaded_by != request.user.id:
                 return Response({'error': 'Permission denied to reuse this document'}, status=status.HTTP_403_FORBIDDEN)

            from django.utils import timezone

            # Create new document record pointing to same file
            new_doc = Document.objects.create(
                application=application,
                document_type=original_doc.document_type,
                file_name=original_doc.file_name,
                file_url=original_doc.file_url, # Reusing the URL/Path
                file_size=original_doc.file_size,
                uploaded_by=request.user.id,
                uploaded_at=timezone.now(),
                created_at=timezone.now()
            )

            from .serializers import DocumentSerializer
            serializer = DocumentSerializer(new_doc)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ApplicationDocumentListView(APIView):
    """List documents for an application"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, application_id):
        application = get_object_or_404(Application, pk=application_id)
        
        # Verify user is the student or supervisor
        if request.user.id != application.student.id and request.user.id != application.internship.supervisor.id:
             return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        documents = Document.objects.filter(application=application)
        
        from .serializers import DocumentSerializer
        serializer = DocumentSerializer(documents, many=True)
        return Response({'documents': serializer.data})


class MedicineAssignedApplicationsView(generics.ListAPIView):
    """List applications assigned to the current medicine supervisor"""
    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Application.objects.filter(
            medicine_supervisor=self.request.user,
            status='accepted'
        ).select_related('internship', 'student').order_by('-applied_at')


class AttendanceRecordListCreateView(APIView):
    """List and create attendance records"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, application_id=None):
        if application_id:
            records = AttendanceRecord.objects.filter(
                application_id=application_id
            ).order_by('-date')
            serializer = AttendanceRecordSerializer(records, many=True)
            return Response({'attendance': serializer.data})
        return Response({'error': 'Application ID required'}, status=status.HTTP_400_BAD_REQUEST)
        
    def post(self, request, application_id=None):
        serializer = AttendanceRecordSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'attendance': serializer.data}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AttendanceRecordDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete attendance record"""
    queryset = AttendanceRecord.objects.all()
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAuthenticated]
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({'attendance': serializer.data})


class AssignSupervisorView(APIView):
    """Assign a medicine supervisor to an application"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        application = get_object_or_404(Application, pk=pk)
        
        # Verify user is the supervisor of the internship
        if application.internship.supervisor != request.user:
             return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )

        supervisor_id = request.data.get('supervisor_id')
        if not supervisor_id:
            return Response(
                {'error': 'Supervisor ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        medicine_supervisor = get_object_or_404(Profile, pk=supervisor_id, role='medicine')
        
        application.medicine_supervisor = medicine_supervisor
        application.save()
        
        # Create notification for the student
        try:
            Notification.objects.create(
                user=application.student,
                title="Médecin encadrant assigné",
                message=f"Le Dr. {medicine_supervisor.full_name} a été assigné comme votre encadrant pour le stage '{application.internship.title}'.",
                type="supervisor_assignment",
                is_read=False
            )
        except Exception as notif_error:
            print(f"Error creating notification: {str(notif_error)}")

        serializer = ApplicationSerializer(application)
        return Response(serializer.data)


class DepartmentInternshipListView(generics.ListAPIView):
    """List all internships for department head"""
    serializer_class = InternshipSerializer
    permission_classes = [IsAuthenticated]
    queryset = Internship.objects.all().order_by('-created_at')


class DepartmentApplicationListView(generics.ListAPIView):
    """List all applications for department head"""
    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        if user.role == 'department_head':
            from django.db.models import Q
            if user.department:
                return Application.objects.filter(
                    Q(student__added_by=user) | Q(student__department=user.department)
                ).select_related('internship', 'student').order_by('-applied_at')
            return Application.objects.filter(student__added_by=user).select_related('internship', 'student').order_by('-applied_at')
        return Application.objects.all().select_related('internship', 'student').order_by('-applied_at')


class StudentListView(generics.ListAPIView):
    """List all students"""
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'department_head':
            from django.db.models import Q
            if user.department:
                return Profile.objects.filter(
                    Q(role='student') & (Q(added_by=user) | Q(department=user.department))
                ).order_by('-created_at')
            return Profile.objects.filter(role='student', added_by=user).order_by('-created_at')
        return Profile.objects.filter(role='student').order_by('-created_at')


class SupervisorListView(generics.ListAPIView):
    """List all supervisors"""
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Profile.objects.filter(role='supervisor').order_by('-created_at')
