import { useState } from 'react';
import { Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, MapPin, Loader2, UserCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { signUpValidationRules, validateFormData } from '../../utils/validation';

const SignUpForm = ({ onSuccess, onError }) => {
  const { signUp, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'user',
    locationRegion: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [backendValidationErrors, setBackendValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false); // Add local loading state

  // Location regions
  const locationRegions = [
    'Turkana, Kenya',
    'Kajiado, Kenya',
    'Marsabit, Kenya',
    'Samburu, Kenya',
    'Nairobi, Kenya',
    'Mombasa, Kenya',
    'Other'
  ];

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation errors when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    if (backendValidationErrors[name]) {
      setBackendValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form using centralized validation
  const validateForm = () => {
    const { isValid, errors } = validateFormData(formData, signUpValidationRules);
    setValidationErrors(errors);
    return isValid;
  };

  // Handle form submission - FIXED VERSION
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting || isLoading) {
      return;
    }

    setIsSubmitting(true);
    setBackendValidationErrors({}); // Clear previous backend errors

    // Validate form first
    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    // Prepare data for backend (convert to snake_case)
    const submitData = {
      email: formData.email.trim(),
      password: formData.password,
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      role: formData.role,
      location_region: formData.locationRegion
    };

    console.log('Submitting form data:', submitData);

    try {
      const result = await signUp(submitData);

      if (result && result.success) {
        onSuccess?.(result.user);
      } else {
        // Handle the case where signUp doesn't throw but returns error info
        handleSignUpError(result.error);
      }
    } catch (err) {
      console.error('Sign up error caught:', err);
      handleSignUpError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

// Centralized error handling
const handleSignUpError = (err) => {
  console.error('Processing sign up error:', err);

  if (err?.response?.status === 422) {
    // Handle validation errors
    const errorData = err.response.data;
    console.log('422 Error data:', errorData);

    if (errorData?.detail && Array.isArray(errorData.detail)) {
      // FastAPI validation error format
      const fieldErrors = {};
      errorData.detail.forEach(error => {
        let field = error.loc?.[1] || error.loc?.[0];
        
        // Convert snake_case backend field names to camelCase
        const fieldMapping = {
          'first_name': 'firstName',
          'last_name': 'lastName',
          'location_region': 'locationRegion'
        };
        
        field = fieldMapping[field] || field;
        fieldErrors[field] = error.msg;
      });
      
      setBackendValidationErrors(fieldErrors);
      onError?.('Please fix the validation errors below.');
    } else if (errorData?.errors) {
      // Alternative error format
      setBackendValidationErrors(errorData.errors);
      onError?.('Please fix the validation errors below.');
    } else {
      onError?.('Validation failed. Please check your input.');
    }
  } else if (err?.response?.status === 500) {
    console.error('Server error:', err.response.data);
    onError?.('Server error occurred. Please try again later.');
  } else if (err?.code === 'ERR_NETWORK') {
    onError?.('Network error: Cannot connect to server. Please check your connection.');
  } else if (err?.message) {
    onError?.(err.message); // Fixed: Use onError?.(err.message)
  } else {
    onError?.('Sign up failed. Please try again.');
  }
};

  // Helper function to get error message for a field
  const getFieldError = (fieldName) => {
    return backendValidationErrors[fieldName] || validationErrors[fieldName];
  };

  // Helper to render error messages safely
  const renderErrorMessage = (error) => {
    if (typeof error === 'string') {
      return error;
    }
    if (Array.isArray(error)) {
      return error.map((err, index) => (
        <span key={index}>
          {typeof err === 'object' ? err.msg || err.message : err}
          {index < error.length - 1 && <br />}
        </span>
      ));
    }
    if (typeof error === 'object') {
      return error.msg || error.message || JSON.stringify(error);
    }
    return String(error);
  };

  const isFormDisabled = isSubmitting || isLoading;

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
            Join Climate Witness
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-600"
          >
            Create your account to start reporting climate events
          </motion.p>
        </div>

        {error && typeof error === 'string' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-red-600 text-sm">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${getFieldError('firstName')
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 hover:border-gray-400'
                    }`}
                  placeholder="First name"
                  disabled={isFormDisabled}
                />
              </div>
              {getFieldError('firstName') && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600"
                >
                  {renderErrorMessage(getFieldError('firstName'))}
                </motion.p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${getFieldError('lastName')
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 hover:border-gray-400'
                    }`}
                  placeholder="Last name"
                  disabled={isFormDisabled}
                />
              </div>
              {getFieldError('lastName') && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600"
                >
                  {renderErrorMessage(getFieldError('lastName'))}
                </motion.p>
              )}
            </motion.div>
          </div>

          {/* Email Field */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
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
                className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${getFieldError('email')
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 hover:border-gray-400'
                  }`}
                placeholder="Enter your email"
                disabled={isFormDisabled}
              />
            </div>
            {getFieldError('email') && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 text-sm text-red-600"
              >
                {renderErrorMessage(getFieldError('email'))}
              </motion.p>
            )}
          </motion.div>

          {/* Password Field */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
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
                className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${getFieldError('password')
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 hover:border-gray-400'
                  }`}
                placeholder="Create a password"
                disabled={isFormDisabled}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isFormDisabled}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors disabled:cursor-not-allowed"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {getFieldError('password') && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 text-sm text-red-600"
              >
                {renderErrorMessage(getFieldError('password'))}
              </motion.p>
            )}
          </motion.div>

          {/* Confirm Password Field */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${getFieldError('confirmPassword')
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 hover:border-gray-400'
                  }`}
                placeholder="Confirm your password"
                disabled={isFormDisabled}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isFormDisabled}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors disabled:cursor-not-allowed"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {getFieldError('confirmPassword') && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 text-sm text-red-600"
              >
                {renderErrorMessage(getFieldError('confirmPassword'))}
              </motion.p>
            )}
          </motion.div>

          {/* Role and Location Fields */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCheck className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors hover:border-gray-400"
                  disabled={isFormDisabled}
                >
                  <option value="user">User</option>
                  <option value="researcher">Researcher</option>
                </select>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <label htmlFor="locationRegion" className="block text-sm font-medium text-gray-700 mb-2">
                Location Region
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="locationRegion"
                  name="locationRegion"
                  value={formData.locationRegion}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${getFieldError('locationRegion')
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 hover:border-gray-400'
                    }`}
                  disabled={isFormDisabled}
                >
                  <option value="">Select a region</option>
                  {locationRegions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>
              {getFieldError('locationRegion') && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600"
                >
                  {renderErrorMessage(getFieldError('locationRegion'))}
                </motion.p>
              )}
            </motion.div>
          </div>

          {/* Submit Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            type="submit"
            disabled={isFormDisabled}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isFormDisabled ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </motion.button>
        </form>

        {/* Sign In Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/signin"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SignUpForm;