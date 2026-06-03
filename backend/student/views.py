from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.models import Profile
from api.models import Application

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student_profile(request):
    """Get the current student's profile"""
    try:
        if request.user.role != 'student':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        return Response({
            'id': str(request.user.id),
            'matricule': request.user.matricule,
            'full_name': request.user.full_name,
            'email': request.user.email,
            'phone': request.user.phone,
            'department': request.user.department,
            'year_of_study': request.user.year_of_study,
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student_applications(request):
    """Get all applications for the current student"""
    try:
        if request.user.role != 'student':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        applications = Application.objects.filter(student=request.user).select_related(
            'internship', 'internship__supervisor'
        ).values(
            'id', 'status', 'applied_at', 'reviewed_at',
            'internship__title', 'internship__department', 'internship__hospital',
            'internship__start_date', 'internship__end_date'
        )
        
        return Response({'applications': list(applications)})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student_documents(request):
    """Get all documents uploaded by the current student"""
    try:
        from internship.models import Document
        from internship.serializers import DocumentSerializer
        
        # Fetch documents uploaded by this user
        documents = Document.objects.filter(uploaded_by=request.user.id).order_by('-uploaded_at')
        
        # We might want to distinct by filename or just return all history
        # For simplicity, returning all history so user can choose
        serializer = DocumentSerializer(documents, many=True)
        
        return Response({'documents': serializer.data})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
