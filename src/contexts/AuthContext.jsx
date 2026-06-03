import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Helper to get tokens
    const getTokens = () => {
        const access = localStorage.getItem('accessToken');
        const refresh = localStorage.getItem('refreshToken');
        return { access, refresh };
    };

    // Helper to set tokens
    const setTokens = (access, refresh) => {
        localStorage.setItem('accessToken', access);
        localStorage.setItem('refreshToken', refresh);
    };

    // Helper to clear tokens
    const clearTokens = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const { access } = getTokens();
        if (access) {
            try {
                await loadProfile(access);
            } catch (error) {
                // If loading profile fails (e.g. 401), try to refresh token
                await refreshToken();
            }
        } else {
            setLoading(false);
        }
    };

    const refreshToken = async () => {
        const { refresh } = getTokens();
        if (!refresh) {
            signOut();
            return;
        }

        try {
            const response = await fetch('http://localhost:8000/api/token/refresh/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('accessToken', data.access);
                // Retry loading profile with new token
                await loadProfile(data.access);
            } else {
                signOut();
            }
        } catch (error) {
            console.error('Error refreshing token:', error);
            signOut();
        }
    };

    const loadProfile = async (token) => {
        try {
            const response = await fetch('http://localhost:8000/api/me/', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setProfile(data);
                setUser({ id: data.id, email: data.email }); // Mocking a user object similar to Supabase for compatibility
            } else {
                throw new Error('Failed to load profile');
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (matricule, password) => {
        try {
            const response = await fetch('http://localhost:8000/api/token/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    matricule: matricule, // Now sending 'matricule' as requested
                    password: password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setTokens(data.access, data.refresh);
                await loadProfile(data.access);
                return { error: null };
            } else {
                console.error('Login failed:', data);
                return { error: new Error(data.detail || 'Échec de la connexion') };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { error: new Error('Erreur de connexion au serveur') };
        }
    };

    const signOut = () => {
        clearTokens();
        setUser(null);
        setProfile(null);
        setLoading(false);
    };

    const refreshProfile = async () => {
        const { access } = getTokens();
        if (access) {
            await loadProfile(access);
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
