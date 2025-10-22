import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Loader2, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { signInValidationRules, validateFormData } from '../../utils/validation';
import { authService } from '../../services/authService';

const SignInForm = ({ onSuccess, onError }) => {
    // eslint-disable-next-line no-unused-vars
    const { signIn, isLoading, error, fallbackMode } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });
    const [showPassword, setShowPassword] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [hasFallbackCredentials, setHasFallbackCredentials] = useState(false);
    const [usingFallback, setUsingFallback] = useState(false);

    // Check for fallback credentials when email changes
    useEffect(() => {
        if (formData.email) {
            const hasCredentials = authService.hasFallbackCredentials(formData.email);
            setHasFallbackCredentials(hasCredentials);
        } else {
            setHasFallbackCredentials(false);
        }
    }, [formData.email]);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear validation error when user starts typing
        if (validationErrors[name]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Validate form using centralized validation
    const validateForm = () => {
        const { isValid, errors } = validateFormData(formData, signInValidationRules);
        setValidationErrors(errors);
        return isValid;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setUsingFallback(false);

        try {
            const result = await signIn({
                email: formData.email,
                password: formData.password
            });

            if (result.success) {
                if (result.fallbackMode) {
                    setUsingFallback(true);
                }
                onSuccess?.(result.user);
            } else {
                onError?.(result.error);
            }
        } catch (err) {
            onError?.(err.message || 'Sign in failed');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md mx-auto"
        >
            <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-8">
                    <motion.h2
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-3xl font-bold text-gray-900 mb-2"
                    >
                        Welcome Back
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-gray-600"
                    >
                        Sign in to your News Integrity account
                    </motion.p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
                    >
                        <p className="text-red-600 text-sm">{error}</p>
                    </motion.div>
                )}

                {hasFallbackCredentials && !usingFallback && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"
                    >
                        {/* <div className="flex items-center">
                            <Wifi className="w-5 h-5 text-green-600 mr-2" />
                            <div>
                                <p className="text-green-800 text-sm font-medium">Offline Login Available</p>
                                <p className="text-green-600 text-xs">Cached credentials found. You can login even if the server is unavailable.</p>
                            </div>
                        </div> */}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email Field */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${validationErrors.email
                                    ? 'border-red-300 bg-red-50'
                                    : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                placeholder="Enter your email"
                                disabled={isLoading}
                            />
                        </div>
                        {validationErrors.email && (
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-1 text-sm text-red-600"
                            >
                                {validationErrors.email}
                            </motion.p>
                        )}
                    </motion.div>

                    {/* Password Field */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`block w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${validationErrors.password
                                    ? 'border-red-300 bg-red-50'
                                    : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                placeholder="Enter your password"
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                disabled={isLoading}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                ) : (
                                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                )}
                            </button>
                        </div>
                        {validationErrors.password && (
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-1 text-sm text-red-600"
                            >
                                {validationErrors.password}
                            </motion.p>
                        )}
                    </motion.div>

                    {/* Remember Me & Forgot Password */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="flex items-center justify-between"
                    >
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                name="rememberMe"
                                checked={formData.rememberMe}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                disabled={isLoading}
                            />
                            <span className="ml-2 text-sm text-gray-600">Remember me</span>
                        </label>
                        <Link
                            to="/forgot-password"
                            className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
                        >
                            Forgot password?
                        </Link>
                    </motion.div>

                    {/* Submit Button */}
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                Signing In...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </motion.button>
                </form>

                {/* Sign Up Link */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-6 text-center"
                >
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link
                            to="/signup"
                            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                        >
                            Sign up here
                        </Link>
                    </p>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default SignInForm;