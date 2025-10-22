import React, { useEffect, useState } from 'react';
import CommunityVerificationCard from '../components/community/CommunityVerificationCard';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../hooks/useAuth';
import { useFallbackData } from '../hooks/useFallback';

const CommunityVerificationDashboard = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [usingFallback, setUsingFallback] = useState(false);

    const { getFallbackData, isOnline } = useFallbackData();

    useEffect(() => {
        if (!user) return;

        const loadTasks = async () => {
            setLoading(true);
            setError(null);
            setUsingFallback(false);

            try {
                const response = await apiClient.getWithFallback(`/api/community-verification/tasks/${user.id}`);

                if (response.success) {
                    setTasks(response.data.tasks || []);
                } else if (response.shouldUseFallback) {
                    // Use fallback data
                    const fallbackTasks = getFallbackData('verificationTasks');
                    setTasks(fallbackTasks);
                    setUsingFallback(true);
                    setError('Using cached data - connection issues detected');
                } else {
                    setError(response.error);
                }
            } catch {
                // Fallback to cached data on any error
                const fallbackTasks = getFallbackData('verificationTasks');
                setTasks(fallbackTasks);
                setUsingFallback(true);
                setError('Using cached data - unable to connect to server');
            } finally {
                setLoading(false);
            }
        };

        loadTasks();
    }, [user, getFallbackData]);

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Community Verification</h1>
                {!isOnline && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                        Offline Mode
                    </span>
                )}
                {usingFallback && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        Using Cached Data
                    </span>
                )}
            </div>

            {loading && (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading verification tasks...</span>
                </div>
            )}

            {error && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-800">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {tasks.map((task, idx) => (
                    <CommunityVerificationCard key={idx} communityVerification={task} />
                ))}
                {tasks.length === 0 && !loading && (
                    <div className="text-center py-8 text-gray-500">
                        {usingFallback ? 'No cached verification tasks available.' : 'No verification tasks assigned.'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommunityVerificationDashboard;
