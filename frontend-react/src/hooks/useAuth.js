import { useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Hook for handling authentication redirects
export const useAuthRedirect = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!isLoading) {
            const from = location.state?.from?.pathname || '/dashboard';

            if (isAuthenticated && (location.pathname === '/signin' || location.pathname === '/signup')) {
                navigate(from, { replace: true });
            }
        }
    }, [isAuthenticated, isLoading, navigate, location]);

    return { isAuthenticated, isLoading };
};

// Hook for protected routes
export const useRequireAuth = (requiredRole = null) => {
    const { user, isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                navigate('/signin', {
                    state: { from: location },
                    replace: true
                });
            } else if (requiredRole && user?.role !== requiredRole) {
                navigate('/unauthorized', { replace: true });
            }
        }
    }, [isAuthenticated, isLoading, user, requiredRole, navigate, location]);

    return { user, isAuthenticated, isLoading };
};

// Hook for handling auth logout events
export const useAuthLogout = () => {
    const { signOut } = useAuth();

    useEffect(() => {
        const handleAuthLogout = () => {
            signOut();
        };

        window.addEventListener('auth:logout', handleAuthLogout);

        return () => {
            window.removeEventListener('auth:logout', handleAuthLogout);
        };
    }, [signOut]);
};