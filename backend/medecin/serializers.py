from rest_framework import serializers
from api.models import AttendanceRecord, Evaluation

class AttendanceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceRecord
        fields = ['id', 'application', 'date', 'status', 'notes', 'recorded_by', 'created_at', 'updated_at']

class EvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evaluation
        fields = ['id', 'application', 'supervisor', 'rating', 'comments', 'created_at', 'updated_at']
