import { useState, useEffect, useCallback } from 'react';

// Fallback data for when API calls fail
const FALLBACK_DATA = {
  alerts: [
    {
      id: 'fallback-1',
      title: 'Sample Integrity Alert',
      description: 'This is a sample alert shown when the API is unavailable.',
      severity: 'medium',
      timestamp: new Date().toISOString(),
      location: 'Global',
      type: 'misinformation'
    },
    {
      id: 'fallback-2',
      title: 'System Maintenance Notice',
      description: 'The news integrity system is currently undergoing maintenance.',
      severity: 'low',
      timestamp: new Date().toISOString(),
      location: 'System',
      type: 'maintenance'
    }
  ],

  verificationTasks: [
    {
      id: 'fallback-task-1',
      title: 'Sample Verification Task',
      description: 'Verify the authenticity of this news sample.',
      status: 'pending',
      priority: 'medium',
      deadline: new Date(Date.now() + 86400000).toISOString(),
      content: 'Sample news content for verification...'
    }
  ],

  mettaStats: {
    total_atoms: 0,
    active_queries: 0,
    query_performance: {
      avg_execution_time: '0s',
      ai_generation_success_rate: 0.0
    }
  },

  newsReports: [
    {
      id: 'fallback-news-1',
      title: 'Sample News Report',
      content: 'This is a sample news report shown when the API is unavailable.',
      source: 'Sample Source',
      category: 'technology',
      integrity_level: 'pending',
      timestamp: new Date().toISOString(),
      verification_score: 0.5
    }
  ],

  mettaAtoms: [
    {
      id: 'fallback-atom-1',
      type: 'user',
      content: '(user fallback-user)',
      verified: false
    },
    {
      id: 'fallback-atom-2',
      type: 'news',
      content: '(news fallback-news)',
      verified: false
    }
  ],

  mettaExamples: [
    'Show me all verified news sources',
    'Find articles about technology',
    'Analyze misinformation patterns',
    'List high-trust users'
  ],

  mettaQueryResult: {
    success: false,
    summary: 'Using cached MeTTa execution result - unable to connect to server',
    generated_function: '(= (sample-query) (match &content (news $source $title) ($source $title)))',
    execution_result: [],
    execution_time: '0s'
  },
};

// Cache key for localStorage
const CACHE_KEY = 'news_integrity_fallback_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export const useFallbackData = (dataType, options = {}) => {
  const [data, setData] = useState(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [error, setError] = useState(null);

  const {
    enableCache = true,
    cacheExpiry = CACHE_EXPIRY,
    transformData = (data) => data
  } = options;

  const loadFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(`${CACHE_KEY}_${dataType}`);
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        const isExpired = Date.now() - timestamp > cacheExpiry;

        if (!isExpired && cachedData) {
          setData(transformData(cachedData));
          setIsUsingFallback(true);
          return true;
        }
      }
    } catch (err) {
      console.warn('Failed to load cached data:', err);
    }
    return false;
  }, [dataType, cacheExpiry, transformData]);

  // Load cached data on mount
  useEffect(() => {
    if (enableCache) {
      loadFromCache();
    }
  }, [enableCache, loadFromCache]);

  const saveToCache = (data) => {
    if (!enableCache) return;

    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(`${CACHE_KEY}_${dataType}`, JSON.stringify(cacheData));
    } catch (err) {
      console.warn('Failed to save to cache:', err);
    }
  };

  const loadFallback = () => {
    const fallbackData = FALLBACK_DATA[dataType];
    if (fallbackData) {
      const transformed = transformData(fallbackData);
      setData(transformed);
      setIsUsingFallback(true);
      setError('Using offline data - API unavailable');

      // Cache the fallback data
      saveToCache(fallbackData);

      return transformed;
    }
    return null;
  };

  const updateData = (newData, isFromAPI = true) => {
    if (newData) {
      const transformed = transformData(newData);
      setData(transformed);

      if (isFromAPI) {
        setIsUsingFallback(false);
        setError(null);
        // Cache successful API responses
        saveToCache(newData);
      }
    }
  };

  const handleApiError = (apiError) => {
    console.warn(`API error for ${dataType}:`, apiError);
    setError(apiError.message || 'API request failed');

    // Try to load from cache first
    if (!loadFromCache()) {
      // If no cache, load fallback
      loadFallback();
    }
  };

  const clearCache = () => {
    try {
      localStorage.removeItem(`${CACHE_KEY}_${dataType}`);
    } catch (err) {
      console.warn('Failed to clear cache:', err);
    }
  };

  return {
    data,
    isUsingFallback,
    error,
    updateData,
    handleApiError,
    loadFallback,
    clearCache
  };
};

// Utility function to create API call with fallback
export const withFallback = async (apiCall, dataType, options = {}) => {
  const {
    maxRetries = 2,
    retryDelay = 1000
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await apiCall();
      return { success: true, data: result.data || result };
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }

  // All retries failed, return fallback info
  return {
    success: false,
    error: lastError,
    fallback: FALLBACK_DATA[dataType],
    shouldUseFallback: true
  };
};

// Hook for managing offline/online status
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// General fallback hook that provides the interface components expect
export const useFallback = () => {
  const isOnline = useOnlineStatus();

  const getFallbackData = (dataType) => {
    return FALLBACK_DATA[dataType] || null;
  };

  return {
    getFallbackData,
    isOnline
  };
};