import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { uploadDocument, getApplicationDocuments, getStudentDocuments, reuseDocument } from '../../lib/api';
import { Bell, BookOpen, Calendar, Clock, FileText, MapPin, Users, LogOut, CheckCircle, XCircle, AlertCircle, Upload, File } from 'lucide-react';

export default function StudentDashboard() {
    const { profile, signOut } = useAuth();
    const [internships, setInternships] = useState([]);
    const [applications, setApplications] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [selectedInternship, setSelectedInternship] = useState(null);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [motivationLetter, setMotivationLetter] = useState('');
    const [cvFile, setCvFile] = useState(null);
    const [transcriptFile, setTranscriptFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState('available');
    const [documents, setDocuments] = useState([]);
    const [evaluations, setEvaluations] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all', 'mandatory', 'optional'

    // Document Reuse State
    const [previousDocuments, setPreviousDocuments] = useState([]);
    const [reuseCvId, setReuseCvId] = useState('');
    const [reuseTranscriptId, setReuseTranscriptId] = useState('');
    const [useExistingCv, setUseExistingCv] = useState(false);
    const [useExistingTranscript, setUseExistingTranscript] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (applications.length > 0) {
            loadEvaluations();
        }
    }, [applications]);

    const loadData = async () => {
        setLoading(true);
        await Promise.all([loadInternships(), loadApplications(), loadNotifications(), loadPreviousDocuments()]);
        setLoading(false);
    };

    const loadInternships = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:8000/api/internships/?status=open', {
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
            const response = await fetch('http://localhost:8000/api/applications/', {
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

    const loadNotifications = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:8000/api/notifications/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data || []);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    };

    const loadPreviousDocuments = async () => {
        try {
            const docs = await getStudentDocuments();
            setPreviousDocuments(docs || []);
        } catch (error) {
            console.error('Error loading previous documents:', error);
        }
    };

    const loadEvaluations = async () => {
        if (!applications || applications.length === 0) return;

        const acceptedApps = applications.filter(app => app.status === 'accepted');

        const evalPromises = acceptedApps.map(async (app) => {
            const supervisorId = app.medicine_supervisor?.id;

            if (!supervisorId) {
                console.warn(`No supervisorId for app ${app.id}`);
                return { appId: app.id, evaluation: null };
            }

            try {
                const token = localStorage.getItem('accessToken');
                const response = await fetch(
                    `http://localhost:8000/api/applications/${app.id}/get-evaluation?supervisorId=${supervisorId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();
                return { appId: app.id, evaluation: data.evaluation || null };

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

    const handleApply = async () => {
        if (!selectedInternship || !profile) return;
        setUploading(true);

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:8000/api/applications/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    internship: selectedInternship.id,
                    motivation_letter: motivationLetter
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Application creation failed:', errorData);
                // Handle array of errors or single error message
                const errorMessage = Array.isArray(errorData) ? errorData[0] :
                    (errorData.detail || errorData.non_field_errors?.[0] || 'Failed to create application');
                throw new Error(errorMessage);
            }

            const appData = await response.json();
            const applicationId = appData.id;

            // Handle CV
            if (useExistingCv && reuseCvId) {
                await reuseDocument(applicationId, reuseCvId);
            } else if (cvFile) {
                await uploadDocument(cvFile, applicationId, 'cv', profile.id);
            }

            // Handle Transcript
            if (useExistingTranscript && reuseTranscriptId) {
                await reuseDocument(applicationId, reuseTranscriptId);
            } else if (transcriptFile) {
                await uploadDocument(transcriptFile, applicationId, 'transcript', profile.id);
            }

            setShowApplyModal(false);
            setMotivationLetter('');
            setCvFile(null);
            setTranscriptFile(null);
            setUseExistingCv(false);
            setUseExistingTranscript(false);
            setReuseCvId('');
            setReuseTranscriptId('');
            setSelectedInternship(null);
            await loadData();
        } catch (error) {
            console.error('Error applying:', error);
            alert(error.message || 'Erreur lors de la candidature');
        } finally {
            setUploading(false);
        }
    };

    const loadDocuments = async (applicationId) => {
        try {
            const docs = await getApplicationDocuments(applicationId);
            setDocuments(docs);
        } catch (error) {
            console.error('Error loading documents:', error);
        }
    };

    const markNotificationAsRead = async (id) => {
        try {
            const token = localStorage.getItem('accessToken');
            await fetch(`http://localhost:8000/api/notifications/${id}/mark-read/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            await loadNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
            accepted: 'bg-green-100 text-green-800 border-green-300',
            rejected: 'bg-red-100 text-red-800 border-red-300',
            withdrawn: 'bg-gray-100 text-gray-800 border-gray-300',
        };
        const labels = {
            pending: 'En attente',
            accepted: 'Acceptée',
            rejected: 'Refusée',
            withdrawn: 'Retirée',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    const hasApplied = (internshipId) => {
        return applications.some(app => {
            const appId = typeof app.internship === 'object' ? app.internship.id : app.internship;
            return appId === internshipId;
        });
    };

    const canReapply = (internship) => {
        const app = applications.find(a => {
            const appId = typeof a.internship === 'object' ? a.internship.id : a.internship;
            return appId === internship.id;
        });

        if (!app) return false;

        // Check availability
        const isFull = internship.current_students >= internship.max_students;
        const isExpired = new Date(internship.end_date) < new Date();
        if (isFull || isExpired) return false;

        // Only allow re-application if:
        // 1. Previous application was REJECTED
        // 2. Internship was updated AFTER the application
        if (app.status !== 'rejected') return false;

        const appDate = new Date(app.applied_at);
        const updateDate = new Date(internship.updated_at);

        return updateDate > appDate;
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
                            <div className="bg-blue-600 p-2 rounded-lg">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Espace Étudiant</h1>
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
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-6 text-white mb-8">
                    <h2 className="text-2xl font-bold mb-2">Bienvenue, {profile?.full_name}</h2>
                    <p className="text-blue-100">Matricule: {profile?.matricule} | {profile?.department} | {profile?.year_of_study}ème année</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <p className="text-sm text-blue-100">Candidatures</p>
                            <p className="text-3xl font-bold">{applications.length}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <p className="text-sm text-blue-100">Acceptées</p>
                            <p className="text-3xl font-bold">{applications.filter(a => a.status === 'accepted').length}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <p className="text-sm text-blue-100">Notifications</p>
                            <p className="text-3xl font-bold">{notifications.filter(n => !n.is_read).length}</p>
                        </div>
                    </div>
                </div>

                <div className="flex space-x-2 mb-6">
                    <button
                        onClick={() => setActiveTab('available')}
                        className={`px-6 py-3 rounded-lg font-medium transition ${activeTab === 'available'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        Stages Disponibles
                    </button>
                    <button
                        onClick={() => setActiveTab('applications')}
                        className={`px-6 py-3 rounded-lg font-medium transition ${activeTab === 'applications'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        Mes Candidatures
                    </button>
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`px-6 py-3 rounded-lg font-medium transition relative ${activeTab === 'notifications'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <Bell className="w-5 h-5 inline mr-2" />
                        Notifications
                        {notifications.filter(n => !n.is_read).length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {notifications.filter(n => !n.is_read).length}
                            </span>
                        )}
                    </button>
                </div>

                {activeTab === 'available' && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rechercher</label>
                                <input
                                    type="text"
                                    placeholder="Titre du stage, hôpital..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="w-full md:w-64">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type de stage</label>
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="all">Tous les stages</option>
                                    <option value="mandatory">Obligatoires</option>
                                    <option value="optional">Optionnels</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {profile?.year_of_study === 1 ? (
                                <div className="col-span-2 text-center py-12 bg-white rounded-xl">
                                    <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun stage disponible</h3>
                                    <p className="text-gray-500">Les stages ne sont pas accessibles aux étudiants de 1ère année.</p>
                                </div>
                            ) : (
                                internships
                                    .filter(internship => {
                                        const isVisible = (!internship.is_mandatory) ||
                                            (internship.is_mandatory && internship.target_year === profile?.year_of_study);

                                        if (!isVisible) return false;

                                        const matchesSearch = internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            internship.hospital.toLowerCase().includes(searchTerm.toLowerCase());

                                        const matchesType = filterType === 'all' ||
                                            (filterType === 'mandatory' && internship.is_mandatory) ||
                                            (filterType === 'optional' && !internship.is_mandatory);

                                        return matchesSearch && matchesType;
                                    })
                                    .map((internship) => (
                                        <div key={internship.id} className={`bg-white rounded-xl shadow-sm hover:shadow-md transition p-6 border flex flex-col h-full ${internship.is_mandatory ? 'border-l-4 border-l-red-500' : ''}`}>
                                            <div className="flex-grow">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-gray-900">{internship.title}</h3>
                                                        {internship.is_mandatory && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">
                                                                <AlertCircle className="w-3 h-3 mr-1" />
                                                                Obligatoire
                                                            </span>
                                                        )}
                                                    </div>
                                                    {hasApplied(internship.id) && (
                                                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full whitespace-nowrap ml-2">
                                                            Déjà postulé
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-gray-600 mb-4">{internship.description}</p>
                                                {internship.requirements && (
                                                    <div className="mb-4">
                                                        <h4 className="font-semibold text-gray-800 text-sm mb-1">Prérequis:</h4>
                                                        <p className="text-sm text-gray-600">{internship.requirements}</p>
                                                    </div>
                                                )}
                                                <div className="space-y-2 mb-4">
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                                        {internship.hospital}
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <FileText className="w-4 h-4 mr-2 text-gray-400" />
                                                        {internship.department}
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                        {new Date(internship.start_date).toLocaleDateString('fr-FR')} - {new Date(internship.end_date).toLocaleDateString('fr-FR')}
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                                        {internship.duration_weeks} semaines
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Users className="w-4 h-4 mr-2 text-gray-400" />
                                                        {internship.current_students}/{internship.max_students} places
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-auto">
                                                <button
                                                    onClick={() => {
                                                        setSelectedInternship(internship);
                                                        setShowApplyModal(true);
                                                    }}
                                                    disabled={
                                                        (!canReapply(internship) && hasApplied(internship.id)) ||
                                                        internship.current_students >= internship.max_students ||
                                                        new Date(internship.end_date) < new Date()
                                                    }
                                                    className={`w-full py-2 rounded-lg transition font-medium ${canReapply(internship)
                                                        ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                                        : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                                                        }`}
                                                >
                                                    {canReapply(internship)
                                                        ? 'Mettre à jour ma candidature'
                                                        : hasApplied(internship.id)
                                                            ? 'Déjà postulé'
                                                            : new Date(internship.end_date) < new Date()
                                                                ? 'Stage Terminé'
                                                                : internship.current_students >= internship.max_students
                                                                    ? 'Complet'
                                                                    : 'Postuler'}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                            )}
                            {profile?.year_of_study !== 1 && internships.filter(i => (!i.is_mandatory) || (i.is_mandatory && i.target_year === profile?.year_of_study)).length === 0 && (
                                <div className="col-span-2 text-center py-12 bg-white rounded-xl">
                                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">Aucun stage disponible pour le moment</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'applications' && (
                    <div className="space-y-4">
                        {applications.map((app) => (
                            <div key={app.id} className="bg-white rounded-xl shadow-sm p-6 border">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{app.internship.title}</h3>
                                        <p className="text-sm text-gray-600">{app.internship.hospital} - {app.internship.department}</p>
                                    </div>
                                    {getStatusBadge(app.status)}
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                    <div>
                                        <span className="font-medium">Date de candidature:</span><br />
                                        {new Date(app.applied_at).toLocaleDateString('fr-FR')}
                                    </div>
                                    <div>
                                        <span className="font-medium">Période du stage:</span><br />
                                        {new Date(app.internship.start_date).toLocaleDateString('fr-FR')} - {new Date(app.internship.end_date).toLocaleDateString('fr-FR')}
                                    </div>
                                </div>
                                {app.review_notes && app.status !== 'pending' && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                        <p className="text-sm font-medium text-gray-700 mb-1">Note du superviseur:</p>
                                        <p className="text-sm text-gray-600">{app.review_notes}</p>
                                    </div>
                                )}
                                {evaluations[app.id] && (
                                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-bold text-blue-900 mb-1">Évaluation du stage</p>
                                                <p className="text-sm text-blue-800">{evaluations[app.id].comments}</p>
                                            </div>
                                            <div className="bg-white px-3 py-1 rounded-full border border-blue-200">
                                                <span className="text-lg font-bold text-blue-600">{evaluations[app.id].rating}/20</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {applications.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-xl">
                                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">Aucune candidature pour le moment</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="space-y-3">
                        {notifications.map((notif) => (
                            <div
                                key={notif.id}
                                onClick={() => !notif.is_read && markNotificationAsRead(notif.id)}
                                className={`bg-white rounded-xl shadow-sm p-4 border cursor-pointer transition hover:shadow-md ${!notif.is_read ? 'border-l-4 border-l-blue-600' : ''
                                    }`}
                            >
                                <div className="flex items-start space-x-3">
                                    <div className={`p-2 rounded-lg ${notif.type === 'application_status' && notif.title.includes('Acceptée')
                                        ? 'bg-green-100'
                                        : notif.type === 'application_status' && notif.title.includes('Refusée')
                                            ? 'bg-red-100'
                                            : 'bg-blue-100'
                                        }`}>
                                        {notif.type === 'application_status' && notif.title.includes('Acceptée') ? (
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        ) : notif.type === 'application_status' && notif.title.includes('Refusée') ? (
                                            <XCircle className="w-5 h-5 text-red-600" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5 text-blue-600" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-semibold text-gray-900">{notif.title}</h4>
                                            <span className="text-xs text-gray-500">
                                                {new Date(notif.created_at).toLocaleDateString('fr-FR')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {notifications.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-xl">
                                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">Aucune notification</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showApplyModal && selectedInternship && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <h2 className="text-2xl font-bold text-gray-900">Postuler au stage</h2>
                            <p className="text-gray-600 mt-1">{selectedInternship.title}</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Lettre de motivation *
                                </label>
                                <textarea
                                    value={motivationLetter}
                                    onChange={(e) => setMotivationLetter(e.target.value)}
                                    rows={5}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    placeholder="Expliquez pourquoi vous souhaitez effectuer ce stage..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Upload className="w-4 h-4 inline mr-2" />
                                    CV (PDF ou Word)
                                </label>
                                <div className="flex space-x-4 mb-2">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={!useExistingCv}
                                            onChange={() => setUseExistingCv(false)}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Nouveau fichier</span>
                                    </label>
                                    {previousDocuments.some(d => d.document_type === 'cv') && (
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                checked={useExistingCv}
                                                onChange={() => setUseExistingCv(true)}
                                                className="text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700">Utiliser un fichier existant</span>
                                        </label>
                                    )}
                                </div>
                                {useExistingCv ? (
                                    <select
                                        value={reuseCvId}
                                        onChange={(e) => setReuseCvId(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    >
                                        <option value="">Sélectionner un CV</option>
                                        {previousDocuments.filter(d => d.document_type === 'cv').map(doc => (
                                            <option key={doc.id} value={doc.id}>
                                                {doc.file_name} ({new Date(doc.uploaded_at).toLocaleDateString()})
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition cursor-pointer bg-gray-50">
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                                            className="hidden"
                                        />
                                        <div className="text-center">
                                            <File className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-600">
                                                {cvFile ? cvFile.name : 'Cliquez pour sélectionner votre CV'}
                                            </p>
                                        </div>
                                    </label>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Upload className="w-4 h-4 inline mr-2" />
                                    Relevé de notes (PDF ou image)
                                </label>
                                <div className="flex space-x-4 mb-2">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={!useExistingTranscript}
                                            onChange={() => setUseExistingTranscript(false)}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Nouveau fichier</span>
                                    </label>
                                    {previousDocuments.some(d => d.document_type === 'transcript') && (
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                checked={useExistingTranscript}
                                                onChange={() => setUseExistingTranscript(true)}
                                                className="text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700">Utiliser un fichier existant</span>
                                        </label>
                                    )}
                                </div>
                                {useExistingTranscript ? (
                                    <select
                                        value={reuseTranscriptId}
                                        onChange={(e) => setReuseTranscriptId(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    >
                                        <option value="">Sélectionner un relevé</option>
                                        {previousDocuments.filter(d => d.document_type === 'transcript').map(doc => (
                                            <option key={doc.id} value={doc.id}>
                                                {doc.file_name} ({new Date(doc.uploaded_at).toLocaleDateString()})
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition cursor-pointer bg-gray-50">
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => setTranscriptFile(e.target.files?.[0] || null)}
                                            className="hidden"
                                        />
                                        <div className="text-center">
                                            <File className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-600">
                                                {transcriptFile ? transcriptFile.name : 'Cliquez pour sélectionner votre relevé'}
                                            </p>
                                        </div>
                                    </label>
                                )}
                            </div>
                        </div>
                        <div className="p-6 border-t flex space-x-3">
                            <button
                                onClick={() => {
                                    setShowApplyModal(false);
                                    setMotivationLetter('');
                                    setSelectedInternship(null);
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleApply}
                                disabled={!motivationLetter.trim() || uploading}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploading ? 'Envoi en cours...' : 'Envoyer la candidature'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
