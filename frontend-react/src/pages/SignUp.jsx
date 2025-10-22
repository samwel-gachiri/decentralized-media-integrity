import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import SignUpForm from '../components/auth/SignUpForm';
import { useAuth } from '../hooks/useAuth';

const SignUp = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/news-dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    // eslint-disable-next-line no-unused-vars
    const handleSignUpSuccess = (user) => {
        // Navigate to dashboard after successful signup
        navigate('/news-dashboard', { replace: true });
    };

    const handleSignUpError = (error) => {
        console.error('Sign up error:', error);
        // Error is already handled by the form component
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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
                        className="mx-auto h-16 w-16 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-full flex items-center justify-center mb-6"
                    >
                        <span className="text-2xl">📰</span>
                    </motion.div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Join News Integrity Network
                    </h1>
                    <p className="text-gray-600">
                        Help verify news authenticity with AI-powered analysis and community verification
                    </p>
                </motion.div>

                {/* Sign Up Form */}
                <SignUpForm
                    onSuccess={handleSignUpSuccess}
                    onError={handleSignUpError}
                />

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-center text-sm text-gray-500"
                >
                    <p>
                        By creating an account, you agree to our{' '}
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

export default SignUp;