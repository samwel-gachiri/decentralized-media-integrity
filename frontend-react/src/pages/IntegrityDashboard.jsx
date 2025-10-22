import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import {
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Globe,
  Users,
  Newspaper,
  Eye,
  Target,
  Zap
} from 'lucide-react';
import { apiClient } from '../services/apiClient';

const IntegrityDashboard = () => {
  const [integrityData, setIntegrityData] = useState({
    globalStats: {},
    sourceAnalysis: [],
    trends: [],
    alerts: []
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);

  // Load integrity data
  const loadIntegrityData = async () => {
    try {
      setIsLoading(true);

      // Load global stats
      const statsResponse = await apiClient.get('/api/news/stats');
      setIntegrityData(prev => ({
        ...prev,
        globalStats: statsResponse.data
      }));

      // Load sources
      const sourcesResponse = await apiClient.get('/api/news/sources');
      const sources = sourcesResponse.data.sources || [];

      // Load analysis for each source
      const sourceAnalysis = [];
      for (const source of sources.slice(0, 10)) { // Limit to top 10 sources
        try {
          const analysisResponse = await apiClient.get(`/api/news/analysis/${source}`);
          sourceAnalysis.push({
            source,
            ...analysisResponse.data
          });
        } catch (error) {
          console.warn(`Failed to load analysis for ${source}:`, error);
        }
      }

      setIntegrityData(prev => ({
        ...prev,
        sourceAnalysis
      }));

    } catch (error) {
      console.error('Failed to load integrity data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIntegrityData();
  }, [selectedTimeframe]);

  // Calculate integrity metrics
  const calculateIntegrityScore = () => {
    const { globalStats } = integrityData;
    if (!globalStats.totalReports) return 0;

    const verifiedRatio = globalStats.verifiedReports / globalStats.totalReports;
    const questionableRatio = globalStats.questionableReports / globalStats.totalReports;
    const debunkedRatio = globalStats.debunkedReports / globalStats.totalReports;

    return ((verifiedRatio * 1.0) + (questionableRatio * 0.5) + (debunkedRatio * 0.0)) * 100;
  };

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

  const integrityScore = calculateIntegrityScore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Shield className="w-8 h-8 text-blue-600 mr-3" />
                News Integrity Analytics
              </h1>
              <p className="text-gray-600 mt-1">
                Real-time analysis of news integrity across sources and time
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Global Integrity Score</p>
                <p className="text-3xl font-bold text-gray-900">{integrityScore.toFixed(1)}%</p>
                <div className="flex items-center mt-2">
                  {integrityScore >= 70 ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                  ) : integrityScore >= 50 ? (
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mr-1" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className="text-sm text-gray-600">
                    {integrityScore >= 70 ? 'Healthy' : integrityScore >= 50 ? 'Moderate' : 'Critical'}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sources</p>
                <p className="text-3xl font-bold text-gray-900">{integrityData.sourceAnalysis.length}</p>
                <p className="text-sm text-gray-600 mt-2">Monitored news sources</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <Globe className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verification Rate</p>
                <p className="text-3xl font-bold text-gray-900">
                  {integrityData.globalStats.totalReports ?
                    ((integrityData.globalStats.verifiedReports / integrityData.globalStats.totalReports) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-sm text-gray-600 mt-2">Reports verified</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AI Detections</p>
                <p className="text-3xl font-bold text-gray-900">
                  {integrityData.globalStats.questionableReports + integrityData.globalStats.debunkedReports}
                </p>
                <p className="text-sm text-gray-600 mt-2">Potential issues flagged</p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <Zap className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Source Integrity Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Source Credibility Rankings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                Source Credibility Rankings
              </h2>
            </div>
            <div className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-2 bg-gray-200 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              ) : integrityData.sourceAnalysis.length === 0 ? (
                <div className="text-center py-8">
                  <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No source data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {integrityData.sourceAnalysis
                    .sort((a, b) => (b.credibility_score || 0) - (a.credibility_score || 0))
                    .slice(0, 10)
                    .map((source, index) => (
                      <div key={source.source} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{source.source}</p>
                            <p className="text-sm text-gray-600">
                              {source.total_reports || 0} reports
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${(source.credibility_score || 0) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {((source.credibility_score || 0) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Integrity Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-green-600" />
                Integrity Distribution
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[
                  {
                    label: 'Verified',
                    count: integrityData.globalStats.verifiedReports || 0,
                    color: 'bg-green-500',
                    icon: CheckCircle
                  },
                  {
                    label: 'Questionable',
                    count: integrityData.globalStats.questionableReports || 0,
                    color: 'bg-yellow-500',
                    icon: AlertTriangle
                  },
                  {
                    label: 'Debunked',
                    count: integrityData.globalStats.debunkedReports || 0,
                    color: 'bg-red-500',
                    icon: XCircle
                  },
                  {
                    label: 'Pending',
                    count: integrityData.globalStats.pendingReports || 0,
                    color: 'bg-gray-500',
                    icon: Clock
                  }
                ].map((item) => {
                  const percentage = integrityData.globalStats.totalReports ?
                    (item.count / integrityData.globalStats.totalReports) * 100 : 0;

                  return (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <item.icon className={`w-4 h-4 ${
                          item.label === 'Verified' ? 'text-green-500' :
                          item.label === 'Questionable' ? 'text-yellow-500' :
                          item.label === 'Debunked' ? 'text-red-500' : 'text-gray-500'
                        }`} />
                        <span className="text-sm font-medium text-gray-900">{item.label}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${item.color}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {integrityData.globalStats.totalReports || 0}
                  </p>
                  <p className="text-sm text-gray-600">Total Reports Analyzed</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Alerts & Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Integrity Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                Recent Integrity Alerts
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {/* Mock alerts - in real app, these would come from API */}
                {[
                  {
                    source: 'sensational-news.com',
                    alert: 'Multiple debunked reports in 24h',
                    severity: 'high',
                    time: '2 hours ago'
                  },
                  {
                    source: 'trusted-source.org',
                    alert: 'Unusual verification pattern detected',
                    severity: 'medium',
                    time: '4 hours ago'
                  },
                  {
                    source: 'independent-press.net',
                    alert: 'Source credibility improved',
                    severity: 'low',
                    time: '6 hours ago'
                  }
                ].map((alert, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                    <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                      alert.severity === 'high' ? 'text-red-500' :
                      alert.severity === 'medium' ? 'text-yellow-500' : 'text-green-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{alert.source}</p>
                      <p className="text-sm text-gray-600">{alert.alert}</p>
                      <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Integrity Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-purple-600" />
                Integrity Trends
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[
                  {
                    metric: 'Average Verification Score',
                    value: integrityData.globalStats.averageVerificationScore?.toFixed(2) || '0.00',
                    change: '+2.1%',
                    trend: 'up',
                    icon: TrendingUp
                  },
                  {
                    metric: 'Deepfake Detection Rate',
                    value: '3.2%',
                    change: '-0.5%',
                    trend: 'down',
                    icon: TrendingDown
                  },
                  {
                    metric: 'Community Participation',
                    value: `${integrityData.globalStats.activeUsers || 0} users`,
                    change: '+15.3%',
                    trend: 'up',
                    icon: Users
                  },
                  {
                    metric: 'Response Time',
                    value: '2.4 min',
                    change: '-8.2%',
                    trend: 'down',
                    icon: Activity
                  }
                ].map((trend, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <trend.icon className={`w-4 h-4 ${
                        trend.trend === 'up' ? 'text-green-500' : 'text-red-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{trend.metric}</p>
                        <p className="text-xs text-gray-600">{trend.change} from last period</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{trend.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default IntegrityDashboard;