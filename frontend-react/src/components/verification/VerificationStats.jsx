import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

const VerificationStats = ({ stats }) => {
    const getProgressColor = (percentage) => {
        if (percentage >= 80) return 'bg-green-500';
        if (percentage >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getStatusInfo = (status) => {
        const statusInfo = {
            active: {
                color: 'bg-green-100 text-green-800',
                description: 'You are an active verifier in good standing with full verification privileges.',
                requirements: 'Maintain accuracy above 70% to keep this status.'
            },
            probation: {
                color: 'bg-yellow-100 text-yellow-800',
                description: 'Your verification accuracy needs improvement. Your verification weight is reduced.',
                requirements: 'Improve accuracy to 70% or higher to regain active status.'
            },
            suspended: {
                color: 'bg-red-100 text-red-800',
                description: 'Your verification privileges are suspended due to low accuracy.',
                requirements: 'Contact support to discuss reinstatement options.'
            }
        };
        return statusInfo[status] || statusInfo.active;
    };

    const statusInfo = getStatusInfo(stats.status);
    const accuracyPercentage = Math.round(stats.accuracy * 100);
    const trustScorePercentage = Math.round((stats.trust_score / 100) * 100);

    return (
        <div className="space-y-6">
            {/* Status Overview */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Verifier Status</h3>
                <div className="flex items-start space-x-4">
                    <Badge className={statusInfo.color}>
                        {stats.status.toUpperCase()}
                    </Badge>
                    <div className="flex-1">
                        <p className="text-gray-700 mb-2">{statusInfo.description}</p>
                        <p className="text-sm text-gray-600">{statusInfo.requirements}</p>
                    </div>
                </div>
            </Card>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Trust Score</h4>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-2xl font-bold text-gray-900">{Math.round(stats.trust_score)}</span>
                            <span className="text-sm text-gray-500">/ 100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <motion.div
                                className={`h-3 rounded-full ${getProgressColor(trustScorePercentage)}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${trustScorePercentage}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        </div>
                        <div className="text-sm text-gray-600">
                            Your trust score affects your verification weight and eligibility for assignments.
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Verification Accuracy</h4>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-2xl font-bold text-gray-900">{accuracyPercentage}%</span>
                            <span className="text-sm text-gray-500">
                                {stats.correct_verifications} / {stats.total_verifications}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <motion.div
                                className={`h-3 rounded-full ${getProgressColor(accuracyPercentage)}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${accuracyPercentage}%` }}
                                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                            />
                        </div>
                        <div className="text-sm text-gray-600">
                            Percentage of your verifications that matched the community consensus.
                        </div>
                    </div>
                </Card>
            </div>

            {/* Verification Weight */}
            <Card className="p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Verification Weight</h4>
                <div className="flex items-center space-x-6">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600">{stats.verifier_weight.toFixed(1)}x</div>
                        <div className="text-sm text-gray-600">Current Weight</div>
                    </div>
                    <div className="flex-1">
                        <div className="text-sm text-gray-700 mb-2">
                            Your verification weight determines how much influence your votes have in the consensus process.
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                            <div>• Weight 2.0x: Trust score ≥ 90 (Expert level)</div>
                            <div>• Weight 1.5x: Trust score ≥ 80 (Advanced level)</div>
                            <div>• Weight 1.2x: Trust score ≥ 70 (Intermediate level)</div>
                            <div>• Weight 1.0x: Trust score ≥ 60 (Basic level)</div>
                            <div>• Weight 0.5x: Trust score &lt; 60 (Probationary)</div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Activity Summary */}
            <Card className="p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Activity Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.total_verifications}</div>
                        <div className="text-sm text-gray-600">Total Verifications</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.correct_verifications}</div>
                        <div className="text-sm text-gray-600">Correct Verifications</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                            {stats.total_verifications - stats.correct_verifications}
                        </div>
                        <div className="text-sm text-gray-600">Incorrect Verifications</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                            {Math.round(stats.trust_score)}
                        </div>
                        <div className="text-sm text-gray-600">Trust Score</div>
                    </div>
                </div>
            </Card>

            {/* Improvement Tips */}
            {stats.accuracy < 0.8 && (
                <Card className="p-6 bg-yellow-50 border-yellow-200">
                    <h4 className="text-lg font-medium text-yellow-800 mb-3">
                        💡 Tips to Improve Your Verification Accuracy
                    </h4>
                    <div className="space-y-2 text-sm text-yellow-700">
                        <div>• Carefully examine photo evidence for authenticity and relevance</div>
                        <div>• Check if the reported location makes sense for the event type</div>
                        <div>• Consider seasonal patterns and historical data for the region</div>
                        <div>• Verify timestamp plausibility with weather conditions</div>
                        <div>• Look for consistency in the reporter's description and evidence</div>
                        <div>• When in doubt, be conservative in your verification decisions</div>
                    </div>
                </Card>
            )}

            {/* Achievements */}
            {stats.total_verifications > 0 && (
                <Card className="p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Achievements</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {stats.total_verifications >= 10 && (
                            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                                <div className="text-2xl">🏆</div>
                                <div>
                                    <div className="font-medium text-blue-900">Dedicated Verifier</div>
                                    <div className="text-sm text-blue-700">Completed 10+ verifications</div>
                                </div>
                            </div>
                        )}

                        {stats.accuracy >= 0.9 && stats.total_verifications >= 5 && (
                            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                                <div className="text-2xl">🎯</div>
                                <div>
                                    <div className="font-medium text-green-900">Accuracy Expert</div>
                                    <div className="text-sm text-green-700">90%+ accuracy rate</div>
                                </div>
                            </div>
                        )}

                        {stats.trust_score >= 90 && (
                            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                                <div className="text-2xl">⭐</div>
                                <div>
                                    <div className="font-medium text-purple-900">Trusted Verifier</div>
                                    <div className="text-sm text-purple-700">Trust score 90+</div>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default VerificationStats;