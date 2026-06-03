# Comptes de Test / Test Accounts

Voici les comptes de test pré-configurés pour tester l'application. Vous pouvez exécuter le script de création de ces comptes en lançant la commande suivante dans le dossier `backend` :

```bash
python manage.py shell < create_users.py
```
Ou en exécutant directement :
```bash
python create_users.py
```

## Identifiants de connexion

| Rôle | Nom | Email | Mot de passe | Matricule | Informations Supplémentaires |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin (Responsable)** | Nadia Berrabah | `responsable@test.com` | `password123` | `RES001` | Administration |
| **Chef de Département** | Pr. Mohamed Hadj | `chefdept@test.com` | `password123` | `DEP001` | Médecine Générale |
| **Chef de Service (Superviseur)** | Dr. Fatima Zaoui | `chefservice@test.com` | `password123` | `CHF001` | Cardiologie, CHU Mustapha Bacha |
| **Médecin (Encadrant)** | Dr. Karim Mansouri | `medecin@test.com` | `password123` | `MED001` | CHU Mustapha Bacha |
| **Étudiant** | Ahmed Benali | `etudiant@test.com` | `password123` | `ETU001` | Médecine Générale, 4ème année |

> [!NOTE]
> Tous les comptes utilisent le même mot de passe par défaut : `password123`.
