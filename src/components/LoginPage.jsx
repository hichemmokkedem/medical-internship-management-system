import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, Lock, User } from 'lucide-react';

export default function LoginPage() {
    const [matricule, setMatricule] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error } = await signIn(matricule, password);

        if (error) {
            setError(error.message === 'Matricule introuvable'
                ? 'Matricule introuvable'
                : 'Matricule ou mot de passe incorrect');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-white">
                        <div className="flex items-center justify-center mb-4">
                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
                                <GraduationCap className="w-12 h-12" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-center">Gestion des Stages</h1>
                        <p className="text-center text-blue-100 mt-2">Plateforme Médicale</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Matricule
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={matricule}
                                    onChange={(e) => setMatricule(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    placeholder="Entrez votre matricule"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mot de passe
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    placeholder="Entrez votre mot de passe"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                        >
                            {loading ? 'Connexion...' : 'Se connecter'}
                        </button>
                    </form>
                </div>

                <div className="mt-6 text-center text-sm text-gray-600">
                    <p>Accès réservé aux étudiants, superviseurs, les médecins et chefs de département</p>
                </div>
            </div>
        </div>
    );
}
