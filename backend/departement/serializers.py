from rest_framework import serializers
from core.models import Profile

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['id', 'matricule', 'full_name', 'email', 'phone', 'department', 'year_of_study', 'created_at']
        read_only_fields = ['id', 'created_at']
