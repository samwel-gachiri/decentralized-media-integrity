import { Link } from 'react-router-dom';
import { DollarSign, Brain, Map, User } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
    const { user } = useAuth();


    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Header */}
                    <div className="bg-white shadow rounded-lg p-6 mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Welcome back, {user?.firstName || 'User'}! 👋
                        </h1>
                        <p className="text-gray-600">
                            {user?.role === 'researcher'
                                ? 'Access your research dashboard and analytics below.'
                                : 'Ready to submit news reports and contribute to integrity verification?'
                            }
                        </p>
                    </div>

                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <Link to="/dao" className="p-6 rounded-xl shadow bg-white flex items-center space-x-4 hover:bg-blue-50 transition">
                            <Brain className="w-8 h-8 text-blue-600" />
                            <div>
                                <div className="font-semibold text-lg">DAO Governance</div>
                                <div className="text-gray-500 text-sm">Proposals, voting, relief</div>
                            </div>
                        </Link>
                        <Link to="/alerts" className="p-6 rounded-xl shadow bg-white flex items-center space-x-4 hover:bg-yellow-50 transition">
                            <Map className="w-8 h-8 text-yellow-600" />
                            <div>
                                <div className="font-semibold text-lg">Alerts & Early Warning</div>
                                <div className="text-gray-500 text-sm">See integrity alerts and warnings</div>
                            </div>
                        </Link>
                        <Link to="/community-verification" className="p-6 rounded-xl shadow bg-white flex items-center space-x-4 hover:bg-indigo-50 transition">
                            <User className="w-8 h-8 text-indigo-600" />
                            <div>
                                <div className="font-semibold text-lg">Community Verification</div>
                                <div className="text-gray-500 text-sm">Verify events, build trust</div>
                            </div>
                        </Link>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-lg shadow p-6"
                        >
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <span className="text-blue-600 font-semibold">📊</span>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Trust Score</p>
                                    <p className="text-2xl font-semibold text-gray-900">
                                        {user?.trustScore || 0}/100
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-lg shadow p-6"
                        >
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                        <span className="text-emerald-600 font-semibold">📍</span>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Location</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {user?.locationRegion || 'Not set'}
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-lg shadow p-6"
                        >
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                        <span className="text-amber-600 font-semibold">👤</span>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Role</p>
                                    <p className="text-lg font-semibold text-gray-900 capitalize">
                                        {user?.role || 'User'}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white shadow rounded-lg p-6"
                    >
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center">
                                <div className="text-2xl mb-2">📸</div>
                                <p className="text-sm font-medium text-gray-700">Submit Event</p>
                            </button>

                            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-center">
                                <div className="text-2xl mb-2">🗺️</div>
                                <p className="text-sm font-medium text-gray-700">View Map</p>
                            </button>

                            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-center">
                                <div className="text-2xl mb-2">🧠</div>
                                <p className="text-sm font-medium text-gray-700">MeTTa Atoms</p>
                            </button>

                            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-colors text-center">
                                <div className="text-2xl mb-2">⚙️</div>
                                <p className="text-sm font-medium text-gray-700">Settings</p>
                            </button>
                        </div>
                    </motion.div>

                    {/* Coming Soon */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-6 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg p-6 text-center"
                    >
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            🚀 More Features Coming Soon
                        </h3>
                        <p className="text-gray-600">
                            We're working on bringing you the full News Integrity Platform experience with
                            news submission, map visualization, AI verification, and blockchain integration.
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default Dashboard;