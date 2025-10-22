import axios from 'axios';

// Create axios instance
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
    timeout: 15000, // Increased timeout
    retry: 3,
    retryDelay: 1000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('news_integrity_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Enhanced response interceptor with retry logic and fallback support
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // If the error is 401 and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('news_integrity_refresh_token');
                if (refreshToken) {
                    // Try to refresh the token - fix the baseURL here
                    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/';
                    const response = await axios.post(
                        `${baseURL}/auth/refresh`,
                        { refresh_token: refreshToken }
                    );

                    const { access_token, refresh_token: newRefreshToken } = response.data;

                    // Update stored tokens
                    localStorage.setItem('news_integrity_token', access_token);
                    if (newRefreshToken) {
                        localStorage.setItem('news_integrity_refresh_token', newRefreshToken);
                    }

                    // Update the authorization header and retry the original request
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                // Refresh failed, remove tokens
                localStorage.removeItem('news_integrity_token');
                localStorage.removeItem('news_integrity_refresh_token');

                // Dispatch a custom event to notify the app about auth failure
                window.dispatchEvent(new CustomEvent('auth:logout'));

                return Promise.reject(refreshError);
            }
        }

        // Enhanced error handling with retry logic
        if (!originalRequest._retry && shouldRetry(error)) {
            originalRequest._retry = true;

            // Exponential backoff
            const delay = Math.min(1000 * Math.pow(2, originalRequest.retryCount || 0), 10000);

            return new Promise(resolve => {
                setTimeout(() => resolve(apiClient(originalRequest)), delay);
            });
        }

        // Enhanced error information
        const enhancedError = {
            ...error,
            isNetworkError: !error.response,
            isServerError: error.response?.status >= 500,
            isClientError: error.response?.status >= 400 && error.response?.status < 500,
            shouldUseFallback: shouldUseFallback(error),
            userMessage: getUserFriendlyMessage(error)
        };

        return Promise.reject(enhancedError);
    }
);

// Helper functions for error handling
function shouldRetry(error) {
    // Retry on network errors or 5xx server errors
    return !error.response ||
           error.response.status >= 500 ||
           error.code === 'ECONNABORTED' ||
           error.code === 'ENOTFOUND';
}

function shouldUseFallback(error) {
    // Use fallback for network errors, server errors, or specific client errors
    return !error.response ||
           error.response.status >= 500 ||
           error.response.status === 503 || // Service Unavailable
           error.response.status === 504;   // Gateway Timeout
}

function getUserFriendlyMessage(error) {
    if (!error.response) {
        return 'Unable to connect to the server. Please check your internet connection.';
    }

    switch (error.response.status) {
        case 400:
            return 'Invalid request. Please check your input.';
        case 401:
            return 'Authentication required. Please log in again.';
        case 403:
            return 'Access denied. You may not have permission for this action.';
        case 404:
            return 'The requested resource was not found.';
        case 429:
            return 'Too many requests. Please wait a moment and try again.';
        case 500:
            return 'Server error. Our team has been notified.';
        case 503:
            return 'Service temporarily unavailable. Please try again later.';
        default:
            return 'An unexpected error occurred. Please try again.';
    }
}

// Enhanced API methods with fallback support
apiClient.getWithFallback = async (url, config = {}) => {
    try {
        const response = await apiClient.get(url, config);
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.userMessage || error.message,
            shouldUseFallback: error.shouldUseFallback,
            status: error.response?.status
        };
    }
};

apiClient.postWithFallback = async (url, data, config = {}) => {
    try {
        const response = await apiClient.post(url, data, config);
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.userMessage || error.message,
            shouldUseFallback: error.shouldUseFallback,
            status: error.response?.status
        };
    }
};

export { apiClient };