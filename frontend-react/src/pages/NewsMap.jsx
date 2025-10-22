/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Layers, Search, MapPin, Newspaper, Shield, AlertTriangle } from 'lucide-react';
import L from 'leaflet';
import { apiClient } from '../services/apiClient';

// Inject Leaflet CSS with modern styling
const leafletCSS = `
  .leaflet-container {
    height: 100%;
    width: 100%;
    z-index: 1;
    border-radius: 0.5rem;
  }
  .leaflet-popup-content-wrapper {
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  .leaflet-popup-tip {
    background: white;
  }
  .leaflet-control-zoom {
    border: none !important;
    border-radius: 8px !important;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important;
    background: white !important;
  }
  .leaflet-control-zoom a {
    border-radius: 6px !important;
    border: none !important;
    width: 32px !important;
    height: 32px !important;
    line-height: 32px !important;
    font-size: 18px !important;
    font-weight: bold !important;
    color: #1f2937 !important;
    transition: background-color 0.2s ease, transform 0.2s ease !important;
  }
  .leaflet-control-zoom a:hover {
    background: #3b82f6 !important;
    color: white !important;
    transform: scale(1.05) !important;
  }
  .leaflet-control-zoom a:first-child {
    border-radius: 6px 6px 2px 2px !important;
  }
  .leaflet-control-zoom a:last-child {
    border-radius: 2px 2px 6px 6px !important;
  }
  .leaflet-marker-icon {
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
  }
  .leaflet-div-icon {
    background: transparent !important;
    border: none !important;
  }
`;

// Inject CSS
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = leafletCSS;
  document.head.appendChild(styleElement);
}

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom news icons based on integrity level
const createNewsIcon = (integrityLevel, category) => {
  const colors = {
    verified: '#10b981',
    questionable: '#f59e0b',
    debunked: '#ef4444',
    pending: '#6b7280'
  };

  const categoryEmojis = {
    politics: '🏛️',
    economy: '💰',
    technology: '💻',
    health: '🏥',
    environment: '🌱',
    social: '👥',
    international: '🌍',
    local: '🏠'
  };

  const color = colors[integrityLevel] || '#6b7280';
  const emoji = categoryEmojis[category] || '📰';

  return L.divIcon({
    html: `
      <div style="
        width: 40px;
        height: 40px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        animation: ${integrityLevel === 'debunked' ? 'pulse 2s infinite' : 'none'};
      ">
        ${emoji}
      </div>
    `,
    className: 'custom-news-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

const NewsMap = () => {
  const [newsReports, setNewsReports] = useState([]);
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedIntegrity, setSelectedIntegrity] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState([20, 0]);
  const [mapZoom, setMapZoom] = useState(2);

  // Load news reports
  const loadNewsReports = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/api/news/sources');
      const sources = response.data.sources || [];

      // Load reports for each source
      const allReports = [];
      for (const source of sources.slice(0, 10)) { // Limit to first 10 sources for performance
        try {
          const reportsResponse = await apiClient.get(`/api/news/reports/${source}`, {
            params: { limit: 20 }
          });
          allReports.push(...reportsResponse.data);
        } catch (error) {
          console.error(`Failed to load reports for ${source}:`, error);
        }
      }

      setNewsReports(allReports);
    } catch (error) {
      console.error('Failed to load news sources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNewsReports();
  }, []);

  // Filter reports based on selections
  const filteredReports = useMemo(() => {
    return newsReports.filter(report => {
      const matchesSource = selectedSource === 'all' || report.source === selectedSource;
      const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
      const matchesIntegrity = selectedIntegrity === 'all' || report.integrity_level === selectedIntegrity;
      const matchesSearch = !searchQuery ||
        report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.source.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSource && matchesCategory && matchesIntegrity && matchesSearch && report.latitude && report.longitude;
    });
  }, [newsReports, selectedSource, selectedCategory, selectedIntegrity, searchQuery]);

  // Get unique values for filters
  const sources = [...new Set(newsReports.map(r => r.source))];
  const categories = [...new Set(newsReports.map(r => r.category))];
  const integrityLevels = [...new Set(newsReports.map(r => r.integrity_level))];

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
      international: '🌍',
      local: '🏠'
    };
    return emojis[category] || '📰';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Newspaper className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">News Integrity Map</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search news..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>

              {/* Source Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  News Source
                </label>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Sources</option>
                  {sources.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {getCategoryEmoji(category)} {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Integrity Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Integrity Level
                </label>
                <select
                  value={selectedIntegrity}
                  onChange={(e) => setSelectedIntegrity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Levels</option>
                  {integrityLevels.map(level => (
                    <option key={level} value={level}>
                      {level === 'verified' && '✅ '}
                      {level === 'questionable' && '⚠️ '}
                      {level === 'debunked' && '❌ '}
                      {level === 'pending' && '⏳ '}
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              {/* Legend */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Legend</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Verified</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Questionable</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Debunked</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Pending</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  <div className="flex justify-between mb-1">
                    <span>Total Reports:</span>
                    <span className="font-medium">{filteredReports.length}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Verified:</span>
                    <span className="font-medium text-green-600">
                      {filteredReports.filter(r => r.integrity_level === 'verified').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Questionable:</span>
                    <span className="font-medium text-yellow-600">
                      {filteredReports.filter(r => r.integrity_level === 'questionable').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="h-96 lg:h-[600px] rounded-lg overflow-hidden">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    style={{ height: '100%', width: '100%' }}
                    className="rounded-lg"
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {filteredReports.map((report) => (
                      <Marker
                        key={report.id}
                        position={[report.latitude, report.longitude]}
                        icon={createNewsIcon(report.integrity_level, report.category)}
                      >
                        <Popup>
                          <div className="p-3 max-w-sm">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                                {report.title}
                              </h3>
                              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getIntegrityColor(report.integrity_level)}`}>
                                {report.integrity_level}
                              </span>
                            </div>

                            <p className="text-gray-600 text-xs mb-3 line-clamp-3">
                              {report.content.substring(0, 150)}...
                            </p>

                            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                              <span>{getCategoryEmoji(report.category)} {report.category}</span>
                              <span>{report.source}</span>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">
                                {new Date(report.timestamp).toLocaleDateString()}
                              </span>
                              <div className="flex items-center">
                                <Shield className="w-3 h-3 mr-1" />
                                <span className="font-medium">
                                  {(report.verification_score * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>

                            {report.deepfake_probability > 0.5 && (
                              <div className="mt-2 flex items-center text-xs text-red-600">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                High deepfake risk: {(report.deepfake_probability * 100).toFixed(0)}%
                              </div>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsMap;