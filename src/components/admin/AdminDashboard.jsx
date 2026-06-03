import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    Users, UserPlus, Trash2, Search,
    LayoutDashboard, Stethoscope, GraduationCap, Building2,
    LogOut, Plus, X, AlertCircle, CheckCircle
} from 'lucide-react';

export default function AdminDashboard() {
    const { profile, signOut } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [newUser, setNewUser] = useState({
        matricule: '',
        full_name: '',
        email: '',
        password: '',
        role: 'supervisor', // Default
        department: '',
        hospital_affiliation: '',
        phone: ''
    });

    const stats = {
        supervisors: users.filter(u => u.role === 'supervisor').length,
        medicine: users.filter(u => u.role === 'medicine').length,
        dept_heads: users.filter(u => u.role === 'department_head').length,
        total: users.length
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:8000/api/core/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:8000/api/core/admin/users', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newUser)
            });

            if (response.ok) {
                alert("Utilisateur créé avec succès !");
                setShowAddModal(false);
                fetchUsers();
                setNewUser({
                    matricule: '', full_name: '', email: '', password: '',
                    role: 'supervisor', department: '', hospital_affiliation: '', phone: ''
                });
            } else {
                const error = await response.json();
                alert("Erreur: " + JSON.stringify(error));
            }
        } catch (error) {
            console.error("Error creating user:", error);
            alert("Erreur de connexion");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`http://localhost:8000/api/core/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setUsers(users.filter(u => u.id !== userId));
            } else {
                alert("Erreur lors de la suppression");
            }
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    // Filter users based on active tab and search
    const getFilteredUsers = () => {
        let filtered = users;
        if (activeTab === 'supervisors') filtered = users.filter(u => u.role === 'supervisor');
        if (activeTab === 'medicine') filtered = users.filter(u => u.role === 'medicine');
        if (activeTab === 'dept_heads') filtered = users.filter(u => u.role === 'department_head');

        return filtered.filter(u =>
            u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.matricule?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const UserTable = ({ data }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Détails</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                        {user.full_name?.charAt(0)}
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                                        <div className="text-sm text-gray-500">{user.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${user.role === 'supervisor' ? 'bg-green-100 text-green-800' :
                                        user.role === 'medicine' ? 'bg-indigo-100 text-indigo-800' :
                                            user.role === 'department_head' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {user.role === 'supervisor' ? 'Superviseur Pédagogique' :
                                        user.role === 'medicine' ? 'Médecin' :
                                            user.role === 'department_head' ? 'Chef Département' : user.role}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.department && <div>Dept: {user.department}</div>}
                                {user.hospital_affiliation && <div>université : {user.hospital_affiliation}</div>}
                                <div className="text-xs text-gray-400">Mat: {user.matricule}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-full transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 hidden md:block fixed h-full z-10">
                <div className="h-16 flex items-center px-6 border-b border-gray-200">
                    <Building2 className="h-8 w-8 text-blue-600 mr-2" />
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        Admin
                    </span>
                </div>

                <nav className="p-4 space-y-1">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <LayoutDashboard size={20} className="mr-3" />
                        Vue d'ensemble
                    </button>
                    <button
                        onClick={() => setActiveTab('supervisors')}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'supervisors' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <GraduationCap size={20} className="mr-3" />
                        Superviseurs Pédagogiques
                    </button>
                    <button
                        onClick={() => setActiveTab('medicine')}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'medicine' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Stethoscope size={20} className="mr-3" />
                        Médecins
                    </button>
                    <button
                        onClick={() => setActiveTab('dept_heads')}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'dept_heads' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Building2 size={20} className="mr-3" />
                        Chefs de Département
                    </button>
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
                    <div className="flex items-center mb-4 px-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            {profile?.full_name?.charAt(0)}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-700">{profile?.full_name}</p>
                            <p className="text-xs text-gray-500">Administrateur</p>
                        </div>
                    </div>
                    <button
                        onClick={signOut}
                        className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                        <LogOut size={18} className="mr-2" />
                        Déconnexion
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 md:ml-64 p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {activeTab === 'overview' && 'Tableau de bord'}
                            {activeTab === 'supervisors' && 'Gestion des Superviseurs'}
                            {activeTab === 'medicine' && 'Gestion des Médecins'}
                            {activeTab === 'dept_heads' && 'Gestion des Chefs de Département'}
                        </h1>
                        <p className="text-gray-500 mt-1">Gérez les utilisateurs et les accès de l'établissement</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all transform hover:scale-105"
                    >
                        <UserPlus size={20} className="mr-2" />
                        Ajouter un utilisateur
                    </button>
                </div>

                {/* Search Bar */}
                {activeTab !== 'overview' && (
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center">
                        <Search className="text-gray-400 mr-3" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher par nom ou matricule..."
                            className="flex-1 outline-none text-gray-700"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                )}

                {/* Content */}
                {activeTab === 'overview' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                                    <Users size={24} />
                                </div>
                                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Actifs</span>
                            </div>
                            <h3 className="text-gray-500 text-sm font-medium">Total Utilisateurs</h3>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                                    <GraduationCap size={24} />
                                </div>
                            </div>
                            <h3 className="text-gray-500 text-sm font-medium">Superviseurs</h3>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.supervisors}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                                    <Stethoscope size={24} />
                                </div>
                            </div>
                            <h3 className="text-gray-500 text-sm font-medium">Médecins</h3>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.medicine}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                                    <Building2 size={24} />
                                </div>
                            </div>
                            <h3 className="text-gray-500 text-sm font-medium">Chefs Département</h3>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.dept_heads}</p>
                        </div>
                    </div>
                ) : (
                    <UserTable data={getFilteredUsers()} />
                )}
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-900">Ajouter un nouvel utilisateur</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleAddUser} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                                    <select
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                    >
                                        <option value="supervisor">Superviseur Pédagogique</option>
                                        <option value="medicine">Médecin</option>
                                        <option value="department_head">Chef de Département</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Matricule</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newUser.matricule}
                                        onChange={(e) => setNewUser({ ...newUser, matricule: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newUser.full_name}
                                        onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                />
                            </div>

                            {/* Conditional Fields based on Role */}
                            {newUser.role !== 'admin' && (
                                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                                    {(newUser.role === 'supervisor' || newUser.role === 'department_head' || newUser.role === 'medicine') && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {newUser.role === 'medicine' ? 'Spécialité / Service' : 'Département'}
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={newUser.department}
                                                onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                                                placeholder={newUser.role === 'medicine' ? "ex: Cardiologie, Pédiatrie..." : "ex: Informatique, Biologie..."}
                                            />
                                        </div>
                                    )}

                                    {(newUser.role === 'medicine' || newUser.role === 'supervisor' || newUser.role === 'department_head') && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {newUser.role === 'medicine' ? 'Hôpital / Structure' :
                                                    newUser.role === 'department_head' ? 'Université affiliée' : 'Affiliation (Optionnel)'}
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={newUser.hospital_affiliation}
                                                onChange={(e) => setNewUser({ ...newUser, hospital_affiliation: e.target.value })}
                                                placeholder={newUser.role === 'department_head' ? "ex: Université d'Alger 1" : "ex: CHU Mustapha..."}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    Créer l'utilisateur
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
