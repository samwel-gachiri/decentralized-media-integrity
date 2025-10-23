import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Award, TrendingUp, Shield, Star, Target } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const TrustScoreDisplay = ({
    score = 0,
    history = [],
    showHistory = true,
    className = ''
}) => {
    const getTrustLevel = (trustScore) => {
        if (trustScore >= 90) return { level: 'Excellent', color: 'emerald', icon: Star };
        if (trustScore >= 80) return { level: 'High', color: 'blue', icon: Shield };
        if (trustScore >= 60) return { level: 'Good', color: 'green', icon: Award };
        if (trustScore >= 40) return { level: 'Fair', color: 'amber', icon: Target };
        return { level: 'Low', color: 'red', icon: TrendingUp };
    };

    const getScoreColor = (trustScore) => {
        if (trustScore >= 90) return 'from-emerald-500 to-emerald-600';
        if (trustScore >= 80) return 'from-blue-500 to-blue-600';
        if (trustScore >= 60) return 'from-green-500 to-green-600';
        if (trustScore >= 40) return 'from-amber-500 to-amber-600';
        return 'from-red-500 to-red-600';
    };

    const getNextMilestone = (currentScore) => {
        if (currentScore < 40) return { target: 40, label: 'Fair' };
        if (currentScore < 60) return { target: 60, label: 'Good' };
        if (currentScore < 80) return { target: 80, label: 'High' };
        if (currentScore < 90) return { target: 90, label: 'Excellent' };
        return { target: 100, label: 'Perfect' };
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    const trustInfo = getTrustLevel(score);
    const nextMilestone = getNextMilestone(score);
    const IconComponent = trustInfo.icon;

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Main Trust Score Display */}
            <Card className="p-6">
                <div className="text-center">
                    <div className="relative inline-block mb-4">
                        {/* Circular Progress */}
                        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                            {/* Background circle */}
                            <circle
                                cx="60"
                                cy="60"
                                r="50"
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth="8"
                            />
                            {/* Progress circle */}
                            <motion.circle
                                cx="60"
                                cy="60"
                                r="50"
                                fill="none"
                                stroke="url(#trustGradient)"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 50}`}
                                initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                                animate={{
                                    strokeDashoffset: 2 * Math.PI * 50 * (1 - score / 100)
                                }}
                                transition={{ duration: 2, ease: "easeOut" }}
                            />

                            {/* Gradient definition */}
                            <defs>
                                <linearGradient id="trustGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" className={`text-${trustInfo.color}-500`} stopColor="currentColor" />
                                    <stop offset="100%" className={`text-${trustInfo.color}-600`} stopColor="currentColor" />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* Score in center */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 1, duration: 0.5 }}
                                    className="text-3xl font-bold text-gray-900"
                                >
                                    {score}
                                </motion.div>
                                <div className="text-sm text-gray-600">/ 100</div>
                            </div>
                        </div>
                    </div>

                    {/* Trust Level Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5 }}
                        className="mb-4"
                    >
                        <Badge
                            variant="secondary"
                            className={`bg-${trustInfo.color}-100 text-${trustInfo.color}-800 px-4 py-2 text-lg font-semibold`}
                        >
                            <IconComponent className="w-5 h-5 mr-2" />
                            {trustInfo.level} Trust Level
                        </Badge>
                    </motion.div>

                    {/* Description */}
                    <p className="text-gray-600 max-w-md mx-auto">
                        Your trust score reflects the reliability and accuracy of your news report submissions.
                    </p>
                </div>

                {/* Progress to Next Level */}
                {score < 100 && (
                    <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                                Progress to {nextMilestone.label}
                            </span>
                            <span className="text-sm text-gray-600">
                                {nextMilestone.target - score} points to go
                            </span>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <motion.div
                                className={`bg-gradient-to-r ${getScoreColor(score)} h-2 rounded-full`}
                                initial={{ width: 0 }}
                                animate={{
                                    width: `${((score - (nextMilestone.target - 20)) / 20) * 100}%`
                                }}
                                transition={{ duration: 1.5, delay: 0.5 }}
                            />
                        </div>
                    </div>
                )}
            </Card>

            {/* Trust Score Factors */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <Target className="w-5 h-5 text-gray-600" />
                    <span>How Trust Score is Calculated</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <span className="text-sm font-medium text-green-800">Event Verification</span>
                            <span className="text-sm text-green-600">+5-10 points</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <span className="text-sm font-medium text-blue-800">Photo Quality</span>
                            <span className="text-sm text-blue-600">+2-5 points</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                            <span className="text-sm font-medium text-purple-800">Location Accuracy</span>
                            <span className="text-sm text-purple-600">+1-3 points</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                            <span className="text-sm font-medium text-red-800">False Reports</span>
                            <span className="text-sm text-red-600">-10-20 points</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                            <span className="text-sm font-medium text-orange-800">Rejected Events</span>
                            <span className="text-sm text-orange-600">-2-5 points</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                            <span className="text-sm font-medium text-amber-800">Consistency</span>
                            <span className="text-sm text-amber-600">+1-2 points</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Trust Score History */}
            {showHistory && history.length > 0 && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-gray-600" />
                        <span>Recent Changes</span>
                    </h3>

                    <div className="space-y-3">
                        {history.slice(0, 5).map((change, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-2 h-2 rounded-full ${change.delta > 0 ? 'bg-green-500' : 'bg-red-500'
                                        }`} />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {change.reason}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            {formatDate(change.timestamp)}
                                        </p>
                                    </div>
                                </div>

                                <div className={`text-sm font-semibold ${change.delta > 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {change.delta > 0 ? '+' : ''}{change.delta}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default TrustScoreDisplay;