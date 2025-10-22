import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3,
    TrendingUp,
    Download,
    Filter,
    Calendar,
    MapPin,
    Users,
    Activity,
    Database,
    FileText,
    Search,
    Settings,
    Globe,
    Zap,
    Brain,
    Target,
    AlertTriangle,
    CheckCircle,
    Clock,
    Eye
} from 'lucide-react';
import Button from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import EventList from '../events/EventList';
import { useAuth } from '../../hooks/useAuth';

const ResearcherDashboard = ({
    user,
    analytics = {},
    exportOptions = [],
    onExportData,
    onViewEvent,
    onFilterChange
}) => {
    const { user: authUser } = useAuth();
    const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
    const [selectedRegion, setSelectedRegion] = useState('all');
    const [selectedEventType, setSelectedEventType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // Time range options
    const timeRanges = [
        { value: '7d', label: 'Last 7 days' },
        { value: '30d', label: 'Last 30 days' },
        { value: '90d', label: 'Last 3 months' },
        { value: '1y', label: 'Last year' },
        { value: 'all', label: 'All time' }
    ];

    // Region options
    const regions = [
        { value: 'all', label: 'All Regions' },
        { value: 'africa', label: 'Africa' },
        { value: 'asia', label: 'Asia' },
        { value: 'europe', label: 'Europe' },
        { value: 'north_america', label: 'North America' },
        { value: 'south_america', label: 'South America' },
        { value: 'oceania', label: 'Oceania' }
    ];

    // Event types
    const eventTypes = [
        { value: 'all', label: 'All Types', icon: '📰' },
        { value: 'drought', label: 'Drought', icon: '🌵' },
        { value: 'flood', label: 'Flood', icon: '🌊' },
        { value: 'locust', label: 'Locust', icon: '🦗' },
        { value: 'extreme_heat', label: 'Extreme Heat', icon: '🔥' }
    ];

    // Analytics overview cards
    const analyticsCards = [
        {
            title: 'Total Events',
            value: analytics.totalEvents || 0,
            change: '+12%',
            changeType: 'positive',
            icon: Activity,
            color: 'text-primary-600',
            bgColor: 'bg-primary-50'
        },
        {
            title: 'Verification Rate',
            value: `${((analytics.verifiedEvents || 0) / Math.max(analytics.totalEvents || 1, 1) * 100).toFixed(1)}%`,
            change: '+5.2%',
            changeType: 'positive',
            icon: CheckCircle,
            color: 'text-success-600',
            bgColor: 'bg-success-50'
        },
        {
            title: 'Active Reporters',
            value: analytics.activeReporters || 0,
            change: '+8%',
            changeType: 'positive',
            icon: Users,
            color: 'text-secondary-600',
            bgColor: 'bg-secondary-50'
        },
        {
            title: 'MeTTa Accuracy',
            value: `${(analytics.mettaAccuracy || 0).toFixed(1)}%`,
            change: '+2.1%',
            changeType: 'positive',
            icon: Brain,
            color: 'text-accent-600',
            bgColor: 'bg-accent-50'
        }
    ];

    // Export options
    const defaultExportOptions = [
        {
            id: 'events_csv',
            name: 'Events Data (CSV)',
            description: 'All event data with verification status',
            format: 'CSV',
            icon: FileText
        },
        {
            id: 'analytics_json',
            name: 'Analytics Report (JSON)',
            description: 'Comprehensive analytics and statistics',
            format: 'JSON',
            icon: BarChart3
        },
        {
            id: 'metta_atoms',
            name: 'MeTTa Knowledge Atoms',
            description: 'AI-generated knowledge representations',
            format: 'JSON',
            icon: Brain
        },
        {
            id: 'geospatial_data',
            name: 'Geospatial Dataset',
            description: 'Location data for mapping and analysis',
            format: 'GeoJSON',
            icon: MapPin
        }
    ];

    // Handle filter changes
    useEffect(() => {
        const filters = {
            timeRange: selectedTimeRange,
            region: selectedRegion,
            eventType: selectedEventType,
            search: searchQuery
        };
        onFilterChange?.(filters);
    }, [selectedTimeRange, selectedRegion, selectedEventType, searchQuery, onFilterChange]);

    // Mock data for charts (in real app, this would come from props)
    const chartData = {
        eventsByType: [
            { type: 'Drought', count: 45, percentage: 35 },
            { type: 'Flood', count: 32, percentage: 25 },
            { type: 'Extreme Heat', count: 28, percentage: 22 },
            { type: 'Locust', count: 23, percentage: 18 }
        ],
        verificationTrends: [
            { month: 'Jan', verified: 85, pending: 15 },
            { month: 'Feb', verified: 88, pending: 12 },
            { month: 'Mar', verified: 92, pending: 8 },
            { month: 'Apr', verified: 89, pending: 11 },
            { month: 'May', verified: 94, pending: 6 }
        ]
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-6 text-white"
            >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">
                            Research Dashboard 🔬
                        </h1>
                        <p className="text-primary-100 mb-4 lg:mb-0">
                            Advanced analytics and insights for climate data research
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                            <Brain className="w-4 h-4 mr-1" />
                            MeTTa Powered
                        </Badge>
                        <Button
                            variant="secondary"
                            className="bg-white text-primary-600 hover:bg-primary-50"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export Data
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Analytics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {analyticsCards.map((card, index) => (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="p-6 hover:shadow-medium transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                                    <card.icon className={`w-6 h-6 ${card.color}`} />
                                </div>
                                <Badge
                                    variant={card.changeType === 'positive' ? 'success' : 'error'}
                                    size="sm"
                                >
                                    {card.change}
                                </Badge>
                            </div>
                            <div className="text-2xl font-bold text-neutral-900 mb-1">
                                {card.value}
                            </div>
                            <div className="text-sm text-neutral-600">
                                {card.title}
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Filters and Controls */}
            <Card>
                <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Filter className="w-5 h-5 text-primary-600" />
                            Data Filters & Analysis
                        </h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Time Range */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Time Range</label>
                            <select
                                value={selectedTimeRange}
                                onChange={(e) => setSelectedTimeRange(e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                {timeRanges.map(range => (
                                    <option key={range.value} value={range.value}>
                                        {range.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Region */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Region</label>
                            <select
                                value={selectedRegion}
                                onChange={(e) => setSelectedRegion(e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                {regions.map(region => (
                                    <option key={region.value} value={region.value}>
                                        {region.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Event Type */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Event Type</label>
                            <select
                                value={selectedEventType}
                                onChange={(e) => setSelectedEventType(e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                {eventTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.icon} {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Search */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                                <Input
                                    type="text"
                                    placeholder="Search events..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Advanced Filters */}
                    {showAdvancedFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Verification Status</label>
                                    <select className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                                        <option value="all">All Status</option>
                                        <option value="verified">Verified</option>
                                        <option value="pending">Pending</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Trust Score Range</label>
                                    <select className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                                        <option value="all">All Scores</option>
                                        <option value="high">80-100 (High)</option>
                                        <option value="medium">60-79 (Medium)</option>
                                        <option value="low">0-59 (Low)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Data Source</label>
                                    <select className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                                        <option value="all">All Sources</option>
                                        <option value="mobile">Mobile App</option>
                                        <option value="web">Web Platform</option>
                                        <option value="api">API Integration</option>
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </Card>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Analytics */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Charts Section */}
                    <Card>
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-primary-600" />
                                Event Distribution Analysis
                            </h3>

                            {/* Events by Type Chart */}
                            <div className="mb-6">
                                <h4 className="font-medium mb-3">Events by Type</h4>
                                <div className="space-y-3">
                                    {chartData.eventsByType.map((item, index) => (
                                        <div key={item.type} className="flex items-center gap-4">
                                            <div className="w-20 text-sm font-medium">{item.type}</div>
                                            <div className="flex-1 bg-neutral-200 rounded-full h-3">
                                                <motion.div
                                                    className="bg-primary-600 h-3 rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${item.percentage}%` }}
                                                    transition={{ delay: index * 0.1, duration: 0.5 }}
                                                />
                                            </div>
                                            <div className="w-12 text-sm text-neutral-600">{item.count}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Verification Trends */}
                            <div>
                                <h4 className="font-medium mb-3">Verification Trends</h4>
                                <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-6 text-center">
                                    <TrendingUp className="w-12 h-12 text-primary-600 mx-auto mb-3" />
                                    <div className="text-lg font-semibold text-neutral-900 mb-2">
                                        Interactive Charts Coming Soon
                                    </div>
                                    <div className="text-sm text-neutral-600">
                                        Advanced visualization with Chart.js integration
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* MeTTa AI Insights */}
                    <Card>
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                🧠 MeTTa AI Insights
                                <Badge variant="primary" size="sm">AI Powered</Badge>
                            </h3>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-primary-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Zap className="w-5 h-5 text-primary-600" />
                                        <span className="font-medium">Pattern Detection</span>
                                    </div>
                                    <div className="text-sm text-primary-700 mb-2">
                                        Drought events show 23% increase in East Africa region
                                    </div>
                                    <div className="text-xs text-primary-600">
                                        Confidence: 87%
                                    </div>
                                </div>

                                <div className="bg-secondary-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target className="w-5 h-5 text-secondary-600" />
                                        <span className="font-medium">Prediction Model</span>
                                    </div>
                                    <div className="text-sm text-secondary-700 mb-2">
                                        High probability of flood events in monsoon regions
                                    </div>
                                    <div className="text-xs text-secondary-600">
                                        Accuracy: 92%
                                    </div>
                                </div>

                                <div className="bg-accent-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="w-5 h-5 text-accent-600" />
                                        <span className="font-medium">Anomaly Detection</span>
                                    </div>
                                    <div className="text-sm text-accent-700 mb-2">
                                        Unusual locust activity patterns detected
                                    </div>
                                    <div className="text-xs text-accent-600">
                                        Alert Level: Medium
                                    </div>
                                </div>

                                <div className="bg-success-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="w-5 h-5 text-success-600" />
                                        <span className="font-medium">Quality Score</span>
                                    </div>
                                    <div className="text-sm text-success-700 mb-2">
                                        Data quality improved by 15% this month
                                    </div>
                                    <div className="text-xs text-success-600">
                                        Trend: Positive
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Export Options */}
                    <Card>
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Download className="w-5 h-5 text-primary-600" />
                                Data Export
                            </h3>
                            <div className="space-y-3">
                                {(exportOptions.length > 0 ? exportOptions : defaultExportOptions).map((option) => (
                                    <div
                                        key={option.id}
                                        className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                                        onClick={() => onExportData?.(option.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <option.icon className="w-5 h-5 text-neutral-600" />
                                            <div>
                                                <div className="font-medium text-sm">{option.name}</div>
                                                <div className="text-xs text-neutral-600">{option.description}</div>
                                            </div>
                                        </div>
                                        <Badge variant="outline" size="sm">
                                            {option.format}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Quick Stats */}
                    <Card>
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Database className="w-5 h-5 text-primary-600" />
                                Quick Stats
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-neutral-600">Data Points</span>
                                    <span className="font-semibold">12,847</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-neutral-600">Countries</span>
                                    <span className="font-semibold">23</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-neutral-600">Active Regions</span>
                                    <span className="font-semibold">156</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-neutral-600">MeTTa Atoms</span>
                                    <span className="font-semibold">45,231</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-neutral-600">Last Updated</span>
                                    <span className="font-semibold text-xs">2 min ago</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Research Tools */}
                    <Card>
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Globe className="w-5 h-5 text-primary-600" />
                                Research Tools
                            </h3>
                            <div className="space-y-2">
                                <Button variant="outline" className="w-full justify-start">
                                    <MapPin className="w-4 h-4 mr-2" />
                                    Geospatial Analysis
                                </Button>
                                <Button variant="outline" className="w-full justify-start">
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    Statistical Models
                                </Button>
                                <Button variant="outline" className="w-full justify-start">
                                    <Brain className="w-4 h-4 mr-2" />
                                    MeTTa Query Builder
                                </Button>
                                <Button variant="outline" className="w-full justify-start">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Report Generator
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ResearcherDashboard;