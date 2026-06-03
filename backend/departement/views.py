from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.models import Profile
from django.shortcuts import get_object_or_404
from django.db.models import Q
import openpyxl
import uuid

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_student(request):
    try:
        # Verify user is department head
        if request.user.role != 'department_head':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data
        
        # Validate required fields
        required_fields = ['matricule', 'full_name', 'password']
        for field in required_fields:
            if not data.get(field):
                return Response({'error': f'{field} is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if student already exists
        if Profile.objects.filter(matricule=data.get('matricule')).exists():
            return Response({'error': 'Student with this matricule already exists'}, status=status.HTTP_400_BAD_REQUEST)


        # Create student
        email = data.get('email', '').strip()
        # If no email provided, generate a unique placeholder to satisfy unique constraint
        if not email:
            email = f"noemail_{data.get('matricule')}@placeholder.local"
        
        student = Profile.objects.create_user(
            matricule=data.get('matricule'),
            email=email,
            full_name=data.get('full_name'),
            password=data.get('password'),
            role='student',
            department=request.user.department, # Assign to same department as head
            year_of_study=data.get('year_of_study'),
            phone=data.get('phone', ''),
            added_by=request.user
        )

        return Response({
            'message': 'Student created successfully',
            'student': {
                'id': student.id,
                'full_name': student.full_name,
                'matricule': student.matricule
            }
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def manage_student(request, pk):
    try:
        if request.user.role != 'department_head':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        student = get_object_or_404(Profile, pk=pk, role='student')

        # Enforce strict ownership: only the creator can edit/delete
        # If accessing code was updated to backfill, checking added_by is safe.
        # Fallback to department check if needed? No, user explicitly requested strict isolation.
        if student.added_by != request.user:
             return Response({'error': 'Permission denied: You did not add this student.'}, status=status.HTTP_403_FORBIDDEN)

        if request.method == 'DELETE':
            # Manually clean up ALL related objects to avoid ForeignKey constraint errors
            from core.models import Notification
            from internship.models import Application, Document, AttendanceRecord, Evaluation
            
            # 1. Delete Notifications
            Notification.objects.filter(user=student).delete()
            
            # 2. Get all applications for this student
            student_applications = Application.objects.filter(student=student)
            
            # 3. For each application, delete its children
            for app in student_applications:
                # Delete related Documents
                Document.objects.filter(application=app).delete()
                # Delete related Attendance Records
                AttendanceRecord.objects.filter(application=app).delete()
                # Delete related Evaluations
                Evaluation.objects.filter(application=app).delete()
            
            # 4. Now safe to delete the applications
            student_applications.delete()
            
            # 5. Finally delete the student using RAW SQL
            # We use raw SQL because student.delete() triggers Django to look for 'profiles_groups'
            # (due to permissions mixin) which does not exist in this DB, causing a crash.
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM profiles WHERE id = %s", [student.id])
            
            return Response({'message': 'Student deleted successfully'}, status=status.HTTP_200_OK)

        elif request.method == 'PUT':
            data = request.data
            
            # Update fields
            if 'full_name' in data:
                student.full_name = data['full_name']
            if 'email' in data:
                student.email = data['email']
            if 'phone' in data:
                student.phone = data['phone']
            if 'year_of_study' in data:
                student.year_of_study = data['year_of_study']
            if 'matricule' in data:
                # Check uniqueness if changed
                if data['matricule'] != student.matricule:
                    if Profile.objects.filter(matricule=data['matricule']).exists():
                        return Response({'error': 'Matricule already in use'}, status=status.HTTP_400_BAD_REQUEST)
                    student.matricule = data['matricule']
            
            # Handle password update if provided
            if 'password' in data and data['password']:
                student.set_password(data['password'])

            student.save()
            
            return Response({
                'message': 'Student updated successfully',
                'student': {
                    'id': student.id,
                    'full_name': student.full_name,
                    'matricule': student.matricule
                }
            })

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_students(request):
    try:
        # Verify user is department head
        if request.user.role != 'department_head':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        if 'file' not in request.FILES:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        excel_file = request.FILES['file']
        wb = openpyxl.load_workbook(excel_file)
        worksheet = wb.active

        created_count = 0
        errors = []

        # Assuming headers are in first row: Matricule, Full Name, Email, Year, Phone
        for row_idx, row in enumerate(worksheet.iter_rows(min_row=2, values_only=True), start=2):
            matricule, full_name, email, year, phone = row[0], row[1], row[2], row[3], row[4]
            
            if not matricule:
                continue

            try:
                if not Profile.objects.filter(matricule=matricule).exists():
                    Profile.objects.create_user(
                        matricule=str(matricule),
                        email=email,
                        full_name=full_name,
                        password='password123',
                        role='student',
                        department=request.user.department,
                        year_of_study=int(year) if year else None,
                        phone=str(phone) if phone else '',
                        added_by=request.user 
                    )
                    created_count += 1
                else:
                    errors.append(f"Row {row_idx}: Student {matricule} already exists")
            except Exception as e:
                errors.append(f"Row {row_idx}: {str(e)}")

        return Response({
            'message': f'Successfully created {created_count} students',
            'errors': errors
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_hospital_network(request):
    try:
        # Verify user is department head
        if request.user.role != 'department_head':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        # Fetch all medicine doctors and supervisors
        doctors = Profile.objects.filter(Q(role='medicine') | Q(role='supervisor'))
        
        # Fetch all internships
        from internship.models import Internship
        internships = Internship.objects.all()

        # Aggregate data
        network_data = {}

        # Process doctors to build structure
        for doctor in doctors:
            hospital = (doctor.hospital_affiliation or "Non affilié").strip()
            service = (doctor.department or "Service général").strip()
            
            if hospital not in network_data:
                network_data[hospital] = {
                    'name': hospital,
                    'services': {}
                }
            
            if service not in network_data[hospital]['services']:
                network_data[hospital]['services'][service] = {
                    'name': service,
                    'supervisors_count': 0,
                    'internships_count': 0,
                    'capacity': 0,
                    'occupancy': 0
                }
            
            network_data[hospital]['services'][service]['supervisors_count'] += 1

        # Process internships to add capacity data
        for internship in internships:
            hospital = (internship.hospital or "Non spécifié").strip()
            service = (internship.department or "Service général").strip()
            
            # Ensure structure exists even if no doctors are there (though unlikely for valid internships)
            if hospital not in network_data:
                network_data[hospital] = {
                    'name': hospital,
                    'services': {}
                }
            
            if service not in network_data[hospital]['services']:
                network_data[hospital]['services'][service] = {
                    'name': service,
                    'supervisors_count': 0,
                    'internships_count': 0,
                    'capacity': 0,
                    'occupancy': 0
                }

            network_data[hospital]['services'][service]['internships_count'] += 1
            network_data[hospital]['services'][service]['capacity'] += internship.max_students
            network_data[hospital]['services'][service]['occupancy'] += internship.current_students

        # Format response
        response_data = []
        for hospital_name, hospital_data in network_data.items():
            hospital_entry = {
                'name': hospital_name,
                'total_supervisors': 0,
                'total_capacity': 0,
                'current_occupancy': 0,
                'services': []
            }
            
            for service_name, service_data in hospital_data['services'].items():
                hospital_entry['total_supervisors'] += service_data['supervisors_count']
                hospital_entry['total_capacity'] += service_data['capacity']
                hospital_entry['current_occupancy'] += service_data['occupancy']
                hospital_entry['services'].append(service_data)
            
            response_data.append(hospital_entry)

        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
