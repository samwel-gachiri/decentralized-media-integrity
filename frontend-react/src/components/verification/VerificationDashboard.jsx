import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Toast } from '../ui/Toast';
import VerificationTask from './VerificationTask';
import VerificationStats from './VerificationStats';
import { useAuth } from '../../hooks/useAuth';

const VerificationDashboard = () => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);
    const [activeTab, setActiveTab] = useState('assignments');

    useEffect(() => {
        if (user) {
            loadVerificationData();
        }
    }, [user]);

    const loadVerificationData = async () => {
        try {
            setLoading(true);

            // Load verification assignments
            const assignmentsResponse = await fetch(`/api/community-verification/assignments/${user.id}`);
            if (assignmentsResponse.ok) {
                const assignmentsData = await assignmentsResponse.json();
                setAssignments(assignmentsData);
            }

            // Load verifier stats
            const statsResponse = await fetch(`/api/community-verification/verifier-stats/${user.id}`);
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setStats(statsData);
            }

        } catch (error) {
            console.error('Error loading verification data:', error);
            setToast({
                type: 'error',
                message: 'Failed to load verification data'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitVerification = async (eventId, verificationData) => {
        try {
            setSubmitting(true);

            const response = await fetch('/api/community-verification/submit-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    event_id: eventId,
                    verifier_id: user.id,
                    ...verificationData
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to submit verification');
            }

            const result = await response.json();

            // Remove the assignment from the list
            setAssignments(prev => prev.filter(a => a.event_id !== eventId));

            // Reload stats
            await loadVerificationData();

            setToast({
                type: 'success',
                message: result.consensus_reached
                    ? 'Verification submitted! Consensus reached.'
                    : 'Verification submitted successfully!'
            });

        } catch (error) {
            console.error('Error submitting verification:', error);
            throw error;
        } finally {
            setSubmitting(false);
        }
    };

    const handleSkipVerification = async (eventId) => {
        // Remove from assignments (in a real app, you might want to track skipped verifications)
        setAssignments(prev => prev.filter(a => a.event_id !== eventId));
        setToast({
            type: 'info',
            message: 'Verification task skipped'
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            active: 'bg-green-100 text-green-800',
            probation: 'bg-yellow-100 text-yellow-800',
            suspended: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Community Verification</h1>
                <p className="mt-2 text-gray-600">
                    Help verify news reports submitted by the community
                </p>
            </div>

            {/* Stats Overview */}
            {stats && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
                >
                    <Card className="p-6">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-600">Trust Score</p>
                                <p className="text-2xl font-bold text-gray-900">{Math.round(stats.trust_score)}</p>
                            </div>
                            <div className="ml-4">
                                <Badge className={getStatusColor(stats.status)}>
                                    {stats.status.toUpperCase()}
                                </Badge>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-600">Verifications</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total_verifications}</p>
                            </div>
                            <div className="ml-4 text-blue-600">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-600">Accuracy</p>
                                <p className="text-2xl font-bold text-gray-900">{Math.round(stats.accuracy * 100)}%</p>
                            </div>
                            <div className="ml-4 text-green-600">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-600">Weight</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.verifier_weight.toFixed(1)}x</p>
                            </div>
                            <div className="ml-4 text-purple-600">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            )}

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('assignments')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'assignments'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Pending Assignments ({assignments.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'history'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Verification History
                    </button>
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'stats'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Detailed Stats
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'assignments' && (
                <div>
                    {assignments.length === 0 ? (
                        <Card className="p-8 text-center">
                            <div className="text-gray-500">
                                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Verifications</h3>
                                <p className="text-gray-500">
                                    You don't have any verification assignments at the moment. Check back later for new events to verify.
                                </p>
                            </div>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {assignments.map((assignment, index) => (
                                <VerificationTask
                                    key={assignment.event_id}
                                    assignment={assignment}
                                    onSubmitVerification={handleSubmitVerification}
                                    onSkip={handleSkipVerification}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'history' && (
                <div>
                    {stats && stats.recent_activity && stats.recent_activity.length > 0 ? (
                        <div className="space-y-4">
                            {stats.recent_activity.map((activity, index) => (
                                <Card key={index} className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-medium text-gray-900">
                                                Event Verification
                                            </h4>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {activity.reasoning || 'No reasoning provided'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <Badge className={activity.was_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                                {activity.was_correct ? 'Correct' : 'Incorrect'}
                                            </Badge>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {new Date(activity.timestamp).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="p-8 text-center">
                            <div className="text-gray-500">
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Verification History</h3>
                                <p className="text-gray-500">
                                    Your verification history will appear here once you start verifying events.
                                </p>
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {activeTab === 'stats' && stats && (
                <VerificationStats stats={stats} />
            )}

            {toast && (
                <Toast
                    type={toast.type}
                    message={toast.message}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default VerificationDashboard;