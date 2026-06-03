from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Profile
from .serializers import ProfileSerializer, CustomTokenObtainPairSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # request.user is already a Profile instance since AUTH_USER_MODEL = 'core.Profile'
        serializer = ProfileSerializer(request.user)
        return Response(serializer.data)

from rest_framework import status
from django.shortcuts import get_object_or_404

class AdminUserManagementView(APIView):
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        # Ensure only admin can access
        return [IsAuthenticated()] # Simplified constraint, logic check in method

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        role_filter = request.query_params.get('role')
        if role_filter:
            users = Profile.objects.filter(role=role_filter)
        else:
            users = Profile.objects.all()
            
        serializer = ProfileSerializer(users, many=True)
        return Response(serializer.data)

    def post(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
            
        data = request.data
        required_fields = ['matricule', 'full_name', 'password', 'role']
        if not all(field in data for field in required_fields):
            return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Prevent creating another admin via this simplified endpoint if desired, or allow it.
        # Strict validation
        allowed_roles = ['supervisor', 'medicine', 'department_head', 'student']
        if data['role'] not in allowed_roles:
             return Response({'error': f'Invalid role. Allowed: {allowed_roles}'}, status=status.HTTP_400_BAD_REQUEST)

        if Profile.objects.filter(matricule=data['matricule']).exists():
            return Response({'error': 'User with this matricule already exists'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = Profile.objects.create_user(
                matricule=data['matricule'],
                email=data.get('email', f"{data['matricule']}@institution.local"),
                full_name=data['full_name'],
                password=data['password'],
                role=data['role'],
                department=data.get('department', ''),
                hospital_affiliation=data.get('hospital_affiliation', ''),
                phone=data.get('phone', '')
            )
            return Response(ProfileSerializer(user).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

from api.models import Application, Evaluation, Notification, Internship, AttendanceRecord, Document, Profile as ApiProfile

class AdminUserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
            
        user = get_object_or_404(Profile, pk=pk)
        
        # Prevent self-deletion
        if user.id == request.user.id:
             return Response({'error': 'Cannot delete your own account'}, status=status.HTTP_400_BAD_REQUEST)
             
        try:
            # Cleanup logic based on role or generic cleanup
            
            # 1. Notifications (All users)
            Notification.objects.filter(user_id=user.id).delete()
            
            # 2. Documents (Students, potentially others)
            # Find documents uploaded by this user
            Document.objects.filter(uploaded_by=user.id).delete()
            
            # 3. Medicine Role Cleanup
            if user.role == 'medicine':
                # Unassign from applications
                Application.objects.filter(medicine_supervisor_id=user.id).update(medicine_supervisor=None)
                # Delete given evaluations
                Evaluation.objects.filter(supervisor_id=user.id).delete()
                
            # 4. Supervisor Role Cleanup
            if user.role == 'supervisor':
                # Delete internships (and cascade applications?)
                # Applications usually cascade on internship delete, but let's be safe
                internships = Internship.objects.filter(supervisor_id=user.id)
                for internship in internships:
                    # Cascading application deletion might need manual trigger if limits exist
                    Application.objects.filter(internship_id=internship.id).delete()
                internships.delete()
                
                # Delete given evaluations
                Evaluation.objects.filter(supervisor_id=user.id).delete()
                
            # 5. Student Role Cleanup
            if user.role == 'student':
                 # Applications
                 # First delete attendance records for these applications
                 user_applications = Application.objects.filter(student_id=user.id)
                 for app in user_applications:
                     AttendanceRecord.objects.filter(application_id=app.id).delete()
                     Evaluation.objects.filter(application_id=app.id).delete()
                     # Documents linked to application?
                     Document.objects.filter(application_id=app.id).delete()
                 
                 user_applications.delete()

            # Final deletion using Raw SQL to bypass possible UUID/Int mismatches in django_admin_log
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM profiles WHERE id = %s", [str(user.id)])
                
            return Response({'message': 'User deleted successfully'}, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"Error deleting user {user.matricule}: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': f"Failed to delete user: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
