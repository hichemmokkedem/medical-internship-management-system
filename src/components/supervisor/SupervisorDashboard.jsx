import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getApplicationDocuments } from '../../lib/api';
import { BookOpen, LogOut, Plus, Users, Calendar, CheckCircle, XCircle, Clock, Edit, Eye, FileText, Download, Trash2, AlertCircle } from 'lucide-react';

export default function SupervisorDashboard() {
    const { profile, signOut } = useAuth();
    const [internships, setInternships] = useState([]);
    const [applications, setApplications] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedInternship, setSelectedInternship] = useState(null);
    const [showApplicationModal, setShowApplicationModal] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [reviewNotes, setReviewNotes] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('internships');
    const [doctors, setDoctors] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [evaluations, setEvaluations] = useState({});
    const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
    const [showEditDoctorModal, setShowEditDoctorModal] = useState(false);
    const [selectedDoctorEdit, setSelectedDoctorEdit] = useState(null);
    const [newDoctor, setNewDoctor] = useState({
        matricule: '',
        full_name: '',
        email: '',
        password: '',
        phone: '',
        department: '',
        hospital_affiliation: ''
    });
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        department: profile?.department || '',
        hospital: profile?.hospital_affiliation || '',
        start_date: '',
        end_date: '',
        duration_weeks: 4,
        max_students: 1,
        requirements: '',
        is_mandatory: false,
        target_year: null,
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (applications.length > 0) {
            loadEvaluations();
        }
    }, [applications]);

    useEffect(() => {
        if (selectedApplication) {
            loadDocuments(selectedApplication.id);
        } else {
            setDocuments([]);
        }
    }, [selectedApplication]);

    const loadDocuments = async (applicationId) => {
        try {
            const docs = await getApplicationDocuments(applicationId);
            setDocuments(docs);
        } catch (error) {
            console.error('Error loading documents:', error);
        }
    };

    const loadEvaluations = async () => {
        if (!applications || applications.length === 0) return;

        const acceptedApps = applications.filter(app => app.status === 'accepted' && app.medicine_supervisor?.id);
        const evalPromises = acceptedApps.map(async (app) => {
            try {
                const token = localStorage.getItem('accessToken');
                const response = await fetch(
                    `http://localhost:8000/api/applications/${app.id}/get-evaluation?supervisorId=${app.medicine_supervisor?.id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
                const data = await response.json();
                return { appId: app.id, evaluation: data.evaluation };
            } catch (error) {
                console.error('Error loading evaluation:', error);
                return { appId: app.id, evaluation: null };
            }
        });

        const results = await Promise.all(evalPromises);
        const evalsMap = {};
        results.forEach(({ appId, evaluation }) => {
            evalsMap[appId] = evaluation;
        });
        setEvaluations(evalsMap);
    };

    const loadData = async () => {
        setLoading(true);
        await Promise.all([loadInternships(), loadApplications(), loadDoctors()]);
        setLoading(false);
    };

    const loadDoctors = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:8000/api/medicine-supervisors/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setDoctors(data);
            }
        } catch (error) {
            console.error('Error loading doctors:', error);
        }
    };

    const loadInternships = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:8000/api/supervisor/internships/', {
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
            const response = await fetch('http://localhost:8000/api/supervisor/applications/', {
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

    useEffect(() => {
        if (internships.length > 0) {
            loadApplications();
        }
    }, [internships]);

    const handleCreateInternship = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            console.log("TOKEN UTILISÉ :", token);
            console.log("DATA ENVOYÉE :", formData);
            const response = await fetch('http://localhost:8000/api/supervisor/internships/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            console.log("📥 STATUS BACKEND :", response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error("❌ ERREUR BACKEND DÉTAILLÉE :", errorData);

                let errorMessage = "Une erreur est survenue lors de la création du stage.";

                if (errorData.start_date) {
                    errorMessage = "La date de début ne peut pas être dans le passé.";
                } else if (errorData.end_date) {
                    errorMessage = "La date de fin est invalide.";
                } else if (errorData.title) {
                    errorMessage = "Le titre est invalide.";
                } else if (errorData.detail) {
                    errorMessage = errorData.detail;
                }

                alert(errorMessage);
            }

            if (response.ok) {
                setShowCreateModal(false);
                setFormData({
                    title: '',
                    description: '',
                    department: profile?.department || '',
                    hospital: profile?.hospital_affiliation || '',
                    start_date: '',
                    end_date: '',
                    duration_weeks: 4,
                    max_students: 1,
                    requirements: '',
                    is_mandatory: false,
                    target_year: null,
                });
                await loadData();
            }
        } catch (error) {
            console.error('Error creating internship:', error);
        }
    };

    const handleEditInternship = (internship) => {
        setSelectedInternship(internship);
        setFormData({
            title: internship.title,
            description: internship.description,
            department: internship.department,
            hospital: internship.hospital,
            start_date: internship.start_date,
            end_date: internship.end_date,
            duration_weeks: internship.duration_weeks,
            max_students: internship.max_students,
            requirements: internship.requirements || '',
            is_mandatory: internship.is_mandatory,
            target_year: internship.target_year,
        });
        setShowEditModal(true);
    };

    const handleUpdateInternship = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`http://localhost:8000/api/supervisor/internships/${selectedInternship.id}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setShowEditModal(false);
                setSelectedInternship(null);
                setFormData({
                    title: '',
                    description: '',
                    department: profile?.department || '',
                    hospital: profile?.hospital_affiliation || '',
                    start_date: '',
                    end_date: '',
                    duration_weeks: 4,
                    max_students: 1,
                    requirements: '',
                    is_mandatory: false,
                    target_year: null,
                });
                await loadData();
            }
        } catch (error) {
            console.error('Error updating internship:', error);
        }
    };

    const handleDeleteInternship = async (internshipId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce stage ? Cette action est irréversible.')) {
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`http://localhost:8000/api/supervisor/internships/${internshipId}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                await loadData();
            } else {
                alert('Erreur lors de la suppression du stage. Il peut avoir des candidatures associées.');
            }
        } catch (error) {
            console.error('Error deleting internship:', error);
            alert('Erreur lors de la suppression du stage.');
        }
    };

    const handleReviewApplication = async (applicationId, status) => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`http://localhost:8000/api/supervisor/applications/${applicationId}/review/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status,
                    review_notes: reviewNotes
                })
            });

            if (response.ok) {
                setShowApplicationModal(false);
                setSelectedApplication(null);
                setReviewNotes('');
                await loadData();
            }
        } catch (error) {
            console.error('Error reviewing application:', error);
        }
    };

    const handleAssignSupervisor = async () => {

        if (!selectedStudent || !selectedDoctor) {
            alert('Veuillez sélectionner un médecin');
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            console.log('Assigning doctor:', selectedDoctor, 'to student:', selectedStudent.id);
            const response = await fetch(`http://localhost:8000/api/applications/${selectedStudent.id}/assign-supervisor`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ supervisor_id: selectedDoctor }),
            });

            if (response.ok) {
                alert('Médecin assigné avec succès !');
                setShowAssignModal(false);
                setSelectedStudent(null);
                setSelectedDoctor('');
                await loadData();
            } else {
                const error = await response.json();
                console.error('Server error:', error);
                alert(`Erreur: ${error.error || 'Erreur inconnue'}`);
            }
        } catch (error) {
            console.error('Error assigning supervisor:', error);
            alert('Erreur lors de l\'assignation');
        }
    };

    const handleAddDoctor = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:8000/api/medecin/add', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newDoctor)
            });

            if (response.ok) {
                alert('Médecin ajouté avec succès');
                setShowAddDoctorModal(false);
                setNewDoctor({
                    matricule: '',
                    full_name: '',
                    email: '',
                    password: '',
                    phone: '',
                    department: '',
                    hospital_affiliation: ''
                });
                await loadDoctors();
            } else {
                const data = await response.json();
                alert(data.error || 'Erreur lors de l\'ajout');
            }
        } catch (error) {
            console.error('Error adding doctor:', error);
            alert('Erreur lors de l\'ajout');
        }
    };

    const handleEditDoctor = (doctor) => {
        setSelectedDoctorEdit(doctor);
        setNewDoctor({
            matricule: doctor.matricule,
            full_name: doctor.full_name,
            email: doctor.email || '',
            password: '', // Don't show password
            phone: doctor.phone || '',
            department: doctor.department || '',
            hospital_affiliation: doctor.hospital_affiliation || ''
        });
        setShowEditDoctorModal(true);
    };

    const handleUpdateDoctor = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`http://localhost:8000/api/medecin/${selectedDoctorEdit.id}/update`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newDoctor)
            });

            if (response.ok) {
                alert('Médecin modifié avec succès');
                setShowEditDoctorModal(false);
                setSelectedDoctorEdit(null);
                setNewDoctor({
                    matricule: '',
                    full_name: '',
                    email: '',
                    password: '',
                    phone: '',
                    department: '',
                    hospital_affiliation: ''
                });
                await loadDoctors();
            } else {
                const data = await response.json();
                alert(data.error || 'Erreur lors de la modification');
            }
        } catch (error) {
            console.error('Error updating doctor:', error);
            alert('Erreur lors de la modification');
        }
    };

    const handleDeleteDoctor = async (doctorId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce médecin ?')) {
            return;
        }
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`http://localhost:8000/api/medecin/${doctorId}/delete`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                alert('Médecin supprimé avec succès');
                await loadDoctors();
            } else {
                const data = await response.json();
                console.error('SERVER ERROR during deletion:', data.error);
                alert('Erreur: ' + (data.error || 'Impossible de supprimer ce médecin'));
            }
        } catch (error) {
            console.error('Error deleting doctor:', error);
            alert('Erreur lors de la suppression');
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            accepted: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
        };
        const labels = {
            pending: 'En attente',
            accepted: 'Acceptée',
            rejected: 'Refusée',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
                            <div className="bg-green-600 p-2 rounded-lg">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Espace Superviseur</h1>
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
                <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-6 text-white mb-8">
                    <h2 className="text-2xl font-bold mb-2">Bienvenue, Dr. {profile?.full_name}</h2>
                    <p className="text-green-100">{profile?.department} - {profile?.hospital_affiliation}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <p className="text-sm text-green-100">Stages créés</p>
                            <p className="text-3xl font-bold">{internships.length}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <p className="text-sm text-green-100">Candidatures</p>
                            <p className="text-3xl font-bold">{applications.length}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <p className="text-sm text-green-100">En attente</p>
                            <p className="text-3xl font-bold">{applications.filter(a => a.status === 'pending').length}</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setActiveTab('internships')}
                            className={`px-6 py-3 rounded-lg font-medium transition ${activeTab === 'internships'
                                ? 'bg-green-600 text-white shadow-lg'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Mes Stages
                        </button>
                        <button
                            onClick={() => setActiveTab('applications')}
                            className={`px-6 py-3 rounded-lg font-medium transition ${activeTab === 'applications'
                                ? 'bg-green-600 text-white shadow-lg'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                } `}
                        >
                            Candidatures
                        </button>
                        <button
                            onClick={() => setActiveTab('encadrement')}
                            className={`px-6 py-3 rounded-lg font-medium transition ${activeTab === 'encadrement'
                                ? 'bg-green-600 text-white shadow-lg'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                } `}
                        >
                            Encadrement
                        </button>
                        <button
                            onClick={() => setActiveTab('doctors')}
                            className={`px-6 py-3 rounded-lg font-medium transition ${activeTab === 'doctors'
                                ? 'bg-green-600 text-white shadow-lg'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                } `}
                        >
                            Médecins
                        </button>
                    </div>
                    {activeTab === 'internships' && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition shadow-lg"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Créer un stage</span>
                        </button>
                    )}
                    {activeTab === 'doctors' && (
                        <button
                            onClick={() => setShowAddDoctorModal(true)}
                            className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition shadow-lg"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Ajouter un médecin</span>
                        </button>
                    )}
                </div>

                {activeTab === 'internships' && (
                    <div className="grid grid-cols-1 gap-6">
                        {internships.map((internship) => (
                            <div key={internship.id} className="bg-white rounded-xl shadow-sm p-6 border">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{internship.title}</h3>
                                        <p className="text-gray-600">{internship.hospital} - {internship.department}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${internship.status === 'open' ? 'bg-green-100 text-green-800' :
                                        internship.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {internship.status === 'open' ? 'Ouvert' :
                                            internship.status === 'in_progress' ? 'En cours' :
                                                internship.status === 'completed' ? 'Terminé' : 'Fermé'}
                                    </span>
                                </div>
                                <p className="text-gray-600 mb-4">{internship.description}</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div className="flex items-center text-gray-600">
                                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                        {new Date(internship.start_date).toLocaleDateString('fr-FR')}
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                        {internship.duration_weeks} semaines
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <Users className="w-4 h-4 mr-2 text-gray-400" />
                                        {internship.current_students}/{internship.max_students} étudiants
                                    </div>
                                    <div className="text-gray-600">
                                        {applications.filter(a => a.internship_id === internship.id).length} candidatures
                                    </div>
                                </div>
                                <div className="flex space-x-3 mt-4 pt-4 border-t">
                                    <button
                                        onClick={() => handleEditInternship(internship)}
                                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                                    >
                                        <Edit className="w-4 h-4" />
                                        <span>Modifier</span>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteInternship(internship.id)}
                                        className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span>Supprimer</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                        {internships.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-xl">
                                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 mb-4">Aucun stage créé</p>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                                >
                                    Créer votre premier stage
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'applications' && (
                    <div className="space-y-4">
                        {applications.map((app) => (
                            <div key={app.id} className="bg-white rounded-xl shadow-sm p-6 border">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{app.student.full_name}</h3>
                                        <p className="text-sm text-gray-600">Matricule: {app.student.matricule}</p>
                                        <p className="text-sm text-gray-600">Candidature pour: {app.internship.title}</p>
                                    </div>
                                    {getStatusBadge(app.status)}
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                                    <div>
                                        <span className="font-medium">Département:</span> {app.student.department}
                                    </div>
                                    <div>
                                        <span className="font-medium">Année d'étude:</span> {app.student.year_of_study}
                                    </div>
                                    <div>
                                        <span className="font-medium">Email:</span> {app.student.email}
                                    </div>
                                    <div>
                                        <span className="font-medium">Date:</span> {new Date(app.applied_at).toLocaleDateString('fr-FR')}
                                    </div>
                                </div>
                                {app.status === 'pending' && (
                                    <div className="flex space-x-3 mt-4">
                                        <button
                                            onClick={() => {
                                                setSelectedApplication(app);
                                                setShowApplicationModal(true);
                                            }}
                                            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span>Examiner</span>
                                        </button>
                                        <button
                                            onClick={() => handleReviewApplication(app.id, 'accepted')}
                                            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            <span>Accepter</span>
                                        </button>
                                        <button
                                            onClick={() => handleReviewApplication(app.id, 'rejected')}
                                            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            <span>Refuser</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {applications.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-xl">
                                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">Aucune candidature pour le moment</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'encadrement' && (
                    <div className="space-y-4">
                        {applications.filter(app => app.status === 'accepted').map((app) => (
                            <div key={app.id} className="bg-white rounded-xl shadow-sm p-6 border">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{app.student.full_name}</h3>
                                        <p className="text-sm text-gray-600">Matricule: {app.student.matricule}</p>
                                        <p className="text-sm text-gray-600">Stage: {app.internship.title}</p>
                                    </div>
                                    {getStatusBadge(app.status)}
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                                    <div>
                                        <span className="font-medium">Département:</span> {app.student.department}
                                    </div>
                                    <div>
                                        <span className="font-medium">Année d'étude:</span> {app.student.year_of_study}
                                    </div>
                                    <div>
                                        <span className="font-medium">Email:</span> {app.student.email}
                                    </div>
                                </div>

                                {evaluations[app.id] ? (
                                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-bold text-blue-900 mb-1">Évaluation du médecin</p>
                                                <p className="text-sm text-blue-800">{evaluations[app.id].comments}</p>
                                            </div>
                                            <div className="bg-white px-3 py-1 rounded-full border border-blue-200">
                                                <span className="text-lg font-bold text-blue-600">{evaluations[app.id].rating}/20</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-500 italic">
                                        Aucune évaluation pour le moment
                                    </div>
                                )}
                                <div className="mt-2">
                                    <span className="font-medium">Médecin encadrant:</span> {app.medicine_supervisor ? app.medicine_supervisor.full_name : 'Non assigné'}
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedStudent(app);
                                        setShowAssignModal(true);
                                    }}
                                    className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                                >
                                    <Users className="w-4 h-4" />
                                    <span>{app.medicine_supervisor ? 'Réassigner' : 'Assigner'} un médecin</span>
                                </button>
                            </div>
                        ))}
                        {applications.filter(app => app.status === 'accepted').length === 0 && (
                            <div className="text-center py-12 bg-white rounded-xl">
                                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">Aucun étudiant accepté pour le moment</p>
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'doctors' && (
                    <div className="bg-white rounded-xl shadow-sm p-6 border">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Liste des Médecins Encadrants</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matricule</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Département</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hôpital</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {doctors.map((doctor) => (
                                        <tr key={doctor.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{doctor.full_name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">{doctor.id}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">{doctor.email || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">{doctor.department || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">{doctor.hospital_affiliation || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleEditDoctor(doctor)}
                                                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDoctor(doctor.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {doctors.length === 0 && (
                            <div className="text-center py-12">
                                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">Aucun médecin encadrant</p>
                            </div>
                        )}
                    </div>
                )}
                {/* Modals */}
                {showEditDoctorModal && selectedDoctorEdit && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b">
                                <h2 className="text-2xl font-bold text-gray-900">Modifier le médecin</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet *</label>
                                    <input
                                        type="text"
                                        value={newDoctor.full_name}
                                        onChange={(e) => setNewDoctor({ ...newDoctor, full_name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                                    <input
                                        type="email"
                                        value={newDoctor.email}
                                        onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                                    <input
                                        type="tel"
                                        value={newDoctor.phone}
                                        onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Département</label>
                                    <input
                                        type="text"
                                        value={newDoctor.department}
                                        onChange={(e) => setNewDoctor({ ...newDoctor, department: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Hôpital</label>
                                    <input
                                        type="text"
                                        value={newDoctor.hospital_affiliation}
                                        onChange={(e) => setNewDoctor({ ...newDoctor, hospital_affiliation: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe (laisser vide pour ne pas changer)</label>
                                    <input
                                        type="password"
                                        value={newDoctor.password}
                                        onChange={(e) => setNewDoctor({ ...newDoctor, password: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Optionnel"
                                    />
                                </div>
                            </div>
                            <div className="p-6 border-t flex space-x-3">
                                <button
                                    onClick={() => {
                                        setShowEditDoctorModal(false);
                                        setSelectedDoctorEdit(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleUpdateDoctor}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    Enregistrer
                                </button>
                            </div>
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
                                    const concernedStudents = allStudents.filter(s => s.year_of_study === internship.target_year);
                                    const appliedStudentIds = applications
                                        .filter(a => a.internship_id === internship.id)
                                        .map(a => a.student_id);

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
                                                            style={{ width: `${concernedStudents.length ? ((concernedStudents.length - missingStudents.length) / concernedStudents.length) * 100 : 0}% ` }}
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
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Étudiant</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Année</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut Candidatures</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stages Validés</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {allStudents.map((student) => {
                                            const studentApps = applications.filter(a => a.student_id === student.id);
                                            const hasApplied = studentApps.length > 0;
                                            const validatedInternships = studentApps.filter(a => {
                                                return a.status === 'accepted';
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

            {
                showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b">
                                <h2 className="text-2xl font-bold text-gray-900">Créer un nouveau stage</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Titre du stage *</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Département</label>
                                        <input
                                            type="text"
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Hôpital</label>
                                        <input
                                            type="text"
                                            value={formData.hospital}
                                            onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Date de début *</label>
                                        <input
                                            type="date"
                                            value={formData.start_date}
                                            min={new Date().toISOString().split('T')[0]}
                                            onChange={(e) => {
                                                const newStartDate = e.target.value;
                                                const endDate = new Date(newStartDate);
                                                endDate.setDate(endDate.getDate() + (formData.duration_weeks * 7));
                                                setFormData({
                                                    ...formData,
                                                    start_date: newStartDate,
                                                    end_date: endDate.toISOString().split('T')[0]
                                                });
                                            }}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Date de fin *</label>
                                        <input
                                            type="date"
                                            value={formData.end_date}
                                            min={formData.start_date || new Date().toISOString().split('T')[0]}
                                            onChange={(e) => {
                                                const newEndDate = e.target.value;
                                                if (formData.start_date) {
                                                    const start = new Date(formData.start_date);
                                                    const end = new Date(newEndDate);
                                                    const diffTime = Math.abs(end - start);
                                                    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
                                                    setFormData({
                                                        ...formData,
                                                        end_date: newEndDate,
                                                        duration_weeks: diffWeeks
                                                    });
                                                } else {
                                                    setFormData({ ...formData, end_date: newEndDate });
                                                }
                                            }}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Durée (semaines)</label>
                                        <input
                                            type="number"
                                            value={formData.duration_weeks}
                                            onChange={(e) => {
                                                const newDuration = parseInt(e.target.value) || 0;
                                                if (formData.start_date) {
                                                    const endDate = new Date(formData.start_date);
                                                    endDate.setDate(endDate.getDate() + (newDuration * 7));
                                                    setFormData({
                                                        ...formData,
                                                        duration_weeks: newDuration,
                                                        end_date: endDate.toISOString().split('T')[0]
                                                    });
                                                } else {
                                                    setFormData({ ...formData, duration_weeks: newDuration });
                                                }
                                            }}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                            min="1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de places</label>
                                        <input
                                            type="number"
                                            value={formData.max_students}
                                            onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                            min="1"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Prérequis</label>
                                    <textarea
                                        value={formData.requirements}
                                        onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="is_mandatory"
                                            checked={formData.is_mandatory}
                                            onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })}
                                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="is_mandatory" className="ml-2 block text-sm text-gray-900">
                                            Stage obligatoire ?
                                        </label>
                                    </div>
                                    {formData.is_mandatory && (
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Année ciblée
                                            </label>
                                            <select
                                                value={formData.target_year || ''}
                                                onChange={(e) => setFormData({ ...formData, target_year: parseInt(e.target.value) })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                                required={formData.is_mandatory}
                                            >
                                                <option value="">Choisir l'année...</option>
                                                {[2, 3, 4, 5, 6, 7].map(year => (
                                                    <option key={year} value={year}>{year}ème année</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p-6 border-t flex space-x-3">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleCreateInternship}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                >
                                    Créer le stage
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showEditModal && selectedInternship && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b">
                                <h2 className="text-2xl font-bold text-gray-900">Modifier le stage</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Titre du stage *</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Département</label>
                                        <input
                                            type="text"
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Hôpital</label>
                                        <input
                                            type="text"
                                            value={formData.hospital}
                                            onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Date de début *</label>
                                        <input
                                            type="date"
                                            value={formData.start_date}
                                            min={new Date().toISOString().split('T')[0]}
                                            onChange={(e) => {
                                                const newStartDate = e.target.value;
                                                const endDate = new Date(newStartDate);
                                                endDate.setDate(endDate.getDate() + (formData.duration_weeks * 7));
                                                setFormData({
                                                    ...formData,
                                                    start_date: newStartDate,
                                                    end_date: endDate.toISOString().split('T')[0]
                                                });
                                            }}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Date de fin *</label>
                                        <input
                                            type="date"
                                            value={formData.end_date}
                                            min={formData.start_date || new Date().toISOString().split('T')[0]}
                                            onChange={(e) => {
                                                const newEndDate = e.target.value;
                                                if (formData.start_date) {
                                                    const start = new Date(formData.start_date);
                                                    const end = new Date(newEndDate);
                                                    const diffTime = Math.abs(end - start);
                                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                    const weeks = Math.round(diffDays / 7);
                                                    setFormData({
                                                        ...formData,
                                                        end_date: newEndDate,
                                                        duration_weeks: weeks
                                                    });
                                                }
                                            }}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Durée (semaines)</label>
                                        <input
                                            type="number"
                                            value={formData.duration_weeks}
                                            onChange={(e) => {
                                                const weeks = parseInt(e.target.value);
                                                if (formData.start_date) {
                                                    const endDate = new Date(formData.start_date);
                                                    endDate.setDate(endDate.getDate() + (weeks * 7));
                                                    setFormData({
                                                        ...formData,
                                                        duration_weeks: weeks,
                                                        end_date: endDate.toISOString().split('T')[0]
                                                    });
                                                } else {
                                                    setFormData({ ...formData, duration_weeks: weeks });
                                                }
                                            }}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            min="1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Nombre maximum d'étudiants</label>
                                        <input
                                            type="number"
                                            value={formData.max_students}
                                            onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            min="1"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Prérequis</label>
                                    <textarea
                                        value={formData.requirements}
                                        onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="edit_is_mandatory"
                                            checked={formData.is_mandatory}
                                            onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="edit_is_mandatory" className="ml-2 block text-sm text-gray-900">
                                            Stage obligatoire ?
                                        </label>
                                    </div>
                                    {formData.is_mandatory && (
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Année ciblée
                                            </label>
                                            <select
                                                value={formData.target_year || ''}
                                                onChange={(e) => setFormData({ ...formData, target_year: parseInt(e.target.value) })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                required={formData.is_mandatory}
                                            >
                                                <option value="">Choisir l'année...</option>
                                                {[2, 3, 4, 5, 6, 7].map(year => (
                                                    <option key={year} value={year}>{year}ème année</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p-6 border-t flex space-x-3">
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedInternship(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleUpdateInternship}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    Mettre à jour
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showApplicationModal && selectedApplication && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b">
                                <h2 className="text-2xl font-bold text-gray-900">Candidature de {selectedApplication.student.full_name}</h2>
                                <p className="text-gray-600 mt-1">{selectedApplication.internship.title}</p>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Informations étudiant</h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div><span className="font-medium">Matricule:</span> {selectedApplication.student.matricule}</div>
                                        <div><span className="font-medium">Email:</span> {selectedApplication.student.email}</div>
                                        <div><span className="font-medium">Département:</span> {selectedApplication.student.department}</div>
                                        <div><span className="font-medium">Année:</span> {selectedApplication.student.year_of_study}</div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Documents</h3>
                                    {documents.length > 0 ? (
                                        <div className="space-y-2">
                                            {documents.map((doc) => (
                                                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="bg-blue-100 p-2 rounded-lg">
                                                            <FileText className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{doc.file_name}</p>
                                                            <p className="text-xs text-gray-500 uppercase">{doc.document_type}</p>
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={`http://localhost:8000${doc.file_url}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        <span>Télécharger</span>
                                                    </a >
                                                </div >
                                            ))
                                            }
                                        </div >
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">Aucun document disponible</p>
                                    )}
                                </div >

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Lettre de motivation</h3>
                                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                                        {selectedApplication.motivation_letter || 'Aucune lettre de motivation fournie'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notes d'évaluation
                                    </label>
                                    <textarea
                                        value={reviewNotes}
                                        onChange={(e) => setReviewNotes(e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        placeholder="Ajoutez vos commentaires..."
                                    />
                                </div>
                            </div >
                            <div className="p-6 border-t flex space-x-3">
                                <button
                                    onClick={() => {
                                        setShowApplicationModal(false);
                                        setSelectedApplication(null);
                                        setReviewNotes('');
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                                >
                                    Fermer
                                </button>
                                <button
                                    onClick={() => handleReviewApplication(selectedApplication.id, 'rejected')}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                >
                                    Refuser
                                </button>
                                <button
                                    onClick={() => handleReviewApplication(selectedApplication.id, 'accepted')}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                >
                                    Accepter
                                </button>
                            </div>
                        </div >
                    </div >
                )
            }

            {
                showAssignModal && selectedStudent && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl max-w-md w-full">
                            <div className="p-6 border-b">
                                <h2 className="text-2xl font-bold text-gray-900">Assigner un médecin encadrant</h2>
                                <p className="text-sm text-gray-600 mt-1">Pour {selectedStudent.student.full_name}</p>
                            </div>
                            <div className="p-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Sélectionner un médecin
                                </label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={selectedDoctor}
                                    onChange={(e) => setSelectedDoctor(e.target.value)}
                                >
                                    <option value="">Choisir un médecin...</option>
                                    {doctors.map((doctor) => (
                                        <option key={doctor.id} value={doctor.id}>
                                            {doctor.full_name} - {doctor.department}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="p-6 border-t flex space-x-3">
                                <button
                                    onClick={() => {
                                        setShowAssignModal(false);
                                        setSelectedStudent(null);
                                        setSelectedDoctor('');
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleAssignSupervisor}
                                    disabled={!selectedDoctor}
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Confirmer
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Add Doctor Modal */}
            {
                showAddDoctorModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b">
                                <h2 className="text-2xl font-bold text-gray-900">Ajouter un médecin encadrant</h2>
                            </div>
                            <form onSubmit={handleAddDoctor} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Matricule *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newDoctor.matricule}
                                        onChange={(e) => setNewDoctor({ ...newDoctor, matricule: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newDoctor.full_name}
                                        onChange={(e) => setNewDoctor({ ...newDoctor, full_name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                                    <input
                                        type="email"
                                        required
                                        value={newDoctor.email}
                                        onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe *</label>
                                    <input
                                        type="password"
                                        required
                                        value={newDoctor.password}
                                        onChange={(e) => setNewDoctor({ ...newDoctor, password: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                        placeholder="Mot de passe initial"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                                    <input
                                        type="text"
                                        value={newDoctor.phone}
                                        onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Département</label>
                                    <input
                                        type="text"
                                        value={newDoctor.department}
                                        onChange={(e) => setNewDoctor({ ...newDoctor, department: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Hôpital</label>
                                    <input
                                        type="text"
                                        value={newDoctor.hospital_affiliation}
                                        onChange={(e) => setNewDoctor({ ...newDoctor, hospital_affiliation: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div className="flex space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddDoctorModal(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                                    >
                                        Ajouter
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
