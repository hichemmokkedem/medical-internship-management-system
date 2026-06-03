# Medical Internship Management System

> **A comprehensive Medical Internship Management System** designed to streamline internship placements, student applications, document uploads, and attendance tracking. Built with React (Vite, Tailwind CSS) for a modern frontend, Django REST Framework (Python) for a robust API, and MySQL for secure data persistence.

Application de gestion des stages médicaux avec **React (JavaScript)** pour le frontend et **Django** pour le backend, utilisant **MySQL** comme base de données.

## Architecture

### Frontend
- **React 18** (JavaScript pur, sans TypeScript)
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icônes
- **Supabase JS** - Authentification uniquement

### Backend
- **Django 5.2** - Framework Python
- **Django REST Framework** - API REST
- **MySQL** - Base de données
- **PyMySQL** - Driver MySQL (avec compatibilité MySQLdb)

## Installation

### Prérequis
- Python 3.8+
- Node.js 18+
- npm

### 1. Installer les dépendances

#### Frontend (Node.js)
```bash
npm install
```

#### Backend (Python)
```bash
pip install -r backend/requirments.txt
```

### 2. Configuration

Créez un fichier `.env` à la racine du projet :

```env
# Frontend (Supabase Auth)
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anonyme

# Backend (MySQL Database)
DB_NAME=internship_db
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_mysql
DB_HOST=127.0.0.1
DB_PORT=3306
```

## Lancement de l'application

### Terminal 1 - Backend Django
```bash
npm run server
```
ou
```bash
python backend/manage.py runserver 3001
```

### Terminal 2 - Frontend React
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## Structure du projet

```
project/
├── backend/                 # Backend Django
│   ├── api/                # Application API
│   │   ├── models.py      # Modèles de données (ORM)
│   │   ├── views.py       # Vues API
│   │   └── urls.py        # Routes API
│   ├── config/            # Configuration Django
│   │   ├── settings.py    # Paramètres
│   │   └── urls.py        # URLs principales
│   └── manage.py          # CLI Django
├── src/                    # Frontend React
│   ├── components/        # Composants React
│   ├── contexts/          # Contextes React
│   └── lib/               # Utilitaires
├── uploads/               # Fichiers uploadés
└── package.json           # Dépendances Node.js

```

## Fonctionnalités

- **Authentification** via Supabase Auth
- **Gestion des stages** (création, consultation)
- **Candidatures** des étudiants
- **Upload de documents** (CV, relevés de notes)
- **Suivi de présence** pour les stages en cours
- **Notifications** en temps réel
- **Tableaux de bord** par rôle (étudiant, superviseur, chef de département, médecin encadrant)

## API Endpoints

- `POST /api/upload` - Upload de documents
- `GET /api/applications/:id/documents` - Liste des documents
- `POST /api/attendance` - Enregistrer une présence
- `GET /api/attendance/:id` - Historique de présence
- `PUT /api/attendance/:id` - Modifier une présence

## Technologies utilisées

### Frontend
- React 18.3
- Vite 5.4
- Tailwind CSS 3.4
- Lucide React 0.344

### Backend
- Django 5.2
- Django REST Framework
- MySQL
- Python 3.x

## Notes importantes

- Le backend Django utilise **l'ORM** pour toutes les opérations de base de données
- L'authentification est gérée par **Supabase Auth** côté frontend
- Les fichiers sont stockés **localement** dans le dossier `uploads/`
