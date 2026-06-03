from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from .models import Document, AttendanceRecord, Application, Profile, Internship
from django.utils import timezone
import uuid
import os

@api_view(['POST'])
def upload_document(request):
    file = request.FILES.get('file')
    application_id = request.data.get('applicationId')
    document_type = request.data.get('documentType')
    user_id = request.data.get('userId')

    if not file:
        return Response({'error': 'No file provided'}, status=400)
    
    if not application_id:
        return Response({'error': 'No application ID provided'}, status=400)

    try:
        # Get the application object
        try:
            application = Application.objects.get(id=application_id)
        except Application.DoesNotExist:
            return Response({'error': f'Application {application_id} not found'}, status=404)
        
        # Save file locally
        filename = f"{application_id}_{document_type}_{file.name}"
        file_path = default_storage.save(filename, ContentFile(file.read()))
        file_url = f"/uploads/{os.path.basename(file_path)}"

        # Create document record using Django ORM with the application object
        document = Document.objects.create(
            id=uuid.uuid4(),
            application_id=application_id,
            document_type=document_type,
            file_name=file.name,
            file_url=file_url,
            file_size=file.size,
            uploaded_by=user_id,
            uploaded_at=timezone.now(),
            created_at=timezone.now()
        )
        
        return Response({
            "message": "Upload successful",
            "data": {
                "id": str(document.id),
                "application_id": str(document.application_id),
                "document_type": document.document_type,
                "file_name": document.file_name,
                "file_url": document.file_url,
                "file_size": document.file_size,
                "uploaded_at": document.uploaded_at
            }
        })
    except Exception as e:
        print(f"Error in upload_document: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def get_application_documents(request, application_id):
    try:
        documents = Document.objects.filter(application_id=application_id).values(
             'id', 'document_type', 'file_name', 'file_url', 'file_size', 'uploaded_by', 'uploaded_at', 'created_at'
        )
        return Response({'documents': list(documents)})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
