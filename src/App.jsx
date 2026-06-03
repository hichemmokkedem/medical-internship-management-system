import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import StudentDashboard from './components/student/StudentDashboard';
import SupervisorDashboard from './components/supervisor/SupervisorDashboard';
import DepartmentDashboard from './components/department/DepartmentDashboard';
import MedicineDashboard from './components/medicine/MedicineDashboard';
import AdminDashboard from './components/admin/AdminDashboard';

function AppContent() {
    const { user, profile, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Chargement...</p>
                </div>
            </div>
        );
    }

    if (!user || !profile) {
        return <LoginPage />;
    }

    switch (profile.role) {
        case 'student':
            return <StudentDashboard />;
        case 'supervisor':
            return <SupervisorDashboard />;
        case 'medicine':
            return <MedicineDashboard />;
        case 'department_head':
            return <DepartmentDashboard />;
        case 'admin':
            return <AdminDashboard />;
        default:
            return <LoginPage />;
    }
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
