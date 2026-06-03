from rest_framework import serializers
from .models import Internship, Application, Document, Evaluation, AttendanceRecord
from core.models import Profile, Notification
from core.serializers import ProfileSerializer


class InternshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Internship
        fields = [
            'id', 'title', 'description', 'department', 'hospital',
            'supervisor', 'start_date', 'end_date', 'duration_weeks',
            'max_students', 'current_students', 'requirements', 'status',
            'is_mandatory', 'target_year', 'created_at', 'updated_at'
        ]

        read_only_fields = [
            'id', 'created_at', 'updated_at', 'current_students', 'supervisor'
        ]

    def validate_start_date(self, value):
        from django.utils import timezone
        import datetime
        
        # If we are updating an existing instance, and the date hasn't changed, allow it
        if self.instance and self.instance.start_date == value:
            return value
            
        # For new instances or changed dates, ensure it's not in the past
        # We compare dates only
        today = timezone.now().date()
        if value < today:
             raise serializers.ValidationError("Start date cannot be in the past")
        return value

class InternshipDetailSerializer(serializers.ModelSerializer):
    """Detailed internship with nested data"""
    class Meta:
        model = Internship
        fields = '__all__'


class ApplicationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating applications"""
    class Meta:
        model = Application
        fields = ['id', 'internship', 'motivation_letter']
        
    def validate(self, data):
        request = self.context.get('request')
        if not request or not request.user:
            raise serializers.ValidationError("User context is required")
            
        student = request.user
        internship = data.get('internship')
        
        # Check for existing application
        existing_app = Application.objects.filter(student=student, internship=internship).first()
        if existing_app:
            # If internship was updated AFTER the application was made
            # AND the previous application was REJECTED, allow re-application
            if internship.updated_at > existing_app.applied_at and existing_app.status == 'rejected':
                # Can add capacity check here too
                if internship.current_students >= internship.max_students:
                     raise serializers.ValidationError("Internship is now full")
                return data
            raise serializers.ValidationError("You have already applied for this internship")
            
        return data

    def create(self, validated_data):
        student = self.context['request'].user
        internship = validated_data['internship']
        
        # Check if we should update an existing application
        existing_app = Application.objects.filter(student=student, internship=internship).first()
        if existing_app:
            # Update existing application
            existing_app.motivation_letter = validated_data['motivation_letter']
            existing_app.status = 'pending'
            
            from django.utils import timezone
            existing_app.applied_at = timezone.now()
            
            # Reset review data
            existing_app.reviewed_at = None
            existing_app.reviewed_by = None
            existing_app.review_notes = None
            
            existing_app.save()
            return existing_app

        # Set default status for new application
        validated_data['status'] = 'pending'
        return super().create(validated_data)


class ApplicationSerializer(serializers.ModelSerializer):
    """Serializer for listing applications with nested internship data"""
    internship = InternshipSerializer(read_only=True)
    student = ProfileSerializer(read_only=True)
    medicine_supervisor = ProfileSerializer(read_only=True)
    evaluation = serializers.SerializerMethodField()
    
    class Meta:
        model = Application
        fields = [
            'id', 'internship', 'student', 'motivation_letter',
            'status', 'applied_at', 'reviewed_at', 'reviewed_by',
            'review_notes', 'medicine_supervisor', 'evaluation'
        ]
        read_only_fields = ['id', 'applied_at', 'reviewed_at']

    def get_evaluation(self, obj):
        evaluation = obj.evaluations.first()
        if evaluation:
            return {
                'id': str(evaluation.id),
                'rating': evaluation.rating,
                'comments': evaluation.comments
            }
        return None


class DocumentSerializer(serializers.ModelSerializer):
    """Serializer for application documents"""
    class Meta:
        model = Document
        fields = '__all__'


class EvaluationSerializer(serializers.ModelSerializer):
    """Serializer for internship evaluations"""
    class Meta:
        model = Evaluation
        fields = ['id', 'application', 'supervisor', 'rating', 'comments', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for user notifications"""
    class Meta:
        model = Notification
        fields = ['id', 'user', 'title', 'message', 'type', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']


class AttendanceRecordSerializer(serializers.ModelSerializer):
    """Serializer for attendance records"""
    class Meta:
        model = AttendanceRecord
        fields = ['id', 'application', 'date', 'status', 'notes', 'recorded_by', 'created_at']
        read_only_fields = ['id', 'created_at']
