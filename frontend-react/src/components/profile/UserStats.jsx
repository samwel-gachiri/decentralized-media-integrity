import React from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3,
    TrendingUp,
    Calendar,
    MapPin,
    Award,
    Zap,
    Target,
    Clock
} from 'lucide-react';
import Card from '../ui/Card.jsx';

const UserStats = ({ user, stats, className = '' }) => {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getEventTypeIcon = (type) => {
        const icons = {
            drought: '🌵',
            flood: '🌊',
            locust: '🦗',
            extreme_heat: '🔥'
        };
        return icons[type] || '📊';
    };

    const getEventTypeLabel = (type) => {
        const labels = {
            drought: 'Drought',
            flood: 'Flood',
            locust: 'Locust Sighting',
            extreme_heat: 'Extreme Heat'
        };
        return labels[type] || type;
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.5
            }
        }
    };

    if (!stats) {
        return (
            <div className={`space-y-6 ${className}`}>
                <Card className="p-6">
                    <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <motion.div
            className={`space-y-6 ${className}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Overview Stats */}
            <motion.div variants={itemVariants}>
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-6 flex items-center space-x-2">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        <span>Performance Overview</span>
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                            <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full mx-auto mb-3">
                                <Calendar className="w-6 h-6 text-white" />
                            </div>
                            <p className="text-2xl font-bold text-blue-600">{stats.totalEvents || 0}</p>
                            <p className="text-sm text-gray-600">Total Events</p>
                        </div>

                        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                            <div className="flex items-center justify-center w-12 h-12 bg-green-600 rounded-full mx-auto mb-3">
                                <Award className="w-6 h-6 text-white" />
                            </div>
                            <p className="text-2xl font-bold text-green-600">{stats.verifiedEvents || 0}</p>
                            <p className="text-sm text-gray-600">Verified</p>
                        </div>

                        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                            <div className="flex items-center justify-center w-12 h-12 bg-purple-600 rounded-full mx-auto mb-3">
                                <Target className="w-6 h-6 text-white" />
                            </div>
                            <p className="text-2xl font-bold text-purple-600">
                                {stats.verificationRate ? `${(stats.verificationRate * 100).toFixed(1)}%` : '0%'}
                            </p>
                            <p className="text-sm text-gray-600">Success Rate</p>
                        </div>

                        <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl">
                            <div className="flex items-center justify-center w-12 h-12 bg-amber-600 rounded-full mx-auto mb-3">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <p className="text-2xl font-bold text-amber-600">
                                {stats.totalPayouts ? `${stats.totalPayouts.toFixed(3)}` : '0.000'}
                            </p>
                            <p className="text-sm text-gray-600">ETH Earned</p>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Event Types Breakdown */}
            {stats.eventTypes && Object.keys(stats.eventTypes).length > 0 && (
                <motion.div variants={itemVariants}>
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                            <TrendingUp className="w-5 h-5 text-gray-600" />
                            <span>Event Types Reported</span>
                        </h3>

                        <div className="space-y-3">
                            {Object.entries(stats.eventTypes).map(([type, count]) => {
                                const percentage = stats.totalEvents > 0 ? (count / stats.totalEvents) * 100 : 0;

                                return (
                                    <div key={type} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">{getEventTypeIcon(type)}</span>
                                            <div>
                                                <p className="font-medium">{getEventTypeLabel(type)}</p>
                                                <p className="text-sm text-gray-500">{count} events</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            <div className="w-24 bg-gray-200 rounded-full h-2">
                                                <motion.div
                                                    className="bg-blue-600 h-2 rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentage}%` }}
                                                    transition={{ duration: 1, delay: 0.2 }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium text-gray-600 w-12 text-right">
                                                {percentage.toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </motion.div>
            )}

            {/* Recent Activity Timeline */}
            {stats.recentActivity && stats.recentActivity.length > 0 && (
                <motion.div variants={itemVariants}>
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                            <Clock className="w-5 h-5 text-gray-600" />
                            <span>Recent Activity</span>
                        </h3>

                        <div className="space-y-4">
                            {stats.recentActivity.slice(0, 5).map((activity, index) => (
                                <div key={index} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-sm">{getEventTypeIcon(activity.eventType)}</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900">
                                            {getEventTypeLabel(activity.eventType)} event reported
                                        </p>
                                        <div className="flex items-center space-x-4 mt-1">
                                            <p className="text-xs text-gray-500 flex items-center space-x-1">
                                                <MapPin className="w-3 h-3" />
                                                <span>{activity.location || 'Location not specified'}</span>
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatDate(activity.timestamp)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex-shrink-0">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${activity.verificationStatus === 'verified'
                                                ? 'bg-green-100 text-green-800'
                                                : activity.verificationStatus === 'pending'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                            {activity.verificationStatus}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </motion.div>
            )}

            {/* Trust Score Progress */}
            <motion.div variants={itemVariants}>
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                        <Award className="w-5 h-5 text-gray-600" />
                        <span>Trust Score Progress</span>
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Current Score</span>
                            <span className="text-2xl font-bold text-blue-600">{user?.trustScore || 0}/100</span>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-4">
                            <motion.div
                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full flex items-center justify-end pr-2"
                                initial={{ width: 0 }}
                                animate={{ width: `${user?.trustScore || 0}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            >
                                <span className="text-xs text-white font-medium">
                                    {user?.trustScore || 0}%
                                </span>
                            </motion.div>
                        </div>

                        <div className="flex justify-between text-xs text-gray-500">
                            <span>Beginner (0-40)</span>
                            <span>Good (41-70)</span>
                            <span>Excellent (71-100)</span>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </motion.div>
    );
};

export default UserStats;