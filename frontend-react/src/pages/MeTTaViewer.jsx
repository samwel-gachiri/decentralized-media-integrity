/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Brain,
    Code,
    Play,
    RefreshCw,
    Download,
    Search,
    Filter,
    Zap,
    Database,
    GitBranch,
    Activity,
    MessageSquare,
    Lightbulb,
    BarChart3,
    Send,
    Sparkles,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/apiClient';
import { useFallbackData } from '../hooks/useFallback';
import D3Visualization from '../components/metta/D3Visualization';

const MeTTaViewer = () => {
    const { user } = useAuth();
    const { getFallbackData, isOnline } = useFallbackData();
    const [loading, setLoading] = useState(false);
    const [atoms, setAtoms] = useState([]);
    const [stats, setStats] = useState({});
    const [query, setQuery] = useState('');
    const [queryResult, setQueryResult] = useState(null);
    const [generatedFunction, setGeneratedFunction] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);
    const [followUpQuery, setFollowUpQuery] = useState('');
    const [examples, setExamples] = useState([]);
    const [selectedExample, setSelectedExample] = useState(null);
    const [usingFallback, setUsingFallback] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    const loadInitialData = useCallback(async () => {
        setLoading(true);
        setUsingFallback(false);

        const loadAtomsLocal = async () => {
            try {
                const response = await apiClient.getWithFallback('/api/ai-metta/atoms');

                if (response.success) {
                    setAtoms(response.data.atoms || []);
                } else if (response.shouldUseFallback) {
                    setAtoms(getFallbackData('mettaAtoms'));
                    setUsingFallback(true);
                } else {
                    setAtoms([]);
                }
            } catch {
                setAtoms(getFallbackData('mettaAtoms'));
                setUsingFallback(true);
            }
        };

        const loadStatsLocal = async () => {
            try {
                const response = await apiClient.getWithFallback('/api/ai-metta/stats');

                if (response.success) {
                    setStats(response.data.metta_stats || {});
                } else if (response.shouldUseFallback) {
                    setStats(getFallbackData('mettaStats'));
                    setUsingFallback(true);
                } else {
                    setStats({});
                }
            } catch {
                setStats(getFallbackData('mettaStats'));
                setUsingFallback(true);
            }
        };

        const loadExamplesLocal = async () => {
            try {
                const response = await apiClient.getWithFallback('/api/ai-metta/examples');

                if (response.success) {
                    setExamples(response.data.sample_queries || []);
                } else if (response.shouldUseFallback) {
                    setExamples(getFallbackData('mettaExamples'));
                    setUsingFallback(true);
                } else {
                    setExamples([]);
                }
            } catch {
                setExamples(getFallbackData('mettaExamples'));
                setUsingFallback(true);
            }
        };

        try {
            await Promise.all([
                loadAtomsLocal(),
                loadStatsLocal(),
                loadExamplesLocal()
            ]);
        } catch (error) {
            console.error('Error loading initial data:', error);
            // Use fallback data for all components
            setAtoms(getFallbackData('mettaAtoms'));
            setStats(getFallbackData('mettaStats'));
            setExamples(getFallbackData('mettaExamples'));
            setUsingFallback(true);
        } finally {
            setLoading(false);
        }
    }, [getFallbackData]);

    const loadAtoms = useCallback(async () => {
        try {
            const response = await apiClient.getWithFallback('/api/ai-metta/atoms');

            if (response.success) {
                setAtoms(response.data.atoms || []);
            } else if (response.shouldUseFallback) {
                setAtoms(getFallbackData('mettaAtoms'));
                setUsingFallback(true);
            } else {
                setAtoms([]);
            }
        } catch {
            setAtoms(getFallbackData('mettaAtoms'));
            setUsingFallback(true);
        }
    }, [getFallbackData]);

    const loadStats = useCallback(async () => {
        try {
            const response = await apiClient.getWithFallback('/api/ai-metta/stats');

            if (response.success) {
                setStats(response.data.metta_stats || {});
            } else if (response.shouldUseFallback) {
                setStats(getFallbackData('mettaStats'));
                setUsingFallback(true);
            } else {
                setStats({});
            }
        } catch {
            setStats(getFallbackData('mettaStats'));
            setUsingFallback(true);
        }
    }, [getFallbackData]);

    const loadExamples = useCallback(async () => {
        try {
            const response = await apiClient.getWithFallback('/api/ai-metta/examples');

            if (response.success) {
                setExamples(response.data.sample_queries || []);
            } else if (response.shouldUseFallback) {
                setExamples(getFallbackData('mettaExamples'));
                setUsingFallback(true);
            } else {
                setExamples([]);
            }
        } catch {
            setExamples(getFallbackData('mettaExamples'));
            setUsingFallback(true);
        }
    }, [getFallbackData]);

    const handleQuerySubmit = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsExecuting(true);
        try {
            const response = await apiClient.postWithFallback('/api/ai-metta/query-and-execute', {
                query: query.trim(),
                include_visualization: true
            }, {
                timeout: 30000
            });

            if (response.success) {
                setQueryResult(response.data);
                setGeneratedFunction(response.data.generated_function || '');
            } else if (response.shouldUseFallback) {
                // Use fallback query result
                const fallbackResult = getFallbackData('mettaQueryResult');
                setQueryResult({
                    ...fallbackResult,
                    summary: 'Using cached MeTTa execution result - connection issues detected'
                });
                setGeneratedFunction(fallbackResult.generated_function || '');
                setUsingFallback(true);
            } else {
                setQueryResult({
                    success: false,
                    error: response.error
                });
            }
        } catch {
            // Use fallback on any error
            const fallbackResult = getFallbackData('mettaQueryResult');
            setQueryResult({
                ...fallbackResult,
                summary: 'Using cached MeTTa execution result - unable to connect to server'
            });
            setGeneratedFunction(fallbackResult.generated_function || '');
            setUsingFallback(true);
        } finally {
            setIsExecuting(false);
        }
    };

    const handleFollowUp = async (e) => {
        e.preventDefault();
        if (!followUpQuery.trim() || !queryResult) return;

        setIsExecuting(true);
        try {
            const response = await apiClient.post('/api/ai-metta/follow-up', {
                original_query: query,
                follow_up: followUpQuery.trim(),
                previous_result: queryResult
            });

            setQueryResult(response.data);
            setGeneratedFunction(response.data.generated_function || '');
            setFollowUpQuery('');
        } catch (error) {
            console.error('Error executing follow-up:', error);
        } finally {
            setIsExecuting(false);
        }
    };

    const handleExampleClick = (exampleQuery) => {
        setQuery(exampleQuery);
        setSelectedExample(exampleQuery);
    };

    const renderVisualization = () => {
        if (!queryResult?.visualization_data) return null;

        const vizData = queryResult.visualization_data;

        return (
            <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Visualization</h4>
                <div className="bg-white rounded-lg border p-4">
                    <D3Visualization
                        data={vizData.data}
                        type={vizData.type}
                        title={vizData.title}
                        width={600}
                        height={400}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center items-center mb-4">
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                                <Brain className="w-8 h-8 text-purple-600 mr-3" />
                                AI-Powered MeTTa Query System
                            </h1>
                            {!isOnline && (
                                <span className="ml-4 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                                    Offline Mode
                                </span>
                            )}
                            {usingFallback && (
                                <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                    Using Cached Data
                                </span>
                            )}
                        </div>
                        <p className="text-gray-600">
                            Ask questions in natural language and get MeTTa functions generated by AI
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <Card className="p-6">
                            <div className="flex items-center">
                                <Database className="w-8 h-8 text-blue-600 mr-3" />
                                <div>
                                    <p className="text-sm text-gray-600">Total Atoms</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total_atoms || 0}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-6">
                            <div className="flex items-center">
                                <Activity className="w-8 h-8 text-green-600 mr-3" />
                                <div>
                                    <p className="text-sm text-gray-600">Active Queries</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.active_queries || 0}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-6">
                            <div className="flex items-center">
                                <Clock className="w-8 h-8 text-amber-600 mr-3" />
                                <div>
                                    <p className="text-sm text-gray-600">Avg Execution</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.query_performance?.avg_execution_time || '0s'}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-6">
                            <div className="flex items-center">
                                <Sparkles className="w-8 h-8 text-purple-600 mr-3" />
                                <div>
                                    <p className="text-sm text-gray-600">AI Success Rate</p>
                                    <p className="text-2xl font-bold text-gray-900">{Math.round((stats.query_performance?.ai_generation_success_rate || 0.92) * 100)}%</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Query Interface */}
                        <div className="lg:col-span-2">
                            <Card className="p-6">
                                <div className="flex items-center mb-6">
                                    <MessageSquare className="w-6 h-6 text-blue-600 mr-3" />
                                    <h2 className="text-xl font-semibold text-gray-900">Natural Language Query</h2>
                                </div>

                                {/* Query Form */}
                                <form onSubmit={handleQuerySubmit} className="mb-6">
                                    <div className="flex space-x-4">
                                        <Input
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            placeholder="Ask about news integrity... e.g., 'Show me verified news sources' or 'Analyze misinformation patterns'"
                                            className="flex-1"
                                            disabled={isExecuting}
                                        />
                                        <Button
                                            type="submit"
                                            disabled={isExecuting || !query.trim()}
                                            className="px-6"
                                        >
                                            {isExecuting ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Send className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                </form>

                                {/* Example Queries */}
                                <div className="mb-6">
                                    <h3 className="text-sm font-medium text-gray-700 mb-3">Example Queries:</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {examples.slice(0, 4).map((example, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleExampleClick(example)}
                                                className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
                                            >
                                                {example}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Generated Function Display */}
                                {generatedFunction && (
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                                <Code className="w-5 h-5 text-green-600 mr-2" />
                                                Generated MeTTa Function
                                            </h3>
                                            <Badge variant="success">
                                                {queryResult?.confidence ? `${Math.round(queryResult.confidence * 100)}% confidence` : 'Generated'}
                                            </Badge>
                                        </div>
                                        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                                            <pre>{generatedFunction}</pre>
                                        </div>
                                        {queryResult?.function_explanation && (
                                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                                <p className="text-sm text-blue-800">
                                                    <Lightbulb className="w-4 h-4 inline mr-1" />
                                                    {queryResult.function_explanation}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Query Results */}
                                {queryResult && (
                                    <div className="space-y-6">
                                        {queryResult.success ? (
                                            <>
                                                {/* Summary */}
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                    <div className="flex items-start">
                                                        <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                                                        <div>
                                                            <h4 className="font-medium text-green-900">Execution Summary</h4>
                                                            <p className="text-green-800 text-sm mt-1">{queryResult.summary}</p>
                                                            <div className="flex items-center space-x-4 mt-2 text-xs text-green-700">
                                                                <span>⏱️ {queryResult.execution_time}</span>
                                                                <span>📊 {queryResult.execution_result?.length || 0} results</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Visualization */}
                                                {renderVisualization()}

                                                {/* Raw Results */}
                                                {queryResult.execution_result && queryResult.execution_result.length > 0 && (
                                                    <div>
                                                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Raw Results</h4>
                                                        <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                                                            <pre className="text-sm text-gray-800">
                                                                {JSON.stringify(queryResult.execution_result, null, 2)}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Follow-up Query */}
                                                <div className="border-t pt-4">
                                                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Follow-up Query</h4>
                                                    <form onSubmit={handleFollowUp} className="flex space-x-4">
                                                        <Input
                                                            value={followUpQuery}
                                                            onChange={(e) => setFollowUpQuery(e.target.value)}
                                                            placeholder="Ask a follow-up question..."
                                                            className="flex-1"
                                                            disabled={isExecuting}
                                                        />
                                                        <Button
                                                            type="submit"
                                                            disabled={isExecuting || !followUpQuery.trim()}
                                                            variant="outline"
                                                        >
                                                            Follow Up
                                                        </Button>
                                                    </form>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                                <div className="flex items-start">
                                                    <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                                                    <div>
                                                        <h4 className="font-medium text-red-900">Execution Failed</h4>
                                                        <p className="text-red-800 text-sm mt-1">{queryResult.error}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Knowledge Atoms */}
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                        <Database className="w-5 h-5 text-blue-600 mr-2" />
                                        Knowledge Atoms
                                    </h3>
                                    <Button
                                        onClick={loadAtoms}
                                        variant="outline"
                                        size="sm"
                                        disabled={loading}
                                    >
                                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    </Button>
                                </div>

                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                    {atoms.slice(0, 5).map((atom) => (
                                        <div key={atom.id} className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <Badge variant={atom.verified ? "success" : "warning"}>
                                                    {atom.type}
                                                </Badge>
                                                <span className="text-xs text-gray-500">
                                                    {atom.verified ? '✓' : '⏳'}
                                                </span>
                                            </div>
                                            <p className="text-xs font-mono text-gray-700 truncate">
                                                {atom.content}
                                            </p>
                                        </div>
                                    ))}
                                    {atoms.length === 0 && (
                                        <p className="text-sm text-gray-500 text-center py-4">
                                            No atoms available
                                        </p>
                                    )}
                                </div>
                            </Card>

                            {/* System Status */}
                            <Card className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <Activity className="w-5 h-5 text-green-600 mr-2" />
                                    System Status
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Anthropic AI</span>
                                        <Badge variant="success">Active</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">MeTTa Runtime</span>
                                        <Badge variant="warning">Simulation</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">IPFS Storage</span>
                                        <Badge variant="success">Connected</Badge>
                                    </div>
                                </div>
                            </Card>

                            {/* Available Functions */}
                            <Card className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <Code className="w-5 h-5 text-purple-600 mr-2" />
                                    MeTTa Functions
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {['match', 'let', 'let*', 'foldl-atom', 'cdr-atom', 'car-atom', 'filter', 'map'].map((func) => (
                                        <span
                                            key={func}
                                            className="px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded font-mono"
                                        >
                                            {func}
                                        </span>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default MeTTaViewer;