import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Newspaper, Map, Brain, DollarSign, TrendingUp, Users, Shield, Globe, AlertTriangle, CheckCircle, Zap, Search, Eye, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/apiClient.js';

const Home = () => {
    const { isAuthenticated } = useAuth();
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hoveredFeature, setHoveredFeature] = useState(null);

    // Load platform statistics
    const loadStats = async () => {
        try {
            const response = await apiClient.get('/api/news/stats');
            setStats({
                totalReports: response.data.total_reports,
                verifiedReports: response.data.verified_reports,
                totalIntegrityScore: response.data.total_integrity_score
            });
        } catch (error) {
            console.error('Failed to load stats:', error);
            // Set default stats if API fails
            setStats({
                totalReports: 0,
                verifiedReports: 0,
                totalIntegrityScore: 0
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    const features = [
        {
            icon: Newspaper,
            title: 'AI-Powered News Verification',
            description: 'Submit news with automatic integrity analysis and deepfake detection',
            color: 'from-blue-500 to-blue-600',
            emoji: '�',
            gradient: 'bg-gradient-to-r from-blue-500 to-blue-600'
        },
        {
            icon: Brain,
            title: 'MeTTa Integrity Analysis',
            description: 'Advanced verification using MeTTa knowledge atoms and logic',
            color: 'from-purple-500 to-purple-600',
            emoji: '🧠',
            gradient: 'bg-gradient-to-r from-purple-500 to-purple-600'
        },
        {
            icon: Search,
            title: 'Cross-Source Verification',
            description: 'Automated fact-checking against multiple reputable sources',
            color: 'from-emerald-500 to-emerald-600',
            emoji: '�',
            gradient: 'bg-gradient-to-r from-emerald-500 to-emerald-600'
        },
        {
            icon: Lock,
            title: 'AI-Powered Verification',
            description: 'Advanced content analysis using CUDOS ASI Cloud for deep integrity assessment',
            color: 'from-amber-500 to-amber-600',
            emoji: '🔒',
            gradient: 'bg-gradient-to-r from-amber-500 to-amber-600'
        }
    ];

    // Animation variants
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
                type: "spring",
                stiffness: 100
            }
        }
    };

    // News icons for background animation
    const NewsIcon = ({ icon: Icon, ...props }) => {
        return <Icon {...props} />;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
            {/* Animated background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {[...Array(5)].map((_, i) => {
                    const IconComponent = [Newspaper, Search, Eye, Shield][i % 4];
                    return (
                        <motion.div
                            key={i}
                            className="absolute opacity-5"
                            style={{
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                y: [0, -20, 0],
                                x: [0, 15, 0],
                                rotate: [0, 180, 360],
                            }}
                            transition={{
                                duration: 15 + i * 3,
                                repeat: Infinity,
                                delay: i * 2
                            }}
                        >
                            {IconComponent && (
                                <NewsIcon
                                    icon={IconComponent}
                                    size={40 + i * 10}
                                    className="text-blue-300"
                                />
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
                    >
                        {/* Hero Text */}
                        <motion.div
                            variants={itemVariants}
                            className="text-center lg:text-left"
                        >
                            <motion.h1
                                variants={itemVariants}
                                className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6"
                            >
                                <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                                    Decentralized News Integrity
                                </span>
                                <motion.span
                                    animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                                    transition={{ repeat: Infinity, duration: 2.5, delay: 1 }}
                                    className="ml-3 inline-block"
                                >
                                    📰
                                </motion.span>
                            </motion.h1>

                            <motion.p
                                variants={itemVariants}
                                className="text-xl text-gray-600 mb-8 leading-relaxed"
                            >
                                Community-driven news verification using MeTTa knowledge atoms
                                with AI-powered deepfake detection and CUDOS ASI Cloud analysis.
                            </motion.p>

                            <motion.div
                                variants={itemVariants}
                                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                            >
                                {isAuthenticated ? (
                                    <>
                                        <Link
                                            to="/submit-news"
                                            className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl overflow-hidden transform hover:scale-105 transition-all duration-300 shadow-lg"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            <span className="relative flex items-center">
                                                <Newspaper className="w-5 h-5 mr-2" />
                                                Submit News Report
                                            </span>
                                        </Link>
                                        <Link
                                            to="/news-dashboard"
                                            className="group relative inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl border-2 border-blue-600 overflow-hidden transform hover:scale-105 transition-all duration-300"
                                        >
                                            <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            <span className="relative">Go to Dashboard</span>
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            to="/signup"
                                            className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl overflow-hidden transform hover:scale-105 transition-all duration-300 shadow-lg"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            <span className="relative flex items-center">
                                                <Users className="w-5 h-5 mr-2" />
                                                Join the Community
                                            </span>
                                        </Link>
                                        <Link
                                            to="/news-map"
                                            className="group relative inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl border-2 border-blue-600 overflow-hidden transform hover:scale-105 transition-all duration-300"
                                        >
                                            <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            <span className="relative flex items-center">
                                                <Map className="w-5 h-5 mr-2" />
                                                Explore News Map
                                            </span>
                                        </Link>
                                        <Link
                                            to="/news-dashboard"
                                            className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-xl overflow-hidden transform hover:scale-105 transition-all duration-300 shadow-lg"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-emerald-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            <span className="relative flex items-center">
                                                <TrendingUp className="w-5 h-5 mr-2" />
                                                View Dashboard
                                            </span>
                                        </Link>
                                    </>
                                )}
                            </motion.div>
                        </motion.div>

                        {/* Hero Image */}
                        <motion.div
                            variants={itemVariants}
                            className="relative"
                        >
                            <motion.div
                                className="relative rounded-2xl overflow-hidden shadow-2xl"
                                whileHover={{ scale: 1.02 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <img
                                    src="https://images.unsplash.com/photo-1504711434969-e33886168f5c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                                    alt="News integrity and verification"
                                    className="w-full h-96 object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

                                {/* Floating elements over hero image */}
                                <motion.div
                                    className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg"
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 3 }}
                                >
                                    <Shield className="w-6 h-6 text-emerald-500" />
                                </motion.div>

                                <motion.div
                                    className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg"
                                    animate={{ y: [0, 10, 0] }}
                                    transition={{ repeat: Infinity, duration: 4, delay: 1 }}
                                >
                                    <Eye className="w-6 h-6 text-amber-500" />
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 bg-white relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true, margin: "-100px" }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                            Advanced News Verification
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Harness the power of AI, blockchain, and community collaboration to create
                            the most comprehensive news integrity network.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.6 }}
                                viewport={{ once: true, margin: "-50px" }}
                                className="relative group"
                                onMouseEnter={() => setHoveredFeature(index)}
                                onMouseLeave={() => setHoveredFeature(null)}
                            >
                                <motion.div
                                    className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 relative overflow-hidden"
                                    whileHover={{ y: -10, scale: 1.02 }}
                                >
                                    {/* Animated background on hover */}
                                    <motion.div
                                        className={`absolute inset-0 opacity-0 ${feature.gradient} rounded-2xl`}
                                        animate={{ opacity: hoveredFeature === index ? 0.05 : 0 }}
                                        transition={{ duration: 0.3 }}
                                    />

                                    <motion.div
                                        className={`w-12 h-12 ${feature.gradient} rounded-xl flex items-center justify-center mb-6 relative z-10`}
                                        animate={{ scale: hoveredFeature === index ? 1.15 : 1 }}
                                        transition={{ type: "spring", stiffness: 300 }}
                                    >
                                        <feature.icon className="w-6 h-6 text-white" />
                                    </motion.div>

                                    <h3 className="text-xl font-semibold text-gray-900 mb-3 relative z-10">
                                        <span className="mr-2">{feature.emoji}</span>
                                        {feature.title}
                                    </h3>

                                    <p className="text-gray-600 leading-relaxed relative z-10">
                                        {feature.description}
                                    </p>

                                    {/* Hover indicator */}
                                    <motion.div
                                        className={`absolute bottom-0 left-0 h-1 ${feature.gradient} rounded-full`}
                                        animate={{ width: hoveredFeature === index ? '100%' : '0%' }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </motion.div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Statistics Section */}
            {stats && (
                <section className="py-16 bg-gradient-to-r from-blue-600 to-emerald-600 relative overflow-hidden">
                    {/* Animated background elements */}
                    <motion.div
                        className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full"
                        animate={{ scale: [1, 1.2, 1], rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 8 }}
                    />
                    <motion.div
                        className="absolute bottom-10 right-10 w-16 h-16 bg-white/10 rounded-full"
                        animate={{ scale: [1.2, 1, 1.2], rotate: -360 }}
                        transition={{ repeat: Infinity, duration: 6 }}
                    />

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true, margin: "-100px" }}
                            className="text-center mb-12"
                        >
                            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                                Platform Impact
                            </h2>
                            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                                Real-time statistics showing our community's contribution to news integrity
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { icon: TrendingUp, label: "Total Reports Submitted", value: stats.totalReports },
                                { icon: Shield, label: "Verified Reports", value: stats.verifiedReports },
                                { icon: CheckCircle, label: "Average Integrity Score", value: `${stats.totalIntegrityScore}%` }
                            ].map((stat, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1, duration: 0.6 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    className="text-center"
                                >
                                    <motion.div
                                        className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer"
                                        whileHover={{ y: -5, scale: 1.02 }}
                                    >
                                        <stat.icon className="w-12 h-12 text-white mx-auto mb-4" />
                                        <motion.div
                                            className="text-4xl font-bold text-white mb-2"
                                            key={stat.value}
                                            initial={{ scale: 0.8 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 200 }}
                                        >
                                            {isLoading ? '...' : stat.value}
                                        </motion.div>
                                        <div className="text-blue-100 font-medium">{stat.label}</div>
                                    </motion.div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Call to Action */}
            {!isAuthenticated && (
                <section className="py-16 bg-gray-50 relative">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true, margin: "-100px" }}
                        >
                            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                                Ready to Combat Misinformation?
                            </h2>
                            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                                Join thousands of fact-checkers documenting news integrity
                                and earning rewards for verified contributions.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    to="/signup"
                                    className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl overflow-hidden transform hover:scale-105 transition-all duration-300 shadow-lg"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <span className="relative">Get Started Today</span>
                                </Link>
                                <Link
                                    to="/signin"
                                    className="group relative inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl border-2 border-blue-600 overflow-hidden transform hover:scale-105 transition-all duration-300"
                                >
                                    <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <span className="relative">Sign In</span>
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default Home;