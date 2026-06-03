from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
import uuid

class ProfileManager(BaseUserManager):
    def create_user(self, matricule, email, full_name, password=None, **extra_fields):
        if not matricule:
            raise ValueError('The Matricule field must be set')
        if email:
            email = self.normalize_email(email)
        user = self.model(matricule=matricule, email=email, full_name=full_name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, matricule, email, full_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        # Default 'department' to empty string for admin if not provided
        extra_fields.setdefault('department', '')
        
        return self.create_user(matricule, email, full_name, password, **extra_fields)

class Profile(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    matricule = models.CharField(max_length=50, unique=True)
    full_name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=50)  # student, supervisor, department_head, medicine, admin
    department = models.CharField(max_length=255, blank=True, null=True)
    year_of_study = models.IntegerField(blank=True, null=True)
    hospital_affiliation = models.CharField(max_length=255, blank=True, null=True)
    added_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='added_students')
    
    # Required fields for AbstractBaseUser
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = ProfileManager()

    USERNAME_FIELD = 'matricule'
    REQUIRED_FIELDS = ['email', 'full_name']

    class Meta:
        db_table = 'profiles'
        managed = True  # Changed to True to allow migration of auth fields

    def __str__(self):
        return f"{self.full_name} ({self.matricule})"

class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=50)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        managed = False

    def __str__(self):
        return f"{self.title} - {self.user.full_name}"
