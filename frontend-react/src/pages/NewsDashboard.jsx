/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Newspaper,
  Users,
  Globe,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { apiClient } from '../services/apiClient';

const NewsDashboard = () => {
  const [stats, setStats] = useState({
    totalReports: 0,
    verifiedReports: 0,
    questionableReports: 0,
    debunkedReports: 0,
    pendingReports: 0,
    averageVerificationScore: 0,
    totalSources: 0,
    activeUsers: 0
  });
  const [recentReports, setRecentReports] = useState([]);
  const [integrityTrends, setIntegrityTrends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Load stats
      const statsResponse = await apiClient.get('/api/news/stats');
      setStats(statsResponse.data);

      // Load recent reports
      const reportsResponse = await apiClient.get('/api/news/reports/recent', {
        params: { limit: 10 }
      });
      setRecentReports(reportsResponse.data);

      // Load integrity trends (mock data for now)
      setIntegrityTrends([
        { date: '2024-01-01', verified: 45, questionable: 30, debunked: 15 },
        { date: '2024-01-02', verified: 52, questionable: 28, debunked: 12 },
        { date: '2024-01-03', verified: 48, questionable: 35, debunked: 18 },
        { date: '2024-01-04', verified: 61, questionable: 22, debunked: 8 },
        { date: '2024-01-05', verified: 55, questionable: 25, debunked: 14 },
        { date: '2024-01-06', verified: 58, questionable: 20, debunked: 11 },
        { date: '2024-01-07', verified: 63, questionable: 18, debunked: 9 }
      ]);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Get integrity level color
  const getIntegrityColor = (level) => {
    const colors = {
      verified: 'text-green-600 bg-green-100',
      questionable: 'text-yellow-600 bg-yellow-100',
      debunked: 'text-red-600 bg-red-100',
      pending: 'text-gray-600 bg-gray-100'
    };
    return colors[level] || 'text-gray-600 bg-gray-100';
  };

  // Get category emoji
  const getCategoryEmoji = (category) => {
    const emojis = {
      politics: '🏛️',
      economy: '💰',
      technology: '💻',
      health: '🏥',
      environment: '🌱',
      social: '👥',
      international: '📰',
      local: '🏠'
    };
    return emojis[category] || '📰';
  };

  // Calculate percentages
  const verifiedPercentage = stats.totalReports > 0 ? (stats.verifiedReports / stats.totalReports) * 100 : 0;
  const questionablePercentage = stats.totalReports > 0 ? (stats.questionableReports / stats.totalReports) * 100 : 0;
  const debunkedPercentage = stats.totalReports > 0 ? (stats.debunkedReports / stats.totalReports) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">News Integrity Dashboard</h1>
            </div>
            <button
              onClick={loadDashboardData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Newspaper className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Reports</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalReports.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Verified</p>
                    <p className="text-2xl font-bold text-green-600">{stats.verifiedReports.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{verifiedPercentage.toFixed(1)}% of total</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Questionable</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.questionableReports.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{questionablePercentage.toFixed(1)}% of total</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Shield className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Debunked</p>
                    <p className="text-2xl font-bold text-red-600">{stats.debunkedReports.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{debunkedPercentage.toFixed(1)}% of total</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Verification Score</p>
                    <p className="text-2xl font-bold text-gray-900">{(stats.averageVerificationScore * 100).toFixed(1)}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Sources</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalSources}</p>
                  </div>
                  <Globe className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeUsers.toLocaleString()}</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Charts and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Integrity Distribution */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Integrity Distribution</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-gray-700">Verified</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-2">{stats.verifiedReports}</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${verifiedPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-gray-700">Questionable</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-2">{stats.questionableReports}</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${questionablePercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-gray-700">Debunked</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-2">{stats.debunkedReports}</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${debunkedPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Reports */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {recentReports.map((report) => (
                    <div key={report.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <span className="text-lg">{getCategoryEmoji(report.category)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {report.title}
                          </p>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getIntegrityColor(report.integrity_level)}`}>
                            {report.integrity_level}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          {report.source} • {new Date(report.timestamp).toLocaleDateString()}
                        </p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Shield className="w-3 h-3 mr-1" />
                          Verification: {(report.verification_score * 100).toFixed(0)}%
                          {report.deepfake_probability > 0.5 && (
                            <span className="ml-2 text-red-600">
                              • High deepfake risk
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Integrity Trends Chart Placeholder */}
            <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Integrity Trends (Last 7 Days)</h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Interactive chart will be implemented with Chart.js or similar library</p>
                  <p className="text-sm mt-1">Showing verification trends over time</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NewsDashboard;