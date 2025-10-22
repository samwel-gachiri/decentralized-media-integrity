import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import UserProfile from '../components/profile/UserProfile';
import UserStats from '../components/profile/UserStats';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { apiClient } from '../services/apiClient';

const Profile = () => {
    const { user, signOut, updateUser } = useAuth();
    const [userStats, setUserStats] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    useEffect(() => {
        if (user?.id) {
            loadUserStats();
        }
    }, [user?.id]);

    // Add mock data if user doesn't have stats
    useEffect(() => {
        if (user && !user.stats) {
            const mockStats = {
                totalEvents: 5,
                verifiedEvents: 4,
                verificationRate: 0.8,
                totalEarnings: 0.025
            };
            updateUser({ ...user, stats: mockStats });
        }
    }, [user, updateUser]);

    const loadUserStats = async () => {
        try {
            setIsLoading(true);
            const response = await apiClient.get(`/api/users/${user.id}/stats`);
            setUserStats(response.data.stats);
        } catch (error) {
            console.error('Failed to load user stats:', error);
            setUserStats({
                totalEvents: 0,
                verifiedEvents: 0,
                verificationRate: 0,
                totalPayouts: 0,
                eventTypes: {},
                recentActivity: []
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateProfile = async (updateData) => {
        try {
            setIsLoading(true);
            const response = await apiClient.put(`/api/users/${user.id}`, updateData);
            updateUser(response.data.user);
            return response.data.user;
        } catch (error) {
            console.error('Failed to update profile:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                when: "beforeChildren",
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.4 }
        }
    };

    if (!user) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="flex items-center justify-center min-h-screen bg-gray-50"
            >
                <div className="text-center p-6 bg-white rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                    <p className="text-gray-600">Please sign in to view your profile.</p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="min-h-screen bg-gray-50"
        >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <motion.div variants={itemVariants} className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
                    <p className="text-gray-600">Manage your account and view your activity</p>
                </motion.div>

                {/* Tab Navigation */}
                <motion.div variants={itemVariants} className="mb-6">
                    <nav className="flex space-x-8 border-b border-gray-200">
                        {['profile', 'stats', 'settings'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`group relative py-2 px-4 font-medium text-sm transition-all duration-200 transform hover:scale-105 hover:shadow-md rounded-t-lg ${
                                    activeTab === tab
                                        ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                                        : 'border-b-2 border-transparent text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                                }`}
                            >
                                <span className="relative z-10">
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </span>
                                <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
                            </button>
                        ))}
                    </nav>
                </motion.div>

                {/* Tab Content */}
                <motion.div variants={itemVariants}>
                    {activeTab === 'profile' && (
                        <UserProfile
                            user={user}
                            onUpdate={handleUpdateProfile}
                            isLoading={isLoading}
                        />
                    )}

                    {activeTab === 'stats' && (
                        <UserStats
                            user={user}
                            stats={userStats}
                        />
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Account Settings */}
                                <Card className="p-6 bg-white rounded-2xl shadow-lg group hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Settings</h2>
                                    <div className="space-y-3">
                                        <Button
                                            className="w-full group relative bg-white border-2 border-blue-600 text-blue-600 font-semibold rounded-lg py-2 hover:bg-blue-50 transition-all duration-200 transform hover:scale-105 hover:shadow-md"
                                            variant="outline"
                                        >
                                            <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                                            <span className="relative">Change Password</span>
                                        </Button>
                                        <Button
                                            className="w-full group relative bg-white border-2 border-blue-600 text-blue-600 font-semibold rounded-lg py-2 hover:bg-blue-50 transition-all duration-200 transform hover:scale-105 hover:shadow-md"
                                            variant="outline"
                                        >
                                            <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                                            <span className="relative">Update Email</span>
                                        </Button>
                                        <Button
                                            className="w-full group relative bg-white border-2 border-blue-600 text-blue-600 font-semibold rounded-lg py-2 hover:bg-blue-50 transition-all duration-200 transform hover:scale-105 hover:shadow-md"
                                            variant="outline"
                                        >
                                            <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                                            <span className="relative">Privacy Settings</span>
                                        </Button>
                                    </div>
                                </Card>

                                {/* Quick Actions */}
                                <Card className="p-6 bg-white rounded-2xl shadow-lg group hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                                    <div className="space-y-3">
                                        <Button
                                            className="w-full group relative bg-white border-2 border-blue-600 text-blue-600 font-semibold rounded-lg py-2 hover:bg-blue-50 transition-all duration-200 transform hover:scale-105 hover:shadow-md"
                                            variant="outline"
                                        >
                                            <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                                            <span className="relative">Download Data</span>
                                        </Button>
                                        <Button
                                            className="w-full group relative bg-white border-2 border-blue-600 text-blue-600 font-semibold rounded-lg py-2 hover:bg-blue-50 transition-all duration-200 transform hover:scale-105 hover:shadow-md"
                                            variant="outline"
                                        >
                                            <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                                            <span className="relative">Export Reports</span>
                                        </Button>
                                        <Button
                                            className="w-full group relative bg-red-600 text-white font-semibold rounded-lg py-2 hover:bg-red-700 transition-all duration-200 transform hover:scale-105 hover:shadow-md"
                                            variant="destructive"
                                            onClick={signOut}
                                        >
                                            <div className="absolute inset-0 bg-red-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                                            <span className="relative">Sign Out</span>
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Profile;