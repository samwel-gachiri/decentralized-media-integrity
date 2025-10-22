import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Wallet,
    Copy,
    ExternalLink,
    RefreshCw,
    TrendingUp,
    DollarSign,
    History,
    AlertCircle,
    CheckCircle,
    Zap
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

const WalletDisplay = ({
    address,
    balance = 0,
    onConnect,
    onDisconnect,
    earnings = [],
    isLoading = false,
    className = ''
}) => {
    const [copied, setCopied] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const formatAddress = (addr) => {
        if (!addr) return 'Not connected';
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const formatBalance = (bal) => {
        return parseFloat(bal || 0).toFixed(4);
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const refreshBalance = async () => {
        setIsRefreshing(true);
        // Simulate refresh delay
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1500);
    };

    const getTotalEarnings = () => {
        return earnings.reduce((total, earning) => total + (earning.amount || 0), 0);
    };

    const getRecentEarnings = () => {
        return earnings
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Main Wallet Card */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <Wallet className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Blockchain Wallet</h2>
                            <p className="text-gray-600">Manage your crypto earnings</p>
                        </div>
                    </div>

                    {address && (
                        <Button
                            onClick={refreshBalance}
                            variant="outline"
                            size="sm"
                            disabled={isRefreshing}
                            className="flex items-center space-x-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                        </Button>
                    )}
                </div>

                {address ? (
                    <div className="space-y-6">
                        {/* Wallet Address */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <div>
                                    <p className="text-sm text-gray-600">Wallet Address</p>
                                    <p className="font-mono text-gray-900">{formatAddress(address)}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Button
                                    onClick={() => copyToClipboard(address)}
                                    variant="ghost"
                                    size="sm"
                                    className="flex items-center space-x-1"
                                >
                                    {copied ? (
                                        <>
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            <span className="text-green-600">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            <span>Copy</span>
                                        </>
                                    )}
                                </Button>

                                <Button
                                    onClick={() => window.open(`https://mumbai.polygonscan.com/address/${address}`, '_blank')}
                                    variant="ghost"
                                    size="sm"
                                    className="flex items-center space-x-1"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    <span>View</span>
                                </Button>
                            </div>
                        </div>

                        {/* Balance Display */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                                <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full mx-auto mb-3">
                                    <DollarSign className="w-6 h-6 text-white" />
                                </div>
                                <p className="text-3xl font-bold text-blue-600">
                                    {isLoading ? (
                                        <div className="animate-pulse bg-blue-200 h-8 w-24 rounded mx-auto"></div>
                                    ) : (
                                        `${formatBalance(balance)} ETH`
                                    )}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">Current Balance</p>
                            </div>

                            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                                <div className="flex items-center justify-center w-12 h-12 bg-green-600 rounded-full mx-auto mb-3">
                                    <TrendingUp className="w-6 h-6 text-white" />
                                </div>
                                <p className="text-3xl font-bold text-green-600">
                                    {formatBalance(getTotalEarnings())} ETH
                                </p>
                                <p className="text-sm text-gray-600 mt-1">Total Earnings</p>
                            </div>
                        </div>

                        {/* Disconnect Button */}
                        <div className="flex justify-center pt-4">
                            <Button
                                onClick={onDisconnect}
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                                Disconnect Wallet
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* Connect Wallet */
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Wallet className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Connect Your Wallet
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            Connect your blockchain wallet to receive payments for verified news reports.
                        </p>
                        <Button
                            onClick={onConnect}
                            disabled={isLoading}
                            className="flex items-center space-x-2"
                        >
                            <Wallet className="w-4 h-4" />
                            <span>{isLoading ? 'Connecting...' : 'Connect Wallet'}</span>
                        </Button>
                    </div>
                )}
            </Card>

            {/* Earnings History */}
            {address && earnings.length > 0 && (
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold flex items-center space-x-2">
                            <History className="w-5 h-5 text-gray-600" />
                            <span>Recent Earnings</span>
                        </h3>
                        <Badge variant="secondary">
                            {earnings.length} transactions
                        </Badge>
                    </div>

                    <div className="space-y-3">
                        {getRecentEarnings().map((earning, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <Zap className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            Event Verification Reward
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {formatDate(earning.timestamp)}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="font-bold text-green-600">
                                        +{formatBalance(earning.amount)} ETH
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {earning.eventType || 'News Report'}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {earnings.length > 5 && (
                        <div className="text-center mt-4">
                            <Button variant="outline" size="sm">
                                View All Transactions
                            </Button>
                        </div>
                    )}
                </Card>
            )}

            {/* Wallet Info */}
            <Card className="p-6">
                <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-2">About Your Wallet</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                            <p>• Your wallet is connected to the Polygon Mumbai testnet</p>
                            <p>• Earnings are automatically sent when events are verified</p>
                            <p>• You can view all transactions on the blockchain explorer</p>
                            <p>• Keep your wallet secure and never share your private keys</p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default WalletDisplay;