from django.contrib import admin
from .models import Profile

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['matricule', 'full_name', 'email', 'role', 'department']
    search_fields = ['matricule', 'full_name', 'email']
    list_filter = ['role', 'department']
