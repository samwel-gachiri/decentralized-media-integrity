import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';

const ImpactVisualization = ({ eventId, impactData }) => {
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (impactData) {
            processChartData(impactData);
        }
    }, [impactData]);

    const processChartData = (data) => {
        setLoading(true);

        // Process data for visualization
        const processedData = {
            impactTypes: data.predictions?.map(p => ({
                type: p.impact_type,
                probability: p.probability,
                cost: p.estimated_cost,
                recoveryTime: p.estimated_recovery_time
            })) || [],
            riskDistribution: calculateRiskDistribution(data.predictions || []),
            costBreakdown: calculateCostBreakdown(data.predictions || [])
        };

        setChartData(processedData);
        setLoading(false);
    };

    const calculateRiskDistribution = (predictions) => {
        const distribution = { low: 0, medium: 0, high: 0, critical: 0 };

        predictions.forEach(prediction => {
            if (prediction.probability <= 0.3) distribution.low++;
            else if (prediction.probability <= 0.6) distribution.medium++;
            else if (prediction.probability <= 0.8) distribution.high++;
            else distribution.critical++;
        });

        return distribution;
    };

    const calculateCostBreakdown = (predictions) => {
        return predictions.map(p => ({
            type: p.impact_type,
            cost: p.estimated_cost,
            percentage: 0 // Will be calculated based on total
        }));
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getImpactColor = (impactType) => {
        const colors = {
            crop_failure: '#10B981',
            livestock_death: '#F59E0B',
            infrastructure_damage: '#EF4444',
            water_scarcity: '#3B82F6',
            economic_loss: '#8B5CF6'
        };
        return colors[impactType] || '#6B7280';
    };

    const getRiskColor = (level) => {
        const colors = {
            low: '#10B981',
            medium: '#F59E0B',
            high: '#EF4444',
            critical: '#DC2626'
        };
        return colors[level] || '#6B7280';
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!chartData || !chartData.impactTypes.length) {
        return (
            <Card className="p-8 text-center">
                <div className="text-gray-500">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Visualization Data</h3>
                    <p>Impact visualization will appear here once analysis is complete.</p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Impact Probability Chart */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Impact Probability Analysis</h3>
                <div className="space-y-4">
                    {chartData.impactTypes.map((impact, index) => (
                        <motion.div
                            key={impact.type}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center space-x-4"
                        >
                            <div className="w-32 text-sm font-medium text-gray-700">
                                {impact.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>Probability</span>
                                    <span>{Math.round(impact.probability * 100)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <motion.div
                                        className="h-3 rounded-full"
                                        style={{ backgroundColor: getImpactColor(impact.type) }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${impact.probability * 100}%` }}
                                        transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 }}
                                    />
                                </div>
                            </div>
                            <div className="w-24 text-right text-sm font-medium text-gray-900">
                                {formatCurrency(impact.cost)}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </Card>

            {/* Risk Distribution */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Level Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(chartData.riskDistribution).map(([level, count], index) => (
                        <motion.div
                            key={level}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="text-center"
                        >
                            <div
                                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white font-bold text-xl mb-2"
                                style={{ backgroundColor: getRiskColor(level) }}
                            >
                                {count}
                            </div>
                            <div className="text-sm font-medium text-gray-700 capitalize">{level}</div>
                            <div className="text-xs text-gray-500">
                                {count === 1 ? 'Impact' : 'Impacts'}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </Card>

            {/* Cost Breakdown */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Estimated Cost Breakdown</h3>
                <div className="space-y-3">
                    {chartData.costBreakdown
                        .sort((a, b) => b.cost - a.cost)
                        .map((item, index) => {
                            const totalCost = chartData.costBreakdown.reduce((sum, i) => sum + i.cost, 0);
                            const percentage = totalCost > 0 ? (item.cost / totalCost) * 100 : 0;

                            return (
                                <motion.div
                                    key={item.type}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div
                                            className="w-4 h-4 rounded"
                                            style={{ backgroundColor: getImpactColor(item.type) }}
                                        />
                                        <span className="font-medium text-gray-900">
                                            {item.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold text-gray-900">
                                            {formatCurrency(item.cost)}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {percentage.toFixed(1)}%
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                </div>

                {/* Total */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Total Estimated Cost</span>
                        <span className="text-xl font-bold text-red-600">
                            {formatCurrency(chartData.costBreakdown.reduce((sum, item) => sum + item.cost, 0))}
                        </span>
                    </div>
                </div>
            </Card>

            {/* Recovery Timeline */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recovery Timeline</h3>
                <div className="space-y-4">
                    {chartData.impactTypes
                        .sort((a, b) => b.recoveryTime - a.recoveryTime)
                        .map((impact, index) => (
                            <motion.div
                                key={impact.type}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                            >
                                <div className="flex items-center space-x-3">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: getImpactColor(impact.type) }}
                                    />
                                    <span className="font-medium text-gray-900">
                                        {impact.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold text-gray-900">
                                        {impact.recoveryTime} days
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {Math.round(impact.recoveryTime / 30)} months
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                </div>
            </Card>
        </div>
    );
};

export default ImpactVisualization;