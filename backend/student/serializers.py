from rest_framework import serializers
from core.models import Profile
from api.models import Application

class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['id', 'matricule', 'full_name', 'email', 'phone', 'department', 'year_of_study']
        read_only_fields = ['id']

class StudentApplicationSerializer(serializers.ModelSerializer):
    internship_title = serializers.CharField(source='internship.title', read_only=True)
    internship_department = serializers.CharField(source='internship.department', read_only=True)
    
    class Meta:
        model = Application
        fields = ['id', 'status', 'applied_at', 'reviewed_at', 'internship_title', 'internship_department']
        read_only_fields = ['id', 'applied_at', 'reviewed_at']
