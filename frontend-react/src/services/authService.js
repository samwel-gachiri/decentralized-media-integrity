import { apiClient } from './apiClient';

const TOKEN_KEY = 'news_integrity_token';
const REFRESH_TOKEN_KEY = 'news_integrity_refresh_token';
const FALLBACK_USERS_KEY = 'news_integrity_fallback_users';
const FALLBACK_AUTH_KEY = 'news_integrity_fallback_auth';

class AuthService {
    constructor() {
        this.isRefreshing = false;
        this.failedQueue = [];
        this.maxRefreshAttempts = 3;
        this.refreshAttempts = 0;
        this.fallbackMode = false;
    }

    // Basic token management methods
    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    setToken(token) {
        localStorage.setItem(TOKEN_KEY, token);
    }

    removeToken() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        this.refreshAttempts = 0;
    }

    getRefreshToken() {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    }

    setRefreshToken(refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    isAuthenticated() {
        const token = this.getToken();
        const refreshToken = this.getRefreshToken();
        return !!(token && refreshToken);
    }

    // Validate token format before processing
    isValidToken(token) {
        if (!token || typeof token !== 'string') {
            return false;
        }
        
        // Check if token has the expected JWT structure (3 parts separated by dots)
        const parts = token.split('.');
        if (parts.length !== 3) {
            return false;
        }
        
        // Basic validation for each part
        return parts.every(part => part.length > 0 && /^[A-Za-z0-9_-]+$/.test(part));
    }

    // Check if token is expired (proper JWT decode with URL-safe base64 handling)
    isTokenExpired(token) {
        if (!token) return true;
        
        // Validate token format first
        if (!this.isValidToken(token)) {
            console.error('Invalid token format');
            this.removeToken();
            return true;
        }
        
        try {
            // Split the token and get the payload part
            const parts = token.split('.');
            const base64Url = parts[1];
            
            // Replace URL-safe characters and add padding if needed
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
            
            // Decode and parse the payload
            const payload = JSON.parse(atob(paddedBase64));
            
            if (!payload.exp) {
                console.error('No expiration time in token payload');
                return true;
            }
            
            const currentTime = Math.floor(Date.now() / 1000);
            // Add 5 minute buffer before expiration
            return payload.exp < (currentTime + 300);
        } catch (error) {
            console.error('Error decoding token:', error);
            // Clear invalid token to prevent further issues
            this.removeToken();
            return true;
        }
    }

    // Fallback authentication methods
    isFallbackMode() {
        return this.fallbackMode;
    }

    setFallbackMode(enabled) {
        this.fallbackMode = enabled;
    }

    // Store user credentials for fallback authentication (hashed password)
    async storeFallbackCredentials(email, password, userData) {
        try {
            // Hash the password for local storage
            const hashedPassword = await this.hashPassword(password);
            
            const fallbackUsers = this.getFallbackUsers();
            fallbackUsers[email] = {
                hashedPassword,
                userData,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };
            
            localStorage.setItem(FALLBACK_USERS_KEY, JSON.stringify(fallbackUsers));
            return true;
        } catch (error) {
            console.error('Error storing fallback credentials:', error);
            return false;
        }
    }

    // Get stored fallback users
    getFallbackUsers() {
        try {
            const users = localStorage.getItem(FALLBACK_USERS_KEY);
            return users ? JSON.parse(users) : {};
        } catch (error) {
            console.error('Error getting fallback users:', error);
            return {};
        }
    }

    // Simple password hashing (in production, use a proper library like bcrypt)
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'news_integrity_salt');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Verify password against stored hash
    async verifyPassword(password, storedHash) {
        const hashedPassword = await this.hashPassword(password);
        return hashedPassword === storedHash;
    }

    // Fallback sign in (when API is unavailable)
    async fallbackSignIn(email, password) {
        try {
            const fallbackUsers = this.getFallbackUsers();
            const userRecord = fallbackUsers[email];

            if (userRecord) {
                // Verify password for existing cached users
                const isValidPassword = await this.verifyPassword(password, userRecord.hashedPassword);
                if (!isValidPassword) {
                    throw new Error('Incorrect password for offline login. Please check your password or connect to the internet to sign in normally.');
                }

                // Update last login
                userRecord.lastLogin = new Date().toISOString();
                localStorage.setItem(FALLBACK_USERS_KEY, JSON.stringify(fallbackUsers));

                // Create fallback auth session
                const fallbackAuth = {
                    user: userRecord.userData,
                    fallbackMode: true,
                    loginTime: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
                };

                localStorage.setItem(FALLBACK_AUTH_KEY, JSON.stringify(fallbackAuth));
                this.setFallbackMode(true);

                // Dispatch success event
                window.dispatchEvent(new CustomEvent('authStateChanged', {
                    detail: { authenticated: true, user: userRecord.userData, fallbackMode: true }
                }));

                return { user: userRecord.userData, token: 'fallback_token', fallbackMode: true };
            } else {
                // No cached credentials - allow guest/demo access
                console.log('No cached credentials found, allowing guest access for offline demo');

                // Create a guest user for demo purposes
                const guestUser = {
                    id: 'guest-user',
                    email: email,
                    first_name: 'Guest',
                    last_name: 'User',
                    role: 'user',
                    trust_score: 50,
                    is_guest: true,
                    created_at: new Date().toISOString()
                };

                // Create fallback auth session for guest
                const fallbackAuth = {
                    user: guestUser,
                    fallbackMode: true,
                    isGuest: true,
                    loginTime: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
                };

                localStorage.setItem(FALLBACK_AUTH_KEY, JSON.stringify(fallbackAuth));
                this.setFallbackMode(true);

                // Dispatch success event
                window.dispatchEvent(new CustomEvent('authStateChanged', {
                    detail: { authenticated: true, user: guestUser, fallbackMode: true, isGuest: true }
                }));

                return {
                    user: guestUser,
                    token: 'guest_token',
                    fallbackMode: true,
                    isGuest: true,
                    message: ''
                };
            }
        } catch (error) {
            console.error('Fallback sign in error:', error);
            throw error;
        }
    }

    // Check if fallback auth is valid
    isFallbackAuthValid() {
        try {
            const fallbackAuth = localStorage.getItem(FALLBACK_AUTH_KEY);
            if (!fallbackAuth) return false;

            const auth = JSON.parse(fallbackAuth);
            const now = new Date();
            const expiresAt = new Date(auth.expiresAt);

            return now < expiresAt;
        } catch (error) {
            console.error('Error checking fallback auth validity:', error);
            return false;
        }
    }

    // Get fallback auth data
    getFallbackAuth() {
        try {
            const fallbackAuth = localStorage.getItem(FALLBACK_AUTH_KEY);
            return fallbackAuth ? JSON.parse(fallbackAuth) : null;
        } catch (error) {
            console.error('Error getting fallback auth:', error);
            return null;
        }
    }

    // Clear fallback auth
    clearFallbackAuth() {
        localStorage.removeItem(FALLBACK_AUTH_KEY);
        this.setFallbackMode(false);
    }

    // Check if user has fallback credentials stored
    hasFallbackCredentials(email) {
        const fallbackUsers = this.getFallbackUsers();
        return !!fallbackUsers[email];
    }

    // Clear all auth state and notify listeners
    clearAuthState() {
        this.removeToken();
        this.clearFallbackAuth();
        this.isRefreshing = false;
        this.failedQueue = [];
        this.refreshAttempts = 0;
        
        // Dispatch custom event for auth state change
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
            detail: { authenticated: false, reason: 'tokenInvalid' } 
        }));
    }

    // Sign up with improved error handling
    async signUp(userData) {
        try {
            const requestData = {
                email: userData.email,
                password: userData.password,
                first_name: userData.first_name,
                last_name: userData.last_name,
                role: userData.role || 'user',
                location_region: userData.location_region || null
            };

            console.log('Sending registration data:', requestData);

            const response = await apiClient.post('/api/auth/register', requestData);
            const { access_token, refresh_token, user } = response.data;

            console.log('Login response:', { access_token, user }); // Debug log

            if (access_token) {
                this.setToken(access_token);
                if (refresh_token) {
                    this.setRefreshToken(refresh_token);
                }
                this.refreshAttempts = 0;
                
                // Dispatch success event
                window.dispatchEvent(new CustomEvent('authStateChanged', { 
                    detail: { authenticated: true, user } 
                }));
            }

            return { user, token: access_token };
        } catch (error) {
            console.error('Sign up error:', error);
            console.error('Error response:', error.response?.data);
            
            let errorMessage = 'Registration failed. Please try again.';
            
            if (error.response) {
                const { status, data } = error.response;
                
                switch (status) {
                    case 400:
                        errorMessage = data.detail || data.message || 'Invalid registration data';
                        break;
                    case 409:
                        errorMessage = data.detail || data.message || 'User already exists with this email';
                        break;
                    case 500:
                        if (data.detail && data.detail.includes('threads can only be started once')) {
                            errorMessage = 'Account may already exist. Please try logging in.';
                        } else {
                            errorMessage = data.detail || data.message || 'Server error during registration';
                        }
                        break;
                    default:
                        errorMessage = data.detail || data.message || `Registration failed (${status})`;
                }
            } else if (error.request) {
                errorMessage = 'Network error. Please check your connection.';
            }
            
            const enhancedError = new Error(errorMessage);
            enhancedError.originalError = error;
            enhancedError.status = error.response?.status;
            
            throw enhancedError;
        }
    }

    // Sign in method with fallback support
    async signIn(credentials) {
        try {
            const requestData = {
                email: credentials.email,
                password: credentials.password
            };

            const response = await apiClient.post('/api/auth/login', requestData);
            const { access_token, refresh_token, user } = response.data;

            if (access_token) {
                this.setToken(access_token);
                if (refresh_token) {
                    this.setRefreshToken(refresh_token);
                }
                this.refreshAttempts = 0;
                this.setFallbackMode(false);
                
                // Store credentials for fallback authentication
                await this.storeFallbackCredentials(credentials.email, credentials.password, user);
                
                // Dispatch success event
                window.dispatchEvent(new CustomEvent('authStateChanged', { 
                    detail: { authenticated: true, user, fallbackMode: false } 
                }));
            }

            return { user, token: access_token };
        } catch (error) {
            console.error('Sign in error:', error);
            
            // Check if this is a network/server error that should trigger fallback
            const shouldUseFallback = !error.response || 
                                    error.response.status >= 500 || 
                                    error.code === 'ECONNABORTED' ||
                                    error.code === 'ENOTFOUND';
            
            if (shouldUseFallback) {
                console.log('API unavailable, attempting fallback authentication...');
                try {
                    const fallbackResult = await this.fallbackSignIn(credentials.email, credentials.password);
                    return { ...fallbackResult, apiError: error.message };
                } catch (fallbackError) {
                    console.error('Fallback authentication also failed:', fallbackError);
                    // Provide a clearer error message for the user
                    const enhancedError = new Error(fallbackError.message);
                    enhancedError.isNetworkError = true;
                    enhancedError.canRetryWithNetwork = true;
                    throw enhancedError;
                }
            }
            
            let errorMessage = 'Login failed. Please try again.';
            
            if (error.response) {
                const { status, data } = error.response;
                
                switch (status) {
                    case 401:
                        errorMessage = 'Invalid email or password';
                        break;
                    case 404:
                        errorMessage = 'User not found';
                        break;
                    case 500:
                        errorMessage = data.detail || data.message || 'Server error during login';
                        break;
                    default:
                        errorMessage = data.detail || data.message || `Login failed (${status})`;
                }
            } else if (error.request) {
                errorMessage = 'Network error. Please check your connection.';
            }
            
            const enhancedError = new Error(errorMessage);
            enhancedError.originalError = error;
            enhancedError.status = error.response?.status;
            
            throw enhancedError;
        }
    }

    // Sign out method
    async signOut() {
        try {
            const token = this.getToken();
            if (token && !this.isFallbackMode()) {
                // Try to notify server, but don't wait for response
                apiClient.post('/auth/logout').catch(() => {
                    // Ignore logout errors
                });
            }
        } catch (error) {
            console.error('Sign out error:', error);
        } finally {
            this.clearAuthState();
        }
    }

    // Get current user with token validation
    async getCurrentUser() {
        try {
            const token = this.getToken();
            const refreshToken = this.getRefreshToken();
            
            if (!token || !refreshToken) {
                throw new Error('No tokens found');
            }

            // Check if token is expired
            if (this.isTokenExpired(token)) {
                console.log('Token expired, attempting refresh...');
                await this.refreshToken();
            }

            const response = await apiClient.get('/auth/me');
            return response.data.user;
        } catch (error) {
            console.error('Get current user error:', error);
            
            // If it's a 401 and we haven't exceeded refresh attempts
            if (error.response?.status === 401 && this.refreshAttempts < this.maxRefreshAttempts) {
                try {
                    await this.refreshToken();
                    // Retry the request
                    const response = await apiClient.get('/auth/me');
                    return response.data.user;
                } catch (refreshError) {
                    console.error('Failed to refresh and retry getCurrentUser:', refreshError);
                    this.clearAuthState();
                    throw new Error('Authentication expired. Please log in again.');
                }
            } else {
                // Clear auth state on any other error or max attempts reached
                this.clearAuthState();
                throw error;
            }
        }
    }

    // Improved refresh token method with loop prevention
    async refreshToken() {
        // Prevent multiple simultaneous refresh attempts
        if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
                this.failedQueue.push({ resolve, reject });
            });
        }

        // Check if we've exceeded max attempts
        if (this.refreshAttempts >= this.maxRefreshAttempts) {
            console.log('Max refresh attempts reached, clearing auth state');
            this.clearAuthState();
            throw new Error('Authentication expired. Please log in again.');
        }

        this.isRefreshing = true;
        this.refreshAttempts++;

        try {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
                throw new Error('No refresh token found');
            }

            console.log(`Token refresh attempt ${this.refreshAttempts}/${this.maxRefreshAttempts}`);

            const response = await apiClient.post('/auth/refresh', {
                refresh_token: refreshToken
            });

            const { access_token, refresh_token: newRefreshToken } = response.data;

            if (access_token) {
                this.setToken(access_token);
                if (newRefreshToken) {
                    this.setRefreshToken(newRefreshToken);
                }
                
                // Reset attempts on success
                this.refreshAttempts = 0;
                
                // Process failed queue
                this.processQueue(null, access_token);
                
                return access_token;
            } else {
                throw new Error('No access token in refresh response');
            }
        } catch (error) {
            console.error(`Token refresh error (attempt ${this.refreshAttempts}):`, error);
            
            // If refresh fails with 401 or we've hit max attempts, clear everything
            if (error.response?.status === 401 || this.refreshAttempts >= this.maxRefreshAttempts) {
                console.log('Refresh token invalid or max attempts reached, clearing auth state');
                this.processQueue(error, null);
                this.clearAuthState();
            } else {
                // For other errors, just process the queue with the error
                this.processQueue(error, null);
            }
            
            throw new Error('Authentication expired. Please log in again.');
        } finally {
            this.isRefreshing = false;
        }
    }

    // Process queued requests after refresh attempt
    processQueue(error, token) {
        this.failedQueue.forEach(({ resolve, reject }) => {
            if (error) {
                reject(error);
            } else {
                resolve(token);
            }
        });
        
        this.failedQueue = [];
    }

    // Force logout and clear state
    forceLogout(reason = 'unknown') {
        console.log(`Force logout triggered: ${reason}`);
        this.clearAuthState();
    }

    // Check if we should attempt refresh (used by interceptors)
    shouldAttemptRefresh() {
        return this.refreshAttempts < this.maxRefreshAttempts && 
               this.getRefreshToken() && 
               !this.isRefreshing;
    }
}

export const authService = new AuthService();