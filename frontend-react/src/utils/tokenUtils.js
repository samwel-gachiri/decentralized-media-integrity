// Token storage keys
export const TOKEN_KEYS = {
    ACCESS_TOKEN: 'climate_witness_token',
    REFRESH_TOKEN: 'climate_witness_refresh_token',
    USER_DATA: 'climate_witness_user'
};

// Token utilities
export const tokenUtils = {
    // Set access token
    setAccessToken(token) {
        if (token) {
            localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, token);
        } else {
            localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
        }
    },

    // Get access token
    getAccessToken() {
        return localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
    },

    // Set refresh token
    setRefreshToken(token) {
        if (token) {
            localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, token);
        } else {
            localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
        }
    },

    // Get refresh token
    getRefreshToken() {
        return localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
    },

    // Set user data
    setUserData(userData) {
        if (userData) {
            localStorage.setItem(TOKEN_KEYS.USER_DATA, JSON.stringify(userData));
        } else {
            localStorage.removeItem(TOKEN_KEYS.USER_DATA);
        }
    },

    // Get user data
    getUserData() {
        const userData = localStorage.getItem(TOKEN_KEYS.USER_DATA);
        return userData ? JSON.parse(userData) : null;
    },

    // Clear all tokens and user data
    clearAll() {
        localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(TOKEN_KEYS.USER_DATA);
    },

    // Check if token exists
    hasAccessToken() {
        return !!this.getAccessToken();
    },

    // Check if refresh token exists
    hasRefreshToken() {
        return !!this.getRefreshToken();
    },

    // Decode JWT token (basic decode without verification)
    decodeToken(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    },

    // Check if token is expired
    isTokenExpired(token) {
        if (!token) return true;

        const decoded = this.decodeToken(token);
        if (!decoded || !decoded.exp) return true;

        const currentTime = Date.now() / 1000;
        return decoded.exp < currentTime;
    },

    // Get token expiration time
    getTokenExpiration(token) {
        const decoded = this.decodeToken(token);
        return decoded?.exp ? new Date(decoded.exp * 1000) : null;
    },

    // Check if token will expire soon (within 5 minutes)
    willTokenExpireSoon(token, minutesThreshold = 5) {
        if (!token) return true;

        const decoded = this.decodeToken(token);
        if (!decoded || !decoded.exp) return true;

        const currentTime = Date.now() / 1000;
        const thresholdTime = minutesThreshold * 60; // Convert to seconds

        return (decoded.exp - currentTime) < thresholdTime;
    }
};