import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import {
    Plus,
    TrendingUp,
    Calendar,
    MapPin,
    Eye,
    Award,
    Coins,
    Activity,
    Clock,
    CheckCircle,
    AlertTriangle,
    Camera,
    BarChart3,
    Target
} from 'lucide-react';
import Button from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import EventCard from '../events/EventCard';
import UserStats from '../profile/UserStats';
import TrustScoreDisplay from '../profile/TrustScoreDisplay';
import { useAuth } from '../../hooks/useAuth';
import { InsuranceWidget } from '../insurance';
import { DAOWidget } from '../dao';

const UserDashboard = ({
    user,
    recentEvents = [],
    stats = {},
    onSubmitEvent,
    onViewEvent,
    onViewProfile
}) => {
    const { user: authUser } = useAuth();
    const [timeOfDay, setTimeOfDay] = useState('');

    // Set greeting based on time of day
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setTimeOfDay('morning');
        else if (hour < 17) setTimeOfDay('afternoon');
        else setTimeOfDay('evening');
    }, []);

    const getGreeting = () => {
        const greetings = {
            morning: '🌅 Good morning',
            afternoon: '☀️ Good afternoon',
            evening: '🌙 Good evening'
        };
        return greetings[timeOfDay] || 'Hello';
    };

    // Quick stats for dashboard
    const quickStats = [
        {
            label: 'Total Events',
            value: stats.totalEvents || 0,
            icon: Activity,
            color: 'text-primary-600',
            bgColor: 'bg-primary-50',
            change: '+2 this week'
        },
        {
            label: 'Verified Events',
            value: stats.verifiedEvents || 0,
            icon: CheckCircle,
            color: 'text-success-600',
            bgColor: 'bg-success-50',
            change: `${((stats.verifiedEvents || 0) / Math.max(stats.totalEvents || 1, 1) * 100).toFixed(0)}% rate`
        },
        {
            label: 'Total Earnings',
            value: `${(stats.totalEarnings || 0).toFixed(3)} ETH`,
            icon: Coins,
            color: 'text-accent-600',
            bgColor: 'bg-accent-50',
            change: `≈ $${((stats.totalEarnings || 0) * 2000).toFixed(0)}`
        },
        {
            label: 'Trust Score',
            value: `${user?.trustScore || 0}/100`,
            icon: Award,
            color: 'text-secondary-600',
            bgColor: 'bg-secondary-50',
            change: user?.trustScore >= 80 ? 'Excellent' : user?.trustScore >= 60 ? 'Good' : 'Building'
        }
    ];

    // Recent activity items
    const recentActivity = [
        {
            type: 'event_submitted',
            title: 'New drought event submitted',
            description: 'Event pending MeTTa verification',
            time: '2 hours ago',
            icon: Camera,
            color: 'text-primary-600'
        },
        {
            type: 'event_verified',
            title: 'Flood event verified',
            description: 'Earned 0.05 ETH payout',
            time: '1 day ago',
            icon: CheckCircle,
            color: 'text-success-600'
        },
        {
            type: 'trust_increased',
            title: 'Trust score increased',
            description: 'Your trust score improved by +5 points',
            time: '3 days ago',
            icon: TrendingUp,
            color: 'text-secondary-600'
        }
    ];

    // Quick actions
    const quickActions = [
        {
            title: 'Submit New Event',
            description: 'Submit a news report for verification',
            icon: Plus,
            color: 'bg-primary-600 hover:bg-primary-700',
            action: onSubmitEvent
        },
        {
            title: 'View Map',
            description: 'Explore climate events on the interactive map',
            icon: MapPin,
            color: 'bg-secondary-600 hover:bg-secondary-700',
            action: () => window.location.href = '/map'
        },
        {
            title: 'My Profile',
            description: 'View and edit your profile information',
            icon: Eye,
            color: 'bg-accent-600 hover:bg-accent-700',
            action: onViewProfile
        }
    ];

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-6 text-white"
            >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">
                            {getGreeting()}, {user?.firstName || authUser?.firstName || 'Climate Reporter'}! 👋
                        </h1>
                        <p className="text-primary-100 mb-4 md:mb-0">
                            Ready to make a difference in climate monitoring today?
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <TrustScoreDisplay
                            score={user?.trustScore || 0}
                            size="lg"
                            showLabel={false}
                            className="text-white"
                        />
                        <Button
                            variant="secondary"
                            onClick={onSubmitEvent}
                            className="bg-white text-primary-600 hover:bg-primary-50"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Submit Event
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickStats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="p-6 hover:shadow-medium transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                                <Badge variant="outline" size="sm">
                                    {stat.change}
                                </Badge>
                            </div>
                            <div className="text-2xl font-bold text-neutral-900 mb-1">
                                {stat.value}
                            </div>
                            <div className="text-sm text-neutral-600">
                                {stat.label}
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Quick Actions */}
                    <Card>
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Target className="w-5 h-5 text-primary-600" />
                                Quick Actions
                            </h3>
                            <div className="grid md:grid-cols-3 gap-4">
                                {quickActions.map((action, index) => (
                                    <motion.button
                                        key={action.title}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={action.action}
                                        className={`${action.color} text-white p-4 rounded-xl text-left transition-all hover:scale-105 hover:shadow-lg`}
                                    >
                                        <action.icon className="w-8 h-8 mb-3" />
                                        <div className="font-semibold mb-1">{action.title}</div>
                                        <div className="text-sm opacity-90">{action.description}</div>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Recent Events */}
                    <Card>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-primary-600" />
                                    Recent Events
                                </h3>
                                <Button variant="outline" size="sm">
                                    View All
                                </Button>
                            </div>

                            {recentEvents.length === 0 ? (
                                <div className="text-center py-8">
                                    <Camera className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                                    <h4 className="text-lg font-medium text-neutral-900 mb-2">
                                        No events yet
                                    </h4>
                                    <p className="text-neutral-600 mb-4">
                                        Start contributing to climate monitoring by submitting your first event
                                    </p>
                                    <Button onClick={onSubmitEvent}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Submit First Event
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {recentEvents.slice(0, 3).map((event, index) => (
                                        <motion.div
                                            key={event.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <EventCard
                                                event={event}
                                                showActions={true}
                                                onView={() => onViewEvent?.(event.id)}
                                                compact={true}
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Performance Chart Placeholder */}
                    <Card>
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-primary-600" />
                                Performance Overview
                            </h3>
                            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-8 text-center">
                                <BarChart3 className="w-16 h-16 text-primary-600 mx-auto mb-4" />
                                <h4 className="text-lg font-medium text-neutral-900 mb-2">
                                    Analytics Coming Soon
                                </h4>
                                <p className="text-neutral-600">
                                    Detailed performance charts and insights will be available here
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* User Stats */}
                    <UserStats user={user} stats={stats} />

                    {/* Insurance Widget */}
                    <InsuranceWidget />

                    {/* DAO Widget */}
                    <DAOWidget />

                    {/* Recent Activity */}
                    <Card>
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-primary-600" />
                                Recent Activity
                            </h3>
                            <div className="space-y-4">
                                {recentActivity.map((activity, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-start gap-3"
                                    >
                                        <div className={`p-2 rounded-lg bg-neutral-100`}>
                                            <activity.icon className={`w-4 h-4 ${activity.color}`} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{activity.title}</div>
                                            <div className="text-xs text-neutral-600 mb-1">
                                                {activity.description}
                                            </div>
                                            <div className="text-xs text-neutral-500">{activity.time}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* MeTTa Insights */}
                    <Card>
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                🧠 MeTTa Insights
                                <Badge variant="primary" size="sm">AI</Badge>
                            </h3>
                            <div className="space-y-3">
                                <div className="bg-primary-50 rounded-lg p-4">
                                    <div className="font-medium text-primary-900 mb-2">
                                        Verification Tip
                                    </div>
                                    <div className="text-sm text-primary-700">
                                        Include clear photos and detailed descriptions to improve verification rates
                                    </div>
                                </div>
                                <div className="bg-secondary-50 rounded-lg p-4">
                                    <div className="font-medium text-secondary-900 mb-2">
                                        Trust Building
                                    </div>
                                    <div className="text-sm text-secondary-700">
                                        Consistent reporting in your region helps build community trust
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Goals & Achievements */}
                    <Card>
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Award className="w-5 h-5 text-accent-600" />
                                Goals & Achievements
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-success-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">First Event</div>
                                        <div className="text-xs text-neutral-600">Submitted your first climate event</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center">
                                        <Target className="w-4 h-4 text-neutral-400" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">Trusted Reporter</div>
                                        <div className="text-xs text-neutral-600">Reach 80+ trust score</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center">
                                        <Target className="w-4 h-4 text-neutral-400" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">Community Leader</div>
                                        <div className="text-xs text-neutral-600">Submit 10 verified events</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;