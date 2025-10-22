import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Toast } from '../ui/Toast';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';

const InsuranceWidget = () => {
    const { user } = useAuth();
    const [policies, setPolicies] = useState([]);
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [toast, setToast] = useState(null);
    const [coverageInfo, setCoverageInfo] = useState(null);

    useEffect(() => {
        if (user) {
            loadInsuranceData();
            loadCoverageInfo();
        }
    }, [user]);

    const loadInsuranceData = async () => {
        try {
            setLoading(true);

            // Load user policies
            const policiesResponse = await fetch(`/api/insurance/user/${user.id}/policies`);
            if (policiesResponse.ok) {
                const policiesData = await policiesResponse.json();
                setPolicies(policiesData.policies || []);
            }

            // Load user payouts
            const payoutsResponse = await fetch(`/api/insurance/user/${user.id}/payouts`);
            if (payoutsResponse.ok) {
                const payoutsData = await payoutsResponse.json();
                setPayouts(payoutsData.payouts || []);
            }

        } catch (error) {
            console.error('Error loading insurance data:', error);
            setToast({
                type: 'error',
                message: 'Failed to load insurance data'
            });
        } finally {
            setLoading(false);
        }
    };

    const loadCoverageInfo = async () => {
        try {
            const response = await fetch('/api/insurance/coverage-info');
            if (response.ok) {
                const data = await response.json();
                setCoverageInfo(data.coverage_options.simple_climate_insurance);
            }
        } catch (error) {
            console.error('Error loading coverage info:', error);
        }
    };

    const handleCreatePolicy = async () => {
        try {
            setCreating(true);

            const response = await fetch('/api/insurance/create-policy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user.id
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to create policy');
            }

            const result = await response.json();

            setToast({
                type: 'success',
                message: result.message || 'Insurance policy created successfully!'
            });

            // Reload insurance data
            await loadInsuranceData();

        } catch (error) {
            console.error('Error creating policy:', error);
            setToast({
                type: 'error',
                message: error.message || 'Failed to create insurance policy'
            });
        } finally {
            setCreating(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            active: 'bg-green-100 text-green-800',
            claimed: 'bg-blue-100 text-blue-800',
            expired: 'bg-gray-100 text-gray-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getPayoutStatusColor = (status) => {
        const colors = {
            completed: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            failed: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const hasActivePolicy = policies.some(p => p.status === 'active');
    const totalPayouts = payouts.reduce((sum, p) => sum + (p.status === 'completed' ? p.amount : 0), 0);

    if (loading) {
        return (
            <Card className="p-6">
                <div className="flex justify-center items-center h-32">
                    <LoadingSpinner size="md" />
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Insurance Overview */}
            <Card className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Integrity Insurance</h3>
                        <p className="text-sm text-gray-600">
                            Protect yourself from misinformation impacts
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(totalPayouts)}
                        </div>
                        <div className="text-sm text-gray-500">Total Received</div>
                    </div>
                </div>

                {/* Coverage Info */}
                {coverageInfo && (
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <h4 className="font-medium text-blue-900 mb-2">{coverageInfo.name}</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-blue-700">Premium:</span>
                                <span className="font-medium ml-2">{formatCurrency(coverageInfo.premium)}</span>
                            </div>
                            <div>
                                <span className="text-blue-700">Coverage:</span>
                                <span className="font-medium ml-2">{formatCurrency(coverageInfo.coverage_amount)}</span>
                            </div>
                            <div>
                                <span className="text-blue-700">Payout:</span>
                                <span className="font-medium ml-2">{coverageInfo.payout_percentage}% of coverage</span>
                            </div>
                            <div>
                                <span className="text-blue-700">Min. Trust Score:</span>
                                <span className="font-medium ml-2">60</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create Policy Button */}
                {!hasActivePolicy && (
                    <div className="mb-4">
                        {user.trust_score >= 60 ? (
                            <Button
                                onClick={handleCreatePolicy}
                                disabled={creating}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {creating ? 'Creating Policy...' : `Create Insurance Policy - ${formatCurrency(coverageInfo?.premium || 50)}`}
                            </Button>
                        ) : (
                            <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                <p className="text-yellow-800 font-medium">Trust Score Too Low</p>
                                <p className="text-sm text-yellow-700 mt-1">
                                    You need a trust score of at least 60 to purchase insurance.
                                    Current score: {user.trust_score}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Active Policy */}
                {hasActivePolicy && (
                    <div className="bg-green-50 p-4 rounded-lg mb-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-medium text-green-900">Active Insurance Policy</h4>
                                <p className="text-sm text-green-700">
                                    You're covered for verified misinformation incidents!
                                </p>
                            </div>
                            <Badge className="bg-green-100 text-green-800">
                                Active
                            </Badge>
                        </div>
                    </div>
                )}
            </Card>

            {/* Policies List */}
            {policies.length > 0 && (
                <Card className="p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Your Policies</h4>
                    <div className="space-y-3">
                        {policies.map((policy) => (
                            <motion.div
                                key={policy.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                            >
                                <div>
                                    <div className="font-medium text-gray-900">
                                        Integrity Insurance Policy
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Created: {formatDate(policy.created_at)}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Coverage: {formatCurrency(policy.coverage_amount)}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge className={getStatusColor(policy.status)}>
                                        {policy.status.toUpperCase()}
                                    </Badge>
                                    <div className="text-sm text-gray-600 mt-1">
                                        Premium: {formatCurrency(policy.premium_paid)}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Payouts List */}
            {payouts.length > 0 && (
                <Card className="p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Insurance Payouts</h4>
                    <div className="space-y-3">
                        {payouts.map((payout) => (
                            <motion.div
                                key={payout.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                            >
                                <div>
                                    <div className="font-medium text-gray-900">
                                        Insurance Payout
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Event ID: {payout.event_id.substring(0, 8)}...
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Date: {formatDate(payout.timestamp)}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-green-600">
                                        {formatCurrency(payout.amount)}
                                    </div>
                                    <Badge className={getPayoutStatusColor(payout.status)}>
                                        {payout.status.toUpperCase()}
                                    </Badge>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </Card>
            )}

            {/* How It Works */}
            <Card className="p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">How Integrity Insurance Works</h4>
                <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                        <div>
                            <strong>Purchase Policy:</strong> Pay a small premium to get coverage for climate events
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                        <div>
                            <strong>Report Incidents:</strong> Submit misinformation incidents you experience with evidence
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                        <div>
                            <strong>Community Verification:</strong> Other community members verify your event
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</div>
                        <div>
                            <strong>Automatic Payout:</strong> Receive compensation automatically when events are verified
                        </div>
                    </div>
                </div>
            </Card>

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

export default InsuranceWidget;