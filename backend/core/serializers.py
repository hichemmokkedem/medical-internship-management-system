from rest_framework import serializers
from .models import Profile
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Since USERNAME_FIELD is 'matricule', simplejwt expects 'matricule' in attrs.
        # We don't need to rename it to 'username'.
        return super().validate(attrs)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['full_name'] = user.full_name
        token['role'] = user.role
        return token

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['id', 'matricule', 'full_name', 'email', 'phone', 'role', 'department', 'year_of_study', 'hospital_affiliation']
        read_only_fields = ['id', 'role', 'matricule'] # Role and matricule should generally not be editable by user
