import { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/authService';

// Auth state reducer
const authReducer = (state, action) => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_USER':
            return {
                ...state,
                user: action.payload,
                isAuthenticated: !!action.payload,
                isLoading: false,
                error: null,
                fallbackMode: action.fallbackMode || false,
                isGuest: action.isGuest || false
            };
        case 'SET_ERROR':
            return {
                ...state,
                error: action.payload,
                isLoading: false
            };
        case 'CLEAR_ERROR':
            return { ...state, error: null };
        case 'SET_FALLBACK_MODE':
            return { ...state, fallbackMode: action.payload };
        case 'LOGOUT':
            return {
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
                fallbackMode: false,
                isGuest: false
            };
        default:
            return state;
    }
};

// Initial state
const initialState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    fallbackMode: false,
    isGuest: false
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Initialize auth state on app load
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                dispatch({ type: 'SET_LOADING', payload: true });

                // First check for fallback authentication
                if (authService.isFallbackAuthValid()) {
                    const fallbackAuth = authService.getFallbackAuth();
                    if (fallbackAuth) {
                        dispatch({ 
                            type: 'SET_USER', 
                            payload: fallbackAuth.user,
                            fallbackMode: true,
                            isGuest: fallbackAuth.isGuest || false
                        });
                        dispatch({ type: 'SET_FALLBACK_MODE', payload: true });
                        return;
                    }
                }

                const token = authService.getToken();
                console.log('Initializing auth with token:', token); // Debug log

                if (token) {
                    // Verify token and get user data
                    const user = await authService.getCurrentUser();
                    dispatch({ type: 'SET_USER', payload: user });
                } else {
                    console.log('No token found, user not authenticated');
                    dispatch({ type: 'SET_LOADING', payload: false });
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                console.error('Error response:', error.response?.data);
                
                // If token validation fails, try fallback auth
                if (authService.isFallbackAuthValid()) {
                    const fallbackAuth = authService.getFallbackAuth();
                    if (fallbackAuth) {
                        dispatch({ 
                            type: 'SET_USER', 
                            payload: fallbackAuth.user,
                            fallbackMode: true,
                            isGuest: fallbackAuth.isGuest || false
                        });
                        dispatch({ type: 'SET_FALLBACK_MODE', payload: true });
                        return;
                    }
                }
                
                authService.removeToken();
                dispatch({ type: 'SET_LOADING', payload: false }); // Don't show error on initialization
            }
        };

        initializeAuth();
    }, []);

    // Sign in function
    const signIn = async (credentials) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            dispatch({ type: 'CLEAR_ERROR' });

            const result = await authService.signIn(credentials);
            const { user, fallbackMode, apiError, isGuest, message } = result;

            dispatch({ 
                type: 'SET_USER', 
                payload: user,
                fallbackMode: fallbackMode || false,
                isGuest: isGuest || false
            });
            dispatch({ type: 'SET_FALLBACK_MODE', payload: fallbackMode || false });

            return { success: true, user, fallbackMode, isGuest, message, apiError };
        } catch (error) {
            const errorMessage = error.response?.data?.detail || error.message || 'Sign in failed';
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            return { success: false, error: errorMessage };
        }
    };    // Sign up function
    const signUp = async (userData) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            dispatch({ type: 'CLEAR_ERROR' });

            const response = await authService.signUp(userData);
            const { user, token } = response;

            authService.setToken(token);
            dispatch({ type: 'SET_USER', payload: user });

            return { success: true, user };
        } catch (error) {
            const errorMessage = error.response?.data?.detail || error.message || 'Sign up failed';
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            return { success: false, error: errorMessage };
        }
    };

    // Sign out function
    const signOut = async () => {
        try {
            await authService.signOut();
        } catch (error) {
            console.error('Sign out error:', error);
        } finally {
            authService.removeToken();
            dispatch({ type: 'LOGOUT' });
        }
    };

    // Update user function
    const updateUser = (userData) => {
        dispatch({ type: 'SET_USER', payload: { ...state.user, ...userData } });
    };

    // Clear error function
    const clearError = () => {
        dispatch({ type: 'CLEAR_ERROR' });
    };

    const value = {
        ...state,
        signIn,
        signUp,
        signOut,
        updateUser,
        clearError
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;