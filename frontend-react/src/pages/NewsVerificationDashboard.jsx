import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  Search,
  Filter,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ExternalLink,
  Calendar,
  MapPin,
  Newspaper,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { apiClient } from '../services/apiClient';

const NewsVerificationDashboard = () => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReports: 0,
    verifiedReports: 0,
    questionableReports: 0,
    debunkedReports: 0,
    pendingReports: 0
  });

  // Load reports and stats
  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load recent reports
      const reportsResponse = await apiClient.get('/api/news/reports/recent', {
        params: { limit: 50 }
      });
      setReports(reportsResponse.data);

      // Load global stats
      const statsResponse = await apiClient.get('/api/news/stats');
      setStats(statsResponse.data);

    } catch (error) {
      console.error('Failed to load verification data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter reports based on status and search
  const filteredReports = reports.filter(report => {
    const matchesFilter = filter === 'all' || report.integrity_level === filter;
    const matchesSearch = searchTerm === '' ||
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Handle verification action
  const handleVerification = async (reportId, verified) => {
    try {
      await apiClient.post(`/api/news/reports/${reportId}/verify`, {
        verified: verified
      });

      // Update local state
      setReports(reports.map(report =>
        report.id === reportId
          ? { ...report, integrity_level: verified ? 'verified' : 'questionable' }
          : report
      ));

      // Update stats
      loadData();

    } catch (error) {
      console.error('Failed to verify report:', error);
    }
  };

  // Get status color and icon
  const getStatusInfo = (status) => {
    switch (status) {
      case 'verified':
        return { color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle };
      case 'questionable':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: AlertTriangle };
      case 'debunked':
        return { color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle };
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: Clock };
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Shield className="w-8 h-8 text-blue-600 mr-3" />
                News Verification Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Review and verify community-submitted news reports
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 px-4 py-2 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Active Verifier</div>
                <div className="text-lg font-bold text-blue-800">Level 3</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
        >
          {[
            { label: 'Total Reports', value: stats.totalReports, icon: Newspaper, color: 'blue' },
            { label: 'Verified', value: stats.verifiedReports, icon: CheckCircle, color: 'green' },
            { label: 'Questionable', value: stats.questionableReports, icon: AlertTriangle, color: 'yellow' },
            { label: 'Debunked', value: stats.debunkedReports, icon: XCircle, color: 'red' },
            { label: 'Pending', value: stats.pendingReports, icon: Clock, color: 'gray' }
          ].map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="questionable">Questionable</option>
                <option value="debunked">Debunked</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                {filteredReports.length} of {reports.length} reports
              </span>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reports List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Reports to Review</h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading reports...</p>
                  </div>
                ) : filteredReports.length === 0 ? (
                  <div className="p-8 text-center">
                    <Newspaper className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No reports found matching your criteria.</p>
                  </div>
                ) : (
                  filteredReports.map((report) => {
                    const statusInfo = getStatusInfo(report.integrity_level);
                    return (
                      <motion.div
                        key={report.id}
                        variants={itemVariants}
                        className={`p-6 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedReport?.id === report.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                        onClick={() => setSelectedReport(report)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <statusInfo.icon className={`w-4 h-4 ${statusInfo.color}`} />
                              <span className={`text-sm font-medium ${statusInfo.color}`}>
                                {report.integrity_level.charAt(0).toUpperCase() + report.integrity_level.slice(1)}
                              </span>
                              <span className="text-sm text-gray-500">
                                {new Date(report.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">{report.title}</h3>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{report.content}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>Source: {report.source}</span>
                              <span>Score: {report.verification_score?.toFixed(2) || 'N/A'}</span>
                              {report.deepfake_probability && (
                                <span>Deepfake: {(report.deepfake_probability * 100).toFixed(1)}%</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Report Details */}
          <div className="lg:col-span-1">
            {selectedReport ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-6"
              >
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Report Details</h2>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      {React.createElement(getStatusInfo(selectedReport.integrity_level).icon, {
                        className: `w-5 h-5 ${getStatusInfo(selectedReport.integrity_level).color}`
                      })}
                      <span className={`font-medium ${getStatusInfo(selectedReport.integrity_level).color}`}>
                        {selectedReport.integrity_level.charAt(0).toUpperCase() + selectedReport.integrity_level.slice(1)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedReport.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{selectedReport.content}</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <Newspaper className="w-4 h-4 mr-2" />
                      Source: {selectedReport.source}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(selectedReport.timestamp).toLocaleString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Verification Score: {selectedReport.verification_score?.toFixed(2) || 'N/A'}
                    </div>
                    {selectedReport.deepfake_probability && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Eye className="w-4 h-4 mr-2" />
                        Deepfake Risk: {(selectedReport.deepfake_probability * 100).toFixed(1)}%
                      </div>
                    )}
                    {selectedReport.url && (
                      <div className="flex items-center text-sm text-gray-600">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        <a href={selectedReport.url} target="_blank" rel="noopener noreferrer"
                           className="text-blue-600 hover:underline">View Original</a>
                      </div>
                    )}
                  </div>

                  {/* Verification Actions */}
                  {selectedReport.integrity_level === 'pending' && (
                    <div className="space-y-3">
                      <button
                        onClick={() => handleVerification(selectedReport.id, true)}
                        className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <ThumbsUp className="w-4 h-4 mr-2" />
                        Verify as Authentic
                      </button>
                      <button
                        onClick={() => handleVerification(selectedReport.id, false)}
                        className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <ThumbsDown className="w-4 h-4 mr-2" />
                        Mark as Questionable
                      </button>
                    </div>
                  )}

                  {selectedReport.integrity_level !== 'pending' && (
                    <div className="text-center text-sm text-gray-500">
                      This report has already been reviewed
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Report</h3>
                <p className="text-gray-600">Choose a report from the list to view details and verification options.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsVerificationDashboard;