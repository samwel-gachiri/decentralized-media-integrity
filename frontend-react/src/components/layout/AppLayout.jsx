import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu,
    X,
    Home,
    Camera,
    Map,
    Brain,
    DollarSign,
    User,
    LogOut,
    Settings,
    BarChart3
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const AppLayout = ({ children, showNavigation = true, showFooter = true }) => {
    const { isAuthenticated, user, signOut } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
        setIsMobileMenuOpen(false);
    };

    const publicNavItems = [
        { path: '/', label: 'Home', icon: Home },
        { path: '/map', label: 'Map', icon: Map },
    ];

    const authenticatedNavItems = [
        { path: '/dashboard', label: 'Dashboard', icon: Home },
        { path: '/submit', label: 'Submit Event', icon: Camera },
        { path: '/map', label: 'Map', icon: Map },
        { path: '/metta', label: 'MeTTa', icon: Brain },
        { path: '/blockchain', label: 'Blockchain', icon: DollarSign },
        ...(user?.role === 'researcher' ? [
            { path: '/analytics', label: 'Analytics', icon: BarChart3 }
        ] : [])
    ];

    const navItems = isAuthenticated ? authenticatedNavItems : publicNavItems;

    const isActivePath = (path) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    if (!showNavigation) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">🌍</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900 hidden sm:block">
                                News Integrity Platform
                            </span>
                            <span className="text-xl font-bold text-gray-900 sm:hidden">
                                CWC
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-8">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActivePath(item.path)
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* User Menu / Auth Buttons */}
                        <div className="hidden md:flex items-center space-x-4">
                            {isAuthenticated ? (
                                <div className="flex items-center space-x-4">
                                    <Link
                                        to="/profile"
                                        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                    >
                                        <User className="w-4 h-4" />
                                        <span>{user?.firstName || 'Profile'}</span>
                                    </Link>
                                    <button
                                        onClick={handleSignOut}
                                        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Sign Out</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-4">
                                    <Link
                                        to="/signin"
                                        className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                    >
                                        Sign Up
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        >
                            {isMobileMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="md:hidden bg-white border-t border-gray-200"
                        >
                            <div className="px-4 py-4 space-y-2">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium transition-colors ${isActivePath(item.path)
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}

                                {/* Mobile Auth Section */}
                                <div className="pt-4 border-t border-gray-200">
                                    {isAuthenticated ? (
                                        <>
                                            <Link
                                                to="/profile"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className="flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                            >
                                                <User className="w-5 h-5" />
                                                <span>{user?.firstName || 'Profile'}</span>
                                            </Link>
                                            <button
                                                onClick={handleSignOut}
                                                className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                            >
                                                <LogOut className="w-5 h-5" />
                                                <span>Sign Out</span>
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Link
                                                to="/signin"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className="block w-full text-center px-3 py-3 rounded-lg text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                            >
                                                Sign In
                                            </Link>
                                            <Link
                                                to="/signup"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className="block w-full text-center px-3 py-3 rounded-lg text-base font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors mt-2"
                                            >
                                                Sign Up
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Main Content */}
            <main className="flex-1">
                {children}
            </main>

            {/* Footer */}
            {showFooter && (
                <footer className="bg-gray-900 text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div className="col-span-1 md:col-span-2">
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">🌍</span>
                                    </div>
                                    <span className="text-xl font-bold">News Integrity Platform</span>
                                </div>
                                <p className="text-gray-400 mb-4 max-w-md">
                                    Empowering communities to verify news authenticity through AI-powered analysis and blockchain technology
                                    MeTTa-powered verification and blockchain incentives.
                                </p>
                                <p className="text-sm text-gray-500">
                                    © 2024 News Integrity Platform. Built for the future of media verification.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-4">Platform</h3>
                                <ul className="space-y-2 text-gray-400">
                                    <li><Link to="/map" className="hover:text-white transition-colors">Event Map</Link></li>
                                    <li><Link to="/metta" className="hover:text-white transition-colors">MeTTa Verification</Link></li>
                                    <li><Link to="/blockchain" className="hover:text-white transition-colors">Blockchain</Link></li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-4">Support</h3>
                                <ul className="space-y-2 text-gray-400">
                                    <li><a href="/help" className="hover:text-white transition-colors">Help Center</a></li>
                                    <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
                                    <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </footer>
            )}
        </div>
    );
};

export default AppLayout;