import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAttendanceRecords, recordAttendance } from '../../lib/api';
import { Activity, LogOut, Users, Calendar, CheckCircle, XCircle, AlertCircle, Plus } from 'lucide-react';

export default function MedicineDashboard() {
    const { profile, signOut } = useAuth();
    const [applications, setApplications] = useState([]);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceStatus, setAttendanceStatus] = useState('present');
    const [attendanceNotes, setAttendanceNotes] = useState('');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalStudents: 0,
        presentToday: 0,
        absentToday: 0,
    });
    const [showEvaluationModal, setShowEvaluationModal] = useState(false);
    const [evaluationRating, setEvaluationRating] = useState(10);
    const [evaluationComments, setEvaluationComments] = useState('');
    const [currentEvaluation, setCurrentEvaluation] = useState(null);

    const [evaluations, setEvaluations] = useState({});
    const [evaluationsLoaded, setEvaluationsLoaded] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (applications.length > 0 && profile?.id) {
            setEvaluationsLoaded(false);
            loadEvaluations();
        }
    }, [applications, profile?.id]);

    useEffect(() => {
        if (applications.length > 0 && evaluationsLoaded) {
            const pending = applications.filter(app => {
                const hasEvaluation = !!evaluations[app.id];
                return !hasEvaluation;
            }).length;

            setStats(prev => ({
                ...prev,
                pendingEvaluations: pending
            }));
        }
    }, [evaluations, applications, evaluationsLoaded]);

    const loadData = async () => {
        setLoading(true);
        await loadAssignedApplications();
        setLoading(false);
    };

    const loadEvaluations = async () => {
        if (!applications.length || !profile?.id) return;
        const evalPromises = applications.map(async (app) => {
            try {
                const token = localStorage.getItem('accessToken');
                const response = await fetch(
                    `http://localhost:8000/api/applications/${app.id}/get-evaluation?supervisorId=${profile.id}`,
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
        setEvaluationsLoaded(true);
    };

    const loadAssignedApplications = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:8000/api/medicine/applications/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setApplications(data || []);

                // Calculate stats
                const completedInternships = (data || []).filter(app => new Date(app.internship.end_date) < new Date()).length;

                setStats(prev => ({
                    ...prev,
                    totalStudents: data?.length || 0,
                    completedInternships: completedInternships
                }));
            }
        } catch (error) {
            console.error('Error loading applications:', error);
        }
    };

    const loadAttendanceRecords = async (applicationId) => {
        try {
            const records = await getAttendanceRecords(applicationId);
            setAttendanceRecords(records);
        } catch (error) {
            console.error('Error loading attendance:', error);
        }
    };

    const handleRecordAttendance = async () => {
        if (!selectedApplication) return;

        try {
            await recordAttendance(
                selectedApplication.id,
                attendanceDate,
                attendanceStatus,
                attendanceNotes,
                profile?.id || ''
            );

            setShowAttendanceModal(false);
            setAttendanceNotes('');
            setAttendanceStatus('present');
            await loadAttendanceRecords(selectedApplication.id);
            await loadData();
        } catch (error) {
            console.error('Error recording attendance:', error);
            alert('Erreur lors de l\'enregistrement de la présence');
        }
    };

    const getAttendanceStats = () => {
        const present = attendanceRecords.filter(r => r.status === 'present').length;
        const absent = attendanceRecords.filter(r => r.status === 'absent').length;
        const excused = attendanceRecords.filter(r => r.status === 'excused').length;

        return { present, absent, excused };
    };

    const handleOpenEvaluation = async (application) => {
        setSelectedApplication(application);
        setShowEvaluationModal(true);

        // Load existing evaluation if any
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(
                `http://localhost:8000/api/applications/${application.id}/get-evaluation?supervisorId=${profile?.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            const data = await response.json();

            if (data.evaluation) {
                setCurrentEvaluation(data.evaluation);
                setEvaluationRating(data.evaluation.rating);
                setEvaluationComments(data.evaluation.comments);
            } else {
                setCurrentEvaluation(null);
                setEvaluationRating(10);
                setEvaluationComments('');
            }
        } catch (error) {
            console.error('Error loading evaluation:', error);
        }
    };

    const handleSubmitEvaluation = async () => {
        if (!selectedApplication) return;

        try {
            const response = await fetch(
                `http://localhost:8000/api/applications/${selectedApplication.id}/evaluation`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    },
                    body: JSON.stringify({
                        supervisorId: profile?.id,
                        rating: evaluationRating,
                        comments: evaluationComments
                    })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to submit evaluation');
            }

            setShowEvaluationModal(false);
            alert('Évaluation soumise avec succès !');
        } catch (error) {
            console.error('Error submitting evaluation:', error);
            alert('Erreur lors de la soumission de l\'évaluation');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Chargement...</p>
                </div>
            </div>
        );
    }

    const stats_data = getAttendanceStats();

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <div className="bg-teal-600 p-2 rounded-lg">
                                <Activity className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Espace Médecin Encadrant</h1>
                                <p className="text-xs text-gray-500">Dr. {profile?.full_name}</p>
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
                <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 text-white mb-8">
                    <h2 className="text-2xl font-bold mb-2">Suivi des Étudiants en Stage</h2>
                    <p className="text-teal-100">{profile?.department}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <p className="text-sm text-teal-100">Total Étudiants</p>
                            <p className="text-3xl font-bold">{stats.totalStudents}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <p className="text-sm text-teal-100">Évaluations en attente</p>
                            <p className="text-3xl font-bold text-yellow-300">{stats.pendingEvaluations || 0}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <p className="text-sm text-teal-100">Stages terminés</p>
                            <p className="text-3xl font-bold text-blue-300">{stats.completedInternships || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm p-6 border">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Étudiants en stage</h3>
                            <div className="space-y-3">
                                {applications.map((app) => (
                                    <div
                                        key={app.id}
                                        onClick={() => {
                                            setSelectedApplication(app);
                                            loadAttendanceRecords(app.id);
                                        }}
                                        className={`p-4 rounded-lg border cursor-pointer transition ${selectedApplication?.id === app.id
                                            ? 'bg-teal-50 border-teal-300 border-2'
                                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{app.student.full_name}</h4>
                                                <p className="text-sm text-gray-600">Matricule: {app.student.matricule}</p>
                                            </div>
                                            <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded-full">
                                                {app.internship.title}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            Année d'étude: {app.student.year_of_study}
                                        </p>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenEvaluation(app);
                                            }}
                                            className="mt-2 w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition text-sm font-medium"
                                        >
                                            Évaluer l'étudiant
                                        </button>
                                    </div>
                                ))}
                            </div>
                            {applications.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                    <p>Aucun étudiant assigné</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedApplication && (
                        <div className="bg-white rounded-xl shadow-sm p-6 border">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Détails du suivi</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Étudiant</p>
                                    <p className="text-base text-gray-900">{selectedApplication.student.full_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Stage</p>
                                    <p className="text-base text-gray-900">{selectedApplication.internship.title}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Période</p>
                                    <p className="text-sm text-gray-600">
                                        {new Date(selectedApplication.internship.start_date).toLocaleDateString('fr-FR')} à{' '}
                                        {new Date(selectedApplication.internship.end_date).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>

                                <div className="border-t pt-4">
                                    <p className="text-sm font-medium text-gray-700 mb-3">Statistiques de présence</p>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-green-50 rounded-lg p-3">
                                            <p className="text-2xl font-bold text-green-600">{stats_data.present}</p>
                                            <p className="text-xs text-green-700">Présent</p>
                                        </div>
                                        <div className="bg-red-50 rounded-lg p-3">
                                            <p className="text-2xl font-bold text-red-600">{stats_data.absent}</p>
                                            <p className="text-xs text-red-700">Absent</p>
                                        </div>
                                        <div className="bg-yellow-50 rounded-lg p-3">
                                            <p className="text-2xl font-bold text-yellow-600">{stats_data.excused}</p>
                                            <p className="text-xs text-yellow-700">Excusé</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowAttendanceModal(true)}
                                    className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 transition flex items-center justify-center space-x-2 font-medium"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>Marquer la présence</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {selectedApplication && attendanceRecords.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-6 border mt-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Historique de présence</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {attendanceRecords.map((record) => (
                                        <tr key={record.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm">
                                                {new Date(record.date).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${record.status === 'present'
                                                    ? 'bg-green-100 text-green-800'
                                                    : record.status === 'absent'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {record.status === 'present' ? 'Présent' :
                                                        record.status === 'absent' ? 'Absent' : 'Excusé'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{record.notes || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {showAttendanceModal && selectedApplication && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full">
                        <div className="p-6 border-b">
                            <h2 className="text-2xl font-bold text-gray-900">Marquer la présence</h2>
                            <p className="text-gray-600 mt-1">{selectedApplication.student.full_name}</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                                <input
                                    type="date"
                                    value={attendanceDate}
                                    onChange={(e) => setAttendanceDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                                <select
                                    value={attendanceStatus}
                                    onChange={(e) => setAttendanceStatus(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                >
                                    <option value="present">Présent</option>
                                    <option value="absent">Absent</option>
                                    <option value="excused">Excusé</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optionnel)</label>
                                <textarea
                                    value={attendanceNotes}
                                    onChange={(e) => setAttendanceNotes(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                    placeholder="Ajouter des observations..."
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t flex space-x-3">
                            <button
                                onClick={() => setShowAttendanceModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleRecordAttendance}
                                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                            >
                                Enregistrer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showEvaluationModal && selectedApplication && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full">
                        <div className="p-6 border-b">
                            <h2 className="text-2xl font-bold text-gray-900">Évaluer l'étudiant</h2>
                            <p className="text-gray-600 mt-1">{selectedApplication.student.full_name}</p>
                            {currentEvaluation && (
                                <p className="text-sm text-teal-600 mt-1">Dernière évaluation: {new Date(currentEvaluation.updated_at).toLocaleDateString('fr-FR')}</p>
                            )}
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Note (0-20)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="20"
                                    value={evaluationRating}
                                    onChange={(e) => setEvaluationRating(parseInt(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Commentaires
                                </label>
                                <textarea
                                    value={evaluationComments}
                                    onChange={(e) => setEvaluationComments(e.target.value)}
                                    rows={5}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                    placeholder="Votre évaluation de l'étudiant..."
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t flex space-x-3">
                            <button
                                onClick={() => {
                                    setShowEvaluationModal(false);
                                    setEvaluationRating(5);
                                    setEvaluationComments('');
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSubmitEvaluation}
                                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                            >
                                Soumettre
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
