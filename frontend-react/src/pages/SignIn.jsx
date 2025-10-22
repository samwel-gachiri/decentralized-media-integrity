import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import SignInForm from '../components/auth/SignInForm';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import Button from '../components/ui/Button';

const SignIn = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, fallbackMode, isGuest } = useAuth();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            const from = location.state?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, location]);

    const handleSignInSuccess = (user) => {
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
    };

    const handleSignInError = (error) => {
        console.error('Sign in error:', error);
        // Error is already handled by the form component
    };

    const testBackend = async () => {
        try {
            const result = await authService.testConnection();
            console.log('Backend test successful:', result);
            alert('Backend connection successful!');
        } catch (error) {
            console.error('Backend test failed:', error);
            alert('Backend connection failed: ' + error.message);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center mb-6"
                    >
                        <span className="text-2xl">🌍</span>
                    </motion.div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        News Integrity Platform
                        {fallbackMode && (
                            <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                                Offline Mode
                            </span>
                        )}
                        {isGuest && (
                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                                Demo Mode
                            </span>
                        )}
                    </h1>
                    <p className="text-gray-600">
                        Community-driven news verification and integrity monitoring
                    </p>
                </motion.div>

                {/* Sign In Form */}
                <SignInForm
                    onSuccess={handleSignInSuccess}
                    onError={handleSignInError}
                />

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-center text-sm text-gray-500"
                >
                    <p>
                        By signing in, you agree to our{' '}
                        <a href="/terms" className="text-blue-600 hover:text-blue-500">
                            Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="/privacy" className="text-blue-600 hover:text-blue-500">
                            Privacy Policy
                        </a>
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default SignIn;