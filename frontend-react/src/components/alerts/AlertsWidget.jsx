import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';

const AlertsWidget = () => {
    const { user } = useAuth();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [alertStats, setAlertStats] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [newAlertCount, setNewAlertCount] = useState(0);
    const [subscribed, setSubscribed] = useState(false);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    const loadAlerts = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            const response = await fetch(`/api/alerts/user/${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setAlerts(data.alerts || []);
            }
        } catch (error) {
            console.error('Error loading alerts:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const loadAlertStats = useCallback(async () => {
        try {
            const response = await fetch('/api/alerts/stats');
            if (response.ok) {
                const data = await response.json();
                setAlertStats(data);
            }
        } catch (error) {
            console.error('Error loading alert stats:', error);
        }
    }, []);

    const connectWebSocket = useCallback(() => {
        if (!user || wsRef.current) return;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/alerts/ws/${user.id}`;

        try {
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                console.log('WebSocket connected for alerts');
                setConnectionStatus('connected');
                setNewAlertCount(0);

                // Clear any reconnection timeout
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = null;
                }
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'climate_alert') {
                        // Add new alert to the list
                        setAlerts(prevAlerts => [data.alert, ...prevAlerts]);
                        setNewAlertCount(prev => prev + 1);

                        // Show browser notification if supported
                        if (Notification.permission === 'granted') {
                            new Notification(data.alert.title, {
                                body: data.alert.message,
                                icon: '/favicon.ico',
                                tag: data.alert.id
                            });
                        }

                        // Play alert sound for critical alerts
                        if (data.alert.severity === 'critical') {
                            playAlertSound();
                        }
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            wsRef.current.onclose = () => {
                console.log('WebSocket disconnected');
                setConnectionStatus('disconnected');
                wsRef.current = null;

                // Attempt to reconnect after 5 seconds
                reconnectTimeoutRef.current = setTimeout(() => {
                    connectWebSocket();
                }, 5000);
            };

            wsRef.current.onerror = (error) => {
                console.error('WebSocket error:', error);
                setConnectionStatus('error');
            };

        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
            setConnectionStatus('error');
        }
    }, [user]);

    const subscribeToAlerts = useCallback(async () => {
        if (!user || subscribed) return;

        try {
            // Get user's location (simplified - in reality would use geolocation API)
            const defaultLocation = { latitude: -1.2921, longitude: 36.8219 }; // Nairobi

            const response = await fetch('/api/alerts/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user.id,
                    latitude: defaultLocation.latitude,
                    longitude: defaultLocation.longitude,
                    radius_km: 50,
                    alert_types: ['early_warning', 'event_verified', 'high_risk', 'emergency', 'prediction'],
                    severity_threshold: 'low',
                    notification_methods: ['websocket']
                })
            });

            if (response.ok) {
                setSubscribed(true);
                console.log('Successfully subscribed to alerts');
            }
        } catch (error) {
            console.error('Error subscribing to alerts:', error);
        }
    }, [user, subscribed]);

    const playAlertSound = () => {
        // Create a simple beep sound for critical alerts
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    };

    const requestNotificationPermission = async () => {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    };

    useEffect(() => {
        if (user) {
            loadAlerts();
            loadAlertStats();
            requestNotificationPermission();
            subscribeToAlerts();
            connectWebSocket();

            // Set up polling as fallback (every 60 seconds)
            const interval = setInterval(() => {
                loadAlerts();
                loadAlertStats();
            }, 60000);

            return () => {
                clearInterval(interval);
                if (wsRef.current) {
                    wsRef.current.close();
                    wsRef.current = null;
                }
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                }
            };
        }
    }, [user, loadAlerts, loadAlertStats, subscribeToAlerts, connectWebSocket]);

    const loadAlerts = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/alerts/user/${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setAlerts(data.alerts || []);
            }
        } catch (error) {
            console.error('Error loading alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAlertStats = async () => {
        try {
            const response = await fetch('/api/alerts/stats');
            if (response.ok) {
                const data = await response.json();
                setAlertStats(data);
            }
        } catch (error) {
            console.error('Error loading alert stats:', error);
        }
    };

    const getSeverityColor = (severity) => {
        const colors = {
            low: 'bg-blue-100 text-blue-800 border-blue-200',
            medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            high: 'bg-orange-100 text-orange-800 border-orange-200',
            critical: 'bg-red-100 text-red-800 border-red-200'
        };
        return colors[severity] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getSeverityIcon = (severity) => {
        const icons = {
            low: '🔵',
            medium: '🟡',
            high: '🟠',
            critical: '🔴'
        };
        return icons[severity] || '⚪';
    };

    const getAlertTypeIcon = (alertType) => {
        const icons = {
            early_warning: '⚠️',
            event_verified: '✅',
            high_risk: '🚨',
            emergency: '🆘',
            prediction: '🔮'
        };
        return icons[alertType] || '📢';
    };

    const getConnectionStatusColor = () => {
        const colors = {
            connected: 'text-green-600',
            disconnected: 'text-red-600',
            error: 'text-red-600'
        };
        return colors[connectionStatus] || 'text-gray-600';
    };

    const getConnectionStatusIcon = () => {
        const icons = {
            connected: '🟢',
            disconnected: '🔴',
            error: '❌'
        };
        return icons[connectionStatus] || '⚪';
    };

    const formatTimeAgo = (dateString) => {
        const now = new Date();
        const alertTime = new Date(dateString);
        const diffInMinutes = Math.floor((now - alertTime) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    const isAlertExpired = (expiresAt) => {
        if (!expiresAt) return false;
        return new Date(expiresAt) < new Date();
    };

    const activeAlerts = alerts.filter(alert => !isAlertExpired(alert.expires_at));
    const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical');
    const highAlerts = activeAlerts.filter(alert => alert.severity === 'high');

    if (loading && alerts.length === 0) {
        return (
            <Card className="p-6">
                <div className="flex justify-center items-center h-32">
                    <LoadingSpinner size="md" />
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Alert Summary */}
            <Card className="p-4">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Climate Alerts</h3>
                    <div className="flex space-x-2">
                        {criticalAlerts.length > 0 && (
                            <Badge className="bg-red-100 text-red-800">
                                {criticalAlerts.length} Critical
                            </Badge>
                        )}
                        {highAlerts.length > 0 && (
                            <Badge className="bg-orange-100 text-orange-800">
                                {highAlerts.length} High
                            </Badge>
                        )}
                    </div>
                </div>

                {alertStats && (
                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        <div>
                            <div className="font-bold text-blue-600">{alertStats.active_alerts}</div>
                            <div className="text-gray-500">Active</div>
                        </div>
                        <div>
                            <div className="font-bold text-green-600">{alertStats.total_alerts}</div>
                            <div className="text-gray-500">Total</div>
                        </div>
                        <div>
                            <div className="font-bold text-purple-600">{alertStats.total_affected_users}</div>
                            <div className="text-gray-500">Users Notified</div>
                        </div>
                    </div>
                )}
            </Card>

            {/* Active Alerts */}
            {activeAlerts.length > 0 ? (
                <div className="space-y-3">
                    <AnimatePresence>
                        {activeAlerts.slice(0, 5).map((alert, index) => (
                            <motion.div
                                key={alert.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className={`p-4 border-l-4 ${getSeverityColor(alert.severity)}`}>
                                    <div className="flex items-start space-x-3">
                                        <div className="text-2xl">
                                            {getAlertTypeIcon(alert.alert_type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-medium text-gray-900 text-sm">
                                                    {alert.title}
                                                </h4>
                                                <div className="flex items-center space-x-2 ml-2">
                                                    <span className="text-lg">{getSeverityIcon(alert.severity)}</span>
                                                    <Badge className={`text-xs ${getSeverityColor(alert.severity)}`}>
                                                        {alert.severity.toUpperCase()}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                {alert.message}
                                            </p>
                                            <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                                                <span>{formatTimeAgo(alert.created_at)}</span>
                                                {alert.expires_at && (
                                                    <span>
                                                        Expires: {formatTimeAgo(alert.expires_at)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {activeAlerts.length > 5 && (
                        <div className="text-center">
                            <button className="text-sm text-blue-600 hover:text-blue-800">
                                View {activeAlerts.length - 5} more alerts
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <Card className="p-6 text-center">
                    <div className="text-gray-500">
                        <div className="text-4xl mb-2">🌤️</div>
                        <h4 className="text-lg font-medium text-gray-900 mb-2">All Clear</h4>
                        <p className="text-sm text-gray-600">
                            No active climate alerts in your area. We'll notify you of any developments.
                        </p>
                    </div>
                </Card>
            )}

            {/* Alert Types Legend */}
            <Card className="p-4">
                <h4 className="font-medium text-gray-900 mb-3 text-sm">Alert Types</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center space-x-2">
                        <span>⚠️</span>
                        <span className="text-gray-600">Early Warning</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span>✅</span>
                        <span className="text-gray-600">Event Verified</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span>🚨</span>
                        <span className="text-gray-600">High Risk</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span>🆘</span>
                        <span className="text-gray-600">Emergency</span>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AlertsWidget;