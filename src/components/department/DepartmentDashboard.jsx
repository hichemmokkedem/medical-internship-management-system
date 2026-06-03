import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

import { BarChart3, LogOut, Users, BookOpen, TrendingUp, Calendar, Activity, FileText, CheckCircle, XCircle, Clock, AlertCircle, Plus, Upload, X, Search, Building2, Stethoscope, MapPin, Filter, GraduationCap, Bell, Pencil, Trash2 } from 'lucide-react';

export default function DepartmentDashboard() {
    const { profile, signOut } = useAuth();
    const [internships, setInternships] = useState([]);
    const [applications, setApplications] = useState([]);
    const [students, setStudents] = useState([]);
    const [supervisors, setSupervisors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
    const [newStudent, setNewStudent] = useState({
        matricule: '',
        full_name: '',
        email: '',
        password: '',
        year_of_study: '',
        phone: ''
    });
    const [editingStudent, setEditingStudent] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [hospitalNetwork, setHospitalNetwork] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({
        totalInternships: 0,
        activeInternships: 0,
        totalApplications: 0,
        pendingApplications: 0,
        acceptedApplications: 0,
        rejectedApplications: 0,
        totalStudents: 0,
        totalSupervisors: 0,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        await Promise.all([
            loadInternships(),
            loadApplications(),
            loadStudents(),
            loadSupervisors(),
            loadHospitalNetwork(),
        ]);
        setLoading(false);
    };

    const loadInternships = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:8000/api/department/internships/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setInternships(data || []);
            }
        } catch (error) {
            console.error('Error loading internships:', error);
        }
    };

    const loadApplications = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:8000/api/department/applications/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setApplications(data || []);
            }
        } catch (error) {
            console.error('Error loading applications:', error);
        }
    };

    const loadStudents = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:8000/api/department/students/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setStudents(data || []);
            }
        } catch (error) {
            console.error('Error loading students:', error);
        }
    };

    const loadSupervisors = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:8000/api/department/supervisors/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setSupervisors(data || []);
            }
        } catch (error) {
            console.error('Error loading supervisors:', error);
        }
    };

    const loadHospitalNetwork = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:8000/api/departement/hospital-network/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();

                // Normaliser les noms d'hôpitaux pour éviter les doublons (ex: "boumerdes" vs "Boumerdes")
                const normalizedHospitals = {};

                (data || []).forEach(hospital => {
                    const nameKey = hospital.name.toLowerCase().trim();
                    // Convertir en Title Case pour l'affichage (ex: "boumerdes" -> "Boumerdes")
                    const displayName = hospital.name.trim().charAt(0).toUpperCase() + hospital.name.trim().slice(1).toLowerCase();

                    if (!normalizedHospitals[nameKey]) {
                        normalizedHospitals[nameKey] = {
                            name: displayName,
                            services: [...hospital.services],
                            total_capacity: hospital.total_capacity || 0,
                            current_occupancy: hospital.current_occupancy || 0
                        };
                    } else {
                        // Fusionner les statistiques
                        normalizedHospitals[nameKey].total_capacity += (hospital.total_capacity || 0);
                        normalizedHospitals[nameKey].current_occupancy += (hospital.current_occupancy || 0);

                        // Fusionner les services sans doublons
                        const existingServiceNames = new Set(normalizedHospitals[nameKey].services.map(s => s.name));
                        hospital.services.forEach(service => {
                            if (!existingServiceNames.has(service.name)) {
                                normalizedHospitals[nameKey].services.push(service);
                                existingServiceNames.add(service.name);
                            } else {
                                // Si le service existe déjà, on pourrait vouloir additionner ses stats spécifiques si elles existent
                                // Pour l'instant, on suppose que les services sont distincts ou déjà agrégés
                            }
                        });
                    }
                });

                setHospitalNetwork(Object.values(normalizedHospitals));
            }
        } catch (error) {
            console.error('Error loading hospital network:', error);
        }
    };

    useEffect(() => {
        if (internships.length > 0 || applications.length > 0) {
            setStats({
                totalInternships: internships.length,
                activeInternships: internships.filter(i => i.status === 'open' || i.status === 'in_progress').length,
                totalApplications: applications.length,
                pendingApplications: applications.filter(a => a.status === 'pending').length,
                acceptedApplications: applications.filter(a => a.status === 'accepted').length,
                rejectedApplications: applications.filter(a => a.status === 'rejected').length,
                totalStudents: students.length,
                totalSupervisors: supervisors.length,
            });
        }
    }, [internships, applications, students, supervisors]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'open': return 'bg-green-100 text-green-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-gray-100 text-gray-800';
            case 'closed': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getApplicationStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'accepted': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'withdrawn': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:8000/api/departement/students/add', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newStudent)
            });

            if (response.ok) {
                setShowAddStudentModal(false);
                setNewStudent({
                    matricule: '',
                    full_name: '',
                    email: '',
                    password: '',
                    year_of_study: '',
                    phone: ''
                });
                await loadData();
            } else {
                const data = await response.json();
                alert(data.error || 'Erreur lors de la création');
            }
        } catch (error) {
            console.error('Error creating student:', error);
        }
    };

    const handleUpdateStudent = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`http://localhost:8000/api/departement/students/${editingStudent.id}/`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editingStudent)
            });

            if (response.ok) {
                setShowEditModal(false);
                setEditingStudent(null);
                await loadData();
            } else {
                const data = await response.json();
                alert(data.error || 'Erreur lors de la modification');
            }
        } catch (error) {
            console.error('Error updating student:', error);
        }
    };

    const handleDeleteStudent = async (studentId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet étudiant ? Cette action est irréversible.')) return;

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`http://localhost:8000/api/departement/students/${studentId}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                await loadData();
            } else {
                const data = await response.json();
                alert(data.error || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Error deleting student:', error);
        }
    };

    const handleUploadStudents = async (e) => {
        e.preventDefault();
        if (!uploadFile) return;

        const formData = new FormData();
        formData.append('file', uploadFile);

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:8000/api/department/students/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                alert(data.message);
                if (data.errors && data.errors.length > 0) {
                    alert('Erreurs:\n' + data.errors.join('\n'));
                }
                setShowUploadModal(false);
                setUploadFile(null);
                loadStudents();
            } else {
                const data = await response.json();
                alert(data.error || 'Erreur lors de l\'import');
            }
        } catch (error) {
            console.error('Error uploading students:', error);
            alert('Erreur lors de l\'import');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <div className="bg-gray-800 p-2 rounded-lg">
                                <BarChart3 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Espace Chef de Département</h1>
                                <p className="text-xs text-gray-500">{profile?.full_name}</p>
                            </div>
                        </div>
                        <button
                            onClick={signOut}
                            className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Déconnexion</span>
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="relative overflow-hidden bg-gray-900 rounded-2xl p-8 mb-8 shadow-2xl border border-gray-800">
                    {/* Decorative background effects - Monochrome */}
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-gray-700 rounded-full opacity-20 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-gray-600 rounded-full opacity-20 blur-3xl"></div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Tableau de Bord Analytique</h2>
                            <div className="flex flex-wrap items-center gap-3 text-gray-300">
                                <span className="bg-gray-800/80 px-3 py-1 rounded-full border border-gray-700 text-sm font-medium backdrop-blur-sm shadow-sm flex items-center">
                                    <Building2 className="w-3.5 h-3.5 mr-2 text-gray-400" />
                                    {profile?.department || 'Département non défini'}
                                </span>
                                {profile?.hospital_affiliation && (
                                    <>
                                        <span className="flex items-center text-sm font-medium text-gray-400">
                                            <GraduationCap className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                                            {profile?.hospital_affiliation}
                                        </span>

                                    </>
                                )}

                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-gray-800/50 backdrop-blur-md border border-gray-700/50 rounded-xl p-4 shadow-lg">
                            <div className="p-2.5 bg-gray-500/10 rounded-lg border border-gray-500/20">
                                <Calendar className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Aujourd'hui</p>
                                <p className="text-white font-medium capitalize">
                                    {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-100 p-1 rounded-xl inline-flex mb-8 border border-gray-200">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'overview'
                            ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                            }`}
                    >
                        Vue d'ensemble
                    </button>
                    <button
                        onClick={() => setActiveTab('students')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'students'
                            ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                            }`}
                    >
                        Suivi Étudiants
                    </button>
                    <button
                        onClick={() => setActiveTab('network')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'network'
                            ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                            }`}
                    >
                        Réseau Hospitalier
                    </button>
                </div>

                {activeTab === 'overview' && (
                    <>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                                        <BookOpen className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div className="flex items-center space-x-1 text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                                        <TrendingUp className="w-3 h-3" />
                                        <span className="text-xs font-semibold">{stats.activeInternships} actifs</span>
                                    </div>
                                </div>
                                <h3 className="text-slate-500 text-sm font-medium">Total Stages</h3>
                                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalInternships}</p>
                            </div>

                            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                                        <FileText className="w-6 h-6 text-amber-600" />
                                    </div>
                                    <div className="flex items-center space-x-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                                        <Activity className="w-3 h-3" />
                                        <span className="text-xs font-semibold">{stats.pendingApplications} en attente</span>
                                    </div>
                                </div>
                                <h3 className="text-slate-500 text-sm font-medium">Total Candidatures</h3>
                                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalApplications}</p>
                            </div>

                            <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                                        Taux succès
                                    </span>
                                </div>
                                <h3 className="text-slate-500 text-sm font-medium">Acceptées</h3>
                                <div className="flex items-baseline space-x-2 mt-2">
                                    <p className="text-3xl font-bold text-slate-900">{stats.acceptedApplications}</p>
                                    <span className="text-sm font-semibold text-slate-400">
                                        ({stats.totalApplications > 0
                                            ? Math.round((stats.acceptedApplications / stats.totalApplications) * 100)
                                            : 0}%)
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <Users className="w-6 h-6 text-gray-600" />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                                        {stats.totalSupervisors} chefs services
                                    </span>
                                </div>
                                <h3 className="text-gray-500 text-sm font-medium">Total Étudiants</h3>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalStudents}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                            <div className="bg-white rounded-xl shadow-sm p-6 border">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Répartition des candidatures</h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-slate-600 font-medium">En attente</span>
                                            <span className="font-bold text-amber-600">{stats.pendingApplications}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2.5">
                                            <div
                                                className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
                                                style={{ width: `${stats.totalApplications > 0 ? (stats.pendingApplications / stats.totalApplications) * 100 : 0}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-slate-600 font-medium">Acceptées</span>
                                            <span className="font-bold text-emerald-600">{stats.acceptedApplications}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2.5">
                                            <div
                                                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                                                style={{ width: `${stats.totalApplications > 0 ? (stats.acceptedApplications / stats.totalApplications) * 100 : 0}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-slate-600 font-medium">Refusées</span>
                                            <span className="font-bold text-red-600">{stats.rejectedApplications}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2.5">
                                            <div
                                                className="bg-red-500 h-2.5 rounded-full transition-all duration-500"
                                                style={{ width: `${stats.totalApplications > 0 ? (stats.rejectedApplications / stats.totalApplications) * 100 : 0}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm p-6 border">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Activité récente</h3>
                                <div className="space-y-3">
                                    {applications.slice(0, 5).map((app) => (
                                        <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <div className={`p-2 rounded-lg ${app.status === 'accepted' ? 'bg-green-100' :
                                                    app.status === 'rejected' ? 'bg-red-100' :
                                                        'bg-yellow-100'
                                                    }`}>
                                                    {app.status === 'accepted' ? (
                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                    ) : app.status === 'rejected' ? (
                                                        <XCircle className="w-4 h-4 text-red-600" />
                                                    ) : (
                                                        <Clock className="w-4 h-4 text-yellow-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{app.student.full_name}</p>
                                                    <p className="text-xs text-gray-600">{app.internship.title}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                {new Date(app.applied_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6 border mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <BookOpen className="w-5 h-5 mr-2 text-indigo-600" />
                                Stages disponibles
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Titre</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hôpital</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Département</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Places</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Début</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {internships.slice(0, 10).map((internship) => (
                                            <tr key={internship.id} className="hover:bg-gray-50 transition">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{internship.title}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{internship.hospital}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{internship.department}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{internship.current_students}/{internship.max_students}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {new Date(internship.start_date).toLocaleDateString('fr-FR')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(internship.status)}`}>
                                                        {internship.status === 'open' ? 'Ouvert' :
                                                            internship.status === 'in_progress' ? 'En cours' :
                                                                internship.status === 'completed' ? 'Terminé' : 'Fermé'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6 border">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                                Candidatures récentes
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Étudiant</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Matricule</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Stage</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Département</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {applications.slice(0, 15).map((app) => (
                                            <tr key={app.id} className="hover:bg-gray-50 transition">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{app.student.full_name}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{app.student.matricule}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{app.internship.title}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{app.internship.department}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {new Date(app.applied_at).toLocaleDateString('fr-FR')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getApplicationStatusColor(app.status)}`}>
                                                        {app.status === 'pending' ? 'En attente' :
                                                            app.status === 'accepted' ? 'Acceptée' :
                                                                app.status === 'rejected' ? 'Refusée' : 'Retirée'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'network' && (
                    <div className="space-y-8">
                        {/* Header Stats & Search */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Réseau Hospitalier</h2>
                                <p className="text-gray-500 mt-1">Vue d'ensemble des capacités d'accueil et des services</p>
                            </div>
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Rechercher un hôpital ou un service..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm transition-all"
                                />
                            </div>
                        </div>

                        {/* Network Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-blue-50 rounded-xl">
                                        <Building2 className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Hôpitaux</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{hospitalNetwork.length}</p>
                                <p className="text-sm text-gray-500 mt-1">Partenaires actifs</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-purple-50 rounded-xl">
                                        <Stethoscope className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Services</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">
                                    {hospitalNetwork.reduce((acc, h) => acc + h.services.length, 0)}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">Spécialités médicales</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-green-50 rounded-xl">
                                        <Users className="w-6 h-6 text-green-600" />
                                    </div>
                                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Capacité Globale</span>
                                </div>
                                <div className="flex items-end gap-2">
                                    <p className="text-3xl font-bold text-gray-900">
                                        {hospitalNetwork.reduce((acc, h) => acc + h.current_occupancy, 0)}
                                    </p>
                                    <p className="text-lg text-gray-400 mb-1">
                                        / {hospitalNetwork.reduce((acc, h) => acc + h.total_capacity, 0)}
                                    </p>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">Places occupées</p>
                            </div>
                        </div>

                        {/* Hospital List */}
                        <div className="space-y-8">
                            {hospitalNetwork
                                .filter(hospital =>
                                    hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    hospital.services.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                )
                                .map((hospital, index) => (
                                    <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
                                        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                                                        <Building2 className="w-8 h-8 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-gray-900">{hospital.name}</h3>
                                                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                                            <span className="flex items-center gap-1">
                                                                <Stethoscope className="w-4 h-4" />
                                                                {hospital.services.length} services
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Users className="w-4 h-4" />
                                                                {hospital.total_supervisors} encadrants
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Taux d'occupation</p>
                                                        <p className="text-lg font-bold text-gray-900">
                                                            {Math.round((hospital.current_occupancy / (hospital.total_capacity || 1)) * 100)}%
                                                        </p>
                                                    </div>
                                                    <div className="w-12 h-12 relative flex items-center justify-center">
                                                        <svg className="w-full h-full transform -rotate-90">
                                                            <circle
                                                                cx="24"
                                                                cy="24"
                                                                r="20"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                                fill="transparent"
                                                                className="text-gray-100"
                                                            />
                                                            <circle
                                                                cx="24"
                                                                cy="24"
                                                                r="20"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                                fill="transparent"
                                                                strokeDasharray={2 * Math.PI * 20}
                                                                strokeDashoffset={2 * Math.PI * 20 * (1 - (hospital.current_occupancy / (hospital.total_capacity || 1)))}
                                                                className={`${(hospital.current_occupancy / (hospital.total_capacity || 1)) > 0.9 ? 'text-red-500' :
                                                                    (hospital.current_occupancy / (hospital.total_capacity || 1)) > 0.7 ? 'text-yellow-500' :
                                                                        'text-green-500'
                                                                    }`}
                                                            />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {hospital.services
                                                    .filter(service =>
                                                        searchTerm === '' ||
                                                        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                        hospital.name.toLowerCase().includes(searchTerm.toLowerCase())
                                                    )
                                                    .map((service, sIndex) => {
                                                        const occupancyRate = service.occupancy / (service.capacity || 1);
                                                        const isFull = occupancyRate >= 1;

                                                        return (
                                                            <div key={sIndex} className="group border border-gray-100 rounded-xl p-5 hover:border-indigo-200 hover:shadow-md transition-all duration-300 bg-white">
                                                                <div className="flex justify-between items-start mb-4">
                                                                    <div>
                                                                        <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{service.name}</h4>
                                                                        <p className="text-xs text-gray-500 mt-1">{service.supervisors_count} médecins référents</p>
                                                                    </div>
                                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${isFull
                                                                        ? 'bg-red-50 text-red-700 border border-red-100'
                                                                        : 'bg-green-50 text-green-700 border border-green-100'
                                                                        }`}>
                                                                        {isFull ? 'Complet' : 'Disponible'}
                                                                    </span>
                                                                </div>

                                                                <div className="space-y-4">
                                                                    <div>
                                                                        <div className="flex justify-between text-xs font-medium text-gray-600 mb-2">
                                                                            <span>Capacité</span>
                                                                            <span>{service.occupancy} / {service.capacity}</span>
                                                                        </div>
                                                                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                                            <div
                                                                                className={`h-full rounded-full transition-all duration-500 ${occupancyRate > 0.9 ? 'bg-red-500' :
                                                                                    occupancyRate > 0.7 ? 'bg-yellow-500' :
                                                                                        'bg-green-500'
                                                                                    }`}
                                                                                style={{ width: `${Math.min(occupancyRate * 100, 100)}%` }}
                                                                            ></div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                                                        <div className="text-center">
                                                                            <p className="text-xs text-gray-400">Stages actifs</p>
                                                                            <p className="font-bold text-gray-900">{service.internships_count}</p>
                                                                        </div>
                                                                        <div className="w-px h-8 bg-gray-100"></div>
                                                                        <div className="text-center">
                                                                            <p className="text-xs text-gray-400">Places libres</p>
                                                                            <p className="font-bold text-gray-900">{Math.max(0, service.capacity - service.occupancy)}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                            {hospitalNetwork.length === 0 && (
                                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 border-dashed">
                                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Activity className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900">Aucune donnée disponible</h3>
                                    <p className="text-gray-500 mt-1">Le réseau hospitalier est vide pour le moment.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'students' && (
                    <div className="space-y-8">
                        {/* Mandatory Internships Status */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <AlertCircle className="w-5 h-5 mr-2 text-indigo-600" />
                                Suivi des Stages Obligatoires
                            </h3>
                            <div className="space-y-6">
                                {internships.filter(i => i.is_mandatory).map(internship => {
                                    const concernedStudents = students.filter(s => s.year_of_study === internship.target_year);
                                    const appliedStudentIds = applications
                                        .filter(a => a.internship.id === internship.id)
                                        .map(a => a.student.id);

                                    const missingStudents = concernedStudents.filter(s => !appliedStudentIds.includes(s.id));

                                    return (
                                        <div key={internship.id} className="border rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{internship.title}</h4>
                                                    <p className="text-sm text-gray-600">Année cible: {internship.target_year}ème année</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {concernedStudents.length - missingStudents.length} / {concernedStudents.length} étudiants
                                                    </span>
                                                    <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
                                                        <div
                                                            className="h-full bg-indigo-600 rounded-full"
                                                            style={{ width: `${concernedStudents.length ? ((concernedStudents.length - missingStudents.length) / concernedStudents.length) * 100 : 0}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>

                                            {missingStudents.length > 0 && (
                                                <div className="mt-4">
                                                    <p className="text-sm font-medium text-red-600 mb-2">Étudiants n'ayant pas encore postulé :</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {missingStudents.map(student => (
                                                            <span key={student.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                {student.full_name} ({student.matricule})
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {internships.filter(i => i.is_mandatory).length === 0 && (
                                    <p className="text-gray-500 italic">Aucun stage obligatoire défini.</p>
                                )}
                            </div>
                        </div>

                        {/* All Students List */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <Users className="w-5 h-5 mr-2 text-indigo-600" />
                                Liste Complète des Étudiants
                            </h3>
                            <div className="flex space-x-2 mb-4">
                                <button
                                    onClick={() => setShowAddStudentModal(true)}
                                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Ajouter un étudiant
                                </button>
                                <button
                                    onClick={() => setShowUploadModal(true)}
                                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Importer Excel
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Étudiant</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Année</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut Candidatures</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stages Validés</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {students.map((student) => {
                                            const studentApps = applications.filter(a => a.student.id === student.id);
                                            const hasApplied = studentApps.length > 0;
                                            const validatedInternships = studentApps.filter(a => {
                                                return a.status === 'accepted' && a.evaluation && a.evaluation.rating >= 10;
                                            }).length;

                                            return (
                                                <tr key={student.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">{student.full_name}</div>
                                                                <div className="text-sm text-gray-500">{student.matricule}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm text-gray-900">{student.year_of_study}ème année</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {hasApplied ? (
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                A déjà postulé ({studentApps.length})
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                                Jamais postulé
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {validatedInternships}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => {
                                                                setEditingStudent(student);
                                                                setShowEditModal(true);
                                                            }}
                                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                            title="Modifier"
                                                        >
                                                            <Pencil className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteStudent(student.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Student Modal */}
            {showAddStudentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Ajouter un étudiant</h3>
                            <button onClick={() => setShowAddStudentModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleAddStudent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Matricule</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                                    value={newStudent.matricule}
                                    onChange={(e) => setNewStudent({ ...newStudent, matricule: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nom complet</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                                    value={newStudent.full_name}
                                    onChange={(e) => setNewStudent({ ...newStudent, full_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                                    value={newStudent.email}
                                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
                                <input
                                    type="password"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2"
                                    value={newStudent.password}
                                    onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                                    placeholder="Mot de passe initial"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Année d'étude</label>
                                <input
                                    type="number"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                                    value={newStudent.year_of_study}
                                    onChange={(e) => setNewStudent({ ...newStudent, year_of_study: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                                    value={newStudent.phone}
                                    onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
                            >
                                Ajouter
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Importer des étudiants (Excel)</h3>
                            <button onClick={() => setShowUploadModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleUploadStudents} className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    required
                                    onChange={(e) => setUploadFile(e.target.files[0])}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                />
                                <p className="mt-2 text-xs text-gray-500">Format: Matricule, Nom, Email, Année, Téléphone</p>
                                <p className="mt-1 text-xs text-indigo-600">Note: Le mot de passe par défaut sera "password123"</p>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
                            >
                                Importer
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Student Modal */}
            {showEditModal && editingStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Modifier l'étudiant</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateStudent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Matricule</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                                    value={editingStudent.matricule}
                                    onChange={(e) => setEditingStudent({ ...editingStudent, matricule: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nom complet</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                                    value={editingStudent.full_name}
                                    onChange={(e) => setEditingStudent({ ...editingStudent, full_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                                    value={editingStudent.email}
                                    onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nouveau mot de passe (optionnel)</label>
                                <input
                                    type="password"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2"
                                    value={editingStudent.password || ''}
                                    onChange={(e) => setEditingStudent({ ...editingStudent, password: e.target.value })}
                                    placeholder="Laisser vide pour ne pas changer"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Année d'étude</label>
                                <input
                                    type="number"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                                    value={editingStudent.year_of_study}
                                    onChange={(e) => setEditingStudent({ ...editingStudent, year_of_study: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                                    value={editingStudent.phone}
                                    onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
                            >
                                Enregistrer les modifications
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
