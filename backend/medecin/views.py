from rest_framework.decorators import api_view
from rest_framework.response import Response
from api.models import AttendanceRecord, Application, Evaluation, Notification, Internship
from core.models import Profile


from django.utils import timezone
import uuid

@api_view(['POST'])
def record_attendance(request):
    try:
        application_id = request.data.get('applicationId')
        if not application_id:
            return Response({'error': 'No application ID provided'}, status=400)
        
        try:
            application = Application.objects.get(id=application_id)
        except Application.DoesNotExist:
            return Response({'error': f'Application {application_id} not found'}, status=404)
        
        attendance = AttendanceRecord.objects.create(
            application=application,
            date=request.data.get('date'),
            status=request.data.get('status'),
            notes=request.data.get('notes'),
            recorded_by=request.data.get('recordedBy')
        )
        
        return Response({
            'attendance': {
                'id': str(attendance.id),
                'application_id': str(attendance.application.id),
                'date': attendance.date,
                'status': attendance.status,
                'notes': attendance.notes,
                'recorded_by': str(attendance.recorded_by)
            }
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET', 'PUT'])
def handle_attendance_detail(request, id):
    if request.method == 'GET':
        # id is applicationId
        try:
            records = AttendanceRecord.objects.filter(
                application__id=id
            ).order_by('-date').values(
                'id', 'application_id', 'date', 'status', 'notes', 'recorded_by', 'created_at'
            )
            return Response({'attendance': list(records)})
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    
    elif request.method == 'PUT':
        # id is attendance record id
        try:
            attendance = AttendanceRecord.objects.get(id=id)
            attendance.status = request.data.get('status', attendance.status)
            attendance.notes = request.data.get('notes', attendance.notes)
            attendance.save()
            
            return Response({
                'attendance': {
                    'id': str(attendance.id),
                    'application_id': str(attendance.application.id),
                    'date': attendance.date,
                    'status': attendance.status,
                    'notes': attendance.notes,
                    'recorded_by': str(attendance.recorded_by)
                }
            })
        except AttendanceRecord.DoesNotExist:
            return Response({'error': 'Attendance record not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def get_medicine_supervisors(request):
    try:
        supervisors = Profile.objects.filter(role='medicine').values(
            'id', 'full_name', 'email', 'department', 'hospital_affiliation'
        )
        return Response(list(supervisors))
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
def assign_supervisor(request, application_id):
    try:
        supervisor_id = request.data.get('supervisor_id')
        if not supervisor_id:
            return Response({'error': 'Supervisor ID is required'}, status=400)
        
        # Verify the application exists
        try:
            application = Application.objects.get(id=application_id)
        except Application.DoesNotExist:
            return Response({'error': 'Application not found'}, status=404)
        
        # Verify the supervisor exists and has the right role
        try:
            supervisor = Profile.objects.get(id=supervisor_id, role='medicine')
        except Profile.DoesNotExist:
            return Response({'error': 'Supervisor not found or invalid role'}, status=404)
        
        # Use raw SQL to update since managed=False
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE applications SET medicine_supervisor_id = %s WHERE id = %s",
                [supervisor_id, application_id]
            )
        
        return Response({'message': 'Supervisor assigned successfully'})
    except Exception as e:
        print(f"Error in assign_supervisor: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
def submit_evaluation(request, application_id):
    try:
        application = Application.objects.get(id=application_id)
        supervisor_id = request.data.get('supervisorId')
        
        # Check if evaluation already exists and update or create
        evaluation, created = Evaluation.objects.update_or_create(
            application=application,
            supervisor_id=supervisor_id,
            defaults={
                'rating': request.data.get('rating'),
                'comments': request.data.get('comments')
            }
        )
        
        # Create notification for the student
        try:
            Notification.objects.create(
                user=application.student,
                title="Nouvelle évaluation",
                message=f"Vous avez reçu une nouvelle évaluation pour votre stage '{application.internship.title}'. Note: {evaluation.rating}/20",
                type="evaluation",
                is_read=False
            )
        except Exception as notif_error:
            print(f"Error creating notification: {str(notif_error)}")
            # Don't fail the request if notification fails
        
        return Response({
            'message': 'Evaluation submitted successfully',
            'evaluation': {
                'id': str(evaluation.id),
                'rating': evaluation.rating,
                'comments': evaluation.comments,
                'created_at': evaluation.created_at,
                'updated_at': evaluation.updated_at
            }
        })
    except Application.DoesNotExist:
        return Response({'error': 'Application not found'}, status=404)
    except Exception as e:
        print(f"Error in submit_evaluation: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def get_evaluation(request, application_id):
    try:
        supervisor_id = request.GET.get('supervisorId')

        if not supervisor_id:
            return Response({"evaluation": None})

        evaluation = Evaluation.objects.filter(
            application_id=application_id,
            supervisor_id=supervisor_id
        ).first()
        
        return Response({'evaluation': evaluation and {
            'id': str(evaluation.id),
            'rating': evaluation.rating,
            'comments': evaluation.comments,
            'created_at': evaluation.created_at,
            'updated_at': evaluation.updated_at
        }})
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
def add_doctor(request):
    try:
        # Verify user is supervisor
        if request.user.role != 'supervisor':
            return Response({'error': 'Unauthorized'}, status=403)

        data = request.data
        
        # Validate required fields
        required_fields = ['matricule', 'full_name', 'password', 'email']
        for field in required_fields:
            if not data.get(field):
                return Response({'error': f'{field} is required'}, status=400)
        
        # Check if doctor already exists
        if Profile.objects.filter(matricule=data.get('matricule')).exists():
            return Response({'error': 'Doctor with this matricule already exists'}, status=400)

        # Create doctor
        doctor = Profile.objects.create_user(
            matricule=data.get('matricule'),
            email=data.get('email'),
            full_name=data.get('full_name'),
            password=data.get('password'),
            role='medicine',
            department=data.get('department', ''),
            hospital_affiliation=data.get('hospital_affiliation', ''),
            phone=data.get('phone', '')
        )

        return Response({
            'message': 'Doctor created successfully',
            'doctor': {
                'id': str(doctor.id),
                'full_name': doctor.full_name,
                'matricule': doctor.matricule
            }
        }, status=201)

    except Exception as e:
        return Response({'error': str(e)}, status=400)


@api_view(['PUT'])
def update_doctor(request, pk):
    try:
        # Verify user is supervisor
        if request.user.role != 'supervisor':
            return Response({'error': 'Unauthorized'}, status=403)

        try:
            doctor = Profile.objects.get(pk=pk, role='medicine')
        except Profile.DoesNotExist:
            return Response({'error': 'Doctor not found'}, status=404)

        data = request.data
        
        doctor.full_name = data.get('full_name', doctor.full_name)
        doctor.email = data.get('email', doctor.email)
        doctor.department = data.get('department', doctor.department)
        doctor.hospital_affiliation = data.get('hospital_affiliation', doctor.hospital_affiliation)
        doctor.phone = data.get('phone', doctor.phone)
        
        if data.get('password'):
            doctor.set_password(data.get('password'))
            
        doctor.save()

        return Response({
            'message': 'Doctor updated successfully',
            'doctor': {
                'id': str(doctor.id),
                'full_name': doctor.full_name,
                'email': doctor.email,
                'department': doctor.department,
                'hospital_affiliation': doctor.hospital_affiliation,
                'phone': doctor.phone
            }
        })

    except Exception as e:
        return Response({'error': str(e)}, status=400)


@api_view(['DELETE'])
def delete_doctor(request, pk):
    try:
        # Verify user is supervisor
        if request.user.role != 'supervisor':
            return Response({'error': 'Unauthorized'}, status=403)

        try:
            doctor = Profile.objects.get(pk=pk, role='medicine')
        except Profile.DoesNotExist:
            return Response({'error': 'Doctor not found'}, status=404)

        # Manually cleanup related objects to avoid IntegrityError if DB constraints are strict
        
        # 1. Remove supervisor from applications
        try:
            Application.objects.filter(medicine_supervisor_id=doctor.id).update(medicine_supervisor=None)
        except Exception as e:
            raise Exception(f"Failed to unassign applications: {str(e)}")
        
        # 2. Delete evaluations given by this supervisor
        try:
            Evaluation.objects.filter(supervisor_id=doctor.id).delete()
        except Exception as e:
            raise Exception(f"Failed to delete evaluations: {str(e)}")

        # 3. Delete notifications for this user
        try:
            Notification.objects.filter(user_id=doctor.id).delete()
        except Exception as e:
            raise Exception(f"Failed to delete notifications: {str(e)}")
        
        # 4. Delete internships supervised by this user
        try:
            Internship.objects.filter(supervisor_id=doctor.id).delete()
        except Exception as e:
            raise Exception(f"Failed to delete internships: {str(e)}")

        # 5. Delete the doctor profile
        # Use raw SQL to bypass Django's cascade deletion which fails on django_admin_log type mismatch
        # (django_admin_log.user_id is integer vs Profile.id is UUID)
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM profiles WHERE id = %s", [str(doctor.id)])
        except Exception as e:
             # Fallback or re-raise with context
             raise Exception(f"Failed to delete doctor profile (Raw SQL): {str(e)}")

        return Response({'message': 'Doctor deleted successfully'})

    except Exception as e:
        print(f"Error deleting doctor: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=400)

