"""
Script to create test users for each role in the system.
Run with: python manage.py shell < create_users.py
Or: python create_users.py (from the backend directory)
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Profile

users = [
    {
        'matricule': 'ETU001',
        'full_name': 'Ahmed Benali',
        'email': 'etudiant@test.com',
        'role': 'student',
        'department': 'Médecine Générale',
        'year_of_study': 4,
        'phone': '0550000001',
        'password': 'password123',
    },
    {
        'matricule': 'MED001',
        'full_name': 'Dr. Karim Mansouri',
        'email': 'medecin@test.com',
        'role': 'medicine',
        'hospital_affiliation': 'CHU Mustapha Bacha',
        'phone': '0550000002',
        'password': 'password123',
    },
    {
        'matricule': 'CHF001',
        'full_name': 'Dr. Fatima Zaoui',
        'email': 'chefservice@test.com',
        'role': 'supervisor',
        'department': 'Cardiologie',
        'hospital_affiliation': 'CHU Mustapha Bacha',
        'phone': '0550000003',
        'password': 'password123',
    },
    {
        'matricule': 'DEP001',
        'full_name': 'Pr. Mohamed Hadj',
        'email': 'chefdept@test.com',
        'role': 'department_head',
        'department': 'Médecine Générale',
        'phone': '0550000004',
        'password': 'password123',
    },
    {
        'matricule': 'RES001',
        'full_name': 'Nadia Berrabah',
        'email': 'responsable@test.com',
        'role': 'admin',
        'department': 'Administration',
        'phone': '0550000005',
        'password': 'password123',
        'is_staff': True,
    },
]

print("\n" + "="*55)
print("  Creation des comptes utilisateurs de test")
print("="*55)

created_count = 0
skipped_count = 0

for user_data in users:
    matricule = user_data['matricule']
    password = user_data.pop('password')
    is_staff = user_data.pop('is_staff', False)

    if Profile.objects.filter(matricule=matricule).exists():
        print(f"  [SKIP]    {matricule} ({user_data['full_name']}) existe deja")
        skipped_count += 1
        continue

    user = Profile.objects.create_user(
        password=password,
        **user_data,
    )
    user.is_staff = is_staff
    user.save()
    print(f"  [OK]      [{user_data['role'].upper():15}] {user_data['full_name']} | matricule: {matricule} | pass: password123")
    created_count += 1

print("="*55)
print(f"  {created_count} compte(s) cree(s), {skipped_count} ignore(s).")
print("="*55 + "\n")
