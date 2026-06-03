from django.db import models
import uuid

class Profile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name = models.CharField(max_length=255)
    matricule = models.CharField(max_length=50, unique=True)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=50)  # student, supervisor, department_head, medicine_supervisor
    department = models.CharField(max_length=255, blank=True, null=True)
    year_of_study = models.IntegerField(blank=True, null=True)
    hospital_affiliation = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'profiles'
        managed = False

    def __str__(self):
        return f"{self.full_name} ({self.matricule})"


class Internship(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    department = models.CharField(max_length=255)
    hospital = models.CharField(max_length=255)
    supervisor = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='supervised_internships')
    start_date = models.DateField()
    end_date = models.DateField()
    duration_weeks = models.IntegerField()
    max_students = models.IntegerField()
    current_students = models.IntegerField(default=0)
    requirements = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, default='open')  # open, in_progress, completed, closed
    is_mandatory = models.BooleanField(default=False)
    target_year = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'internships'
        managed = True

    def __str__(self):
        return self.title


class Application(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    internship = models.ForeignKey(Internship, on_delete=models.CASCADE, related_name='applications')
    student = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='applications')
    motivation_letter = models.TextField()
    status = models.CharField(max_length=50, default='pending')  # pending, accepted, rejected, withdrawn
    applied_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    reviewed_by = models.UUIDField(blank=True, null=True)
    review_notes = models.TextField(blank=True, null=True)
    medicine_supervisor = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, blank=True, related_name='supervised_applications')

    class Meta:
        db_table = 'applications'
        managed = True

    def __str__(self):
        return f"{self.student.full_name} - {self.internship.title}"


class Document(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application_id = models.UUIDField()
    document_type = models.TextField()
    file_name = models.TextField()
    file_url = models.TextField()
    file_size = models.IntegerField()
    uploaded_by = models.UUIDField()
    uploaded_at = models.DateTimeField()
    created_at = models.DateTimeField()

    class Meta:
        db_table = 'documents'
        managed = True

    def __str__(self):
        return f"{self.name} ({self.type})"


class AttendanceRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    status = models.CharField(max_length=50)  # present, absent, excused
    notes = models.TextField(blank=True, null=True)
    recorded_by = models.UUIDField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'project_attendance_records'
        managed = True
        unique_together = ('application', 'date')

    def __str__(self):
        return f"{self.application.student.full_name} - {self.date} - {self.status}"


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
        managed = True

    def __str__(self):
        return f"{self.title} - {self.user.full_name}"


class Evaluation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='evaluations')
    supervisor = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='given_evaluations')
    rating = models.IntegerField()  # 1-10
    comments = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'project_evaluations'
        managed = True
        unique_together = ('application', 'supervisor')

    def __str__(self):
        return f"Evaluation for {self.application.student.full_name} by {self.supervisor.full_name}"
