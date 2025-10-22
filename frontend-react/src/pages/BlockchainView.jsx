import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, DollarSign, Shield, TrendingUp, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const BlockchainView = () => {
    const { user } = useAuth();
    const [walletAddress, setWalletAddress] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [balance, setBalance] = useState('0.000');
    const [totalEarned, setTotalEarned] = useState('0.000');
    const [pendingPayouts, setPendingPayouts] = useState('0.000');
    const [transactions, setTransactions] = useState([]);
    const [copied, setCopied] = useState(false);

    // Mock data
    const mockTransactions = [
        {
            id: '0x1234...5678',
            type: 'reward',
            amount: '0.005',
            status: 'confirmed',
            timestamp: '2024-01-20T10:30:00Z',
            description: 'Event verification reward',
            hash: '0x1234567890abcdef1234567890abcdef12345678'
        },
        {
            id: '0x2345...6789',
            type: 'payout',
            amount: '0.003',
            status: 'pending',
            timestamp: '2024-01-19T15:45:00Z',
            description: 'News verification reward',
            hash: '0x2345678901bcdef12345678901bcdef123456789'
        }
    ];

    useEffect(() => {
        // Load user's blockchain data
        if (user) {
            setTotalEarned(user.totalEarnings || '0.000');
            setPendingPayouts(user.pendingPayouts || '0.000');
            setTransactions(mockTransactions);

            // Check if wallet is already connected
            if (user.walletAddress) {
                setWalletAddress(user.walletAddress);
            }
        }
    }, [user]);

    const connectWallet = async () => {
        setIsConnecting(true);
        try {
            // Check if MetaMask is installed
            if (typeof window.ethereum !== 'undefined') {
                // Request account access
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });

                if (accounts.length > 0) {
                    const address = accounts[0];
                    setWalletAddress(address);

                    // Get balance
                    const balance = await window.ethereum.request({
                        method: 'eth_getBalance',
                        params: [address, 'latest']
                    });

                    // Convert from wei to ETH
                    const ethBalance = (parseInt(balance, 16) / Math.pow(10, 18)).toFixed(3);
                    setBalance(ethBalance);

                    // Switch to Polygon Mumbai testnet
                    try {
                        await window.ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: '0x13881' }],
                        });
                    } catch (switchError) {
                        // If network doesn't exist, add it
                        if (switchError.code === 4902) {
                            await window.ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [{
                                    chainId: '0x13881',
                                    chainName: 'Polygon Mumbai Testnet',
                                    nativeCurrency: {
                                        name: 'MATIC',
                                        symbol: 'MATIC',
                                        decimals: 18
                                    },
                                    rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
                                    blockExplorerUrls: ['https://mumbai.polygonscan.com/']
                                }]
                            });
                        }
                    }
                }
            } else {
                alert('MetaMask is not installed. Please install MetaMask to connect your wallet.');
            }
        } catch (error) {
            console.error('Error connecting wallet:', error);
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnectWallet = () => {
        setWalletAddress(null);
        setBalance('0.000');
    };

    const copyAddress = () => {
        if (walletAddress) {
            navigator.clipboard.writeText(walletAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const formatAddress = (address) => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">Blockchain Integration</h1>
                        <p className="text-gray-600">
                            Smart contracts and decentralized verification on CUDOS blockchain
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* Wallet Connection */}
                        <Card className="p-6">
                            <div className="flex items-center mb-4">
                                <Wallet className="w-6 h-6 text-blue-600 mr-2" />
                                <h3 className="text-lg font-semibold text-gray-900">Wallet Connection</h3>
                            </div>
                            <div className="space-y-4">
                                {walletAddress ? (
                                    <>
                                        <div className="bg-green-50 rounded-lg p-4">
                                            <p className="text-sm text-green-600 mb-2">Status</p>
                                            <div className="flex items-center space-x-2">
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                <p className="font-medium text-green-900">Connected</p>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <p className="text-sm text-gray-600 mb-2">Address</p>
                                            <div className="flex items-center space-x-2">
                                                <p className="font-mono text-sm">{formatAddress(walletAddress)}</p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={copyAddress}
                                                >
                                                    {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <p className="text-sm text-gray-600 mb-2">Balance</p>
                                            <p className="font-medium text-gray-900">{balance} MATIC</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={disconnectWallet}
                                            className="w-full"
                                        >
                                            Disconnect Wallet
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <p className="text-sm text-gray-600 mb-2">Status</p>
                                            <p className="font-medium text-gray-900">Not Connected</p>
                                        </div>
                                        <Button
                                            onClick={connectWallet}
                                            disabled={isConnecting}
                                            className="w-full"
                                        >
                                            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                                        </Button>
                                        <p className="text-xs text-gray-500 text-center">
                                            Supports MetaMask on Polygon Mumbai testnet
                                        </p>
                                    </>
                                )}
                            </div>
                        </Card>

                        {/* Earnings */}
                        <Card className="p-6">
                            <div className="flex items-center mb-4">
                                <DollarSign className="w-6 h-6 text-emerald-600 mr-2" />
                                <h3 className="text-lg font-semibold text-gray-900">Earnings</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 mb-2">Total Earned</p>
                                    <p className="text-2xl font-bold text-gray-900">{totalEarned} ETH</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 mb-2">Pending Payouts</p>
                                    <p className="text-lg font-medium text-gray-900">{pendingPayouts} ETH</p>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <p className="text-sm text-blue-600 mb-2">Next Payout</p>
                                    <p className="text-sm font-medium text-blue-900">Estimated in 2-3 days</p>
                                </div>
                            </div>
                        </Card>

                        {/* Network Info */}
                        <Card className="p-6">
                            <div className="flex items-center mb-4">
                                <Shield className="w-6 h-6 text-purple-600 mr-2" />
                                <h3 className="text-lg font-semibold text-gray-900">Network</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 mb-2">Current Network</p>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <p className="font-medium text-gray-900">Polygon Mumbai</p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 mb-2">Contract Status</p>
                                    <Badge variant="success">Active</Badge>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 mb-2">Gas Price</p>
                                    <p className="font-medium text-gray-900">~1 GWEI</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Smart Contract Info */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                        <div className="flex items-center mb-6">
                            <TrendingUp className="w-8 h-8 text-amber-600 mr-3" />
                            <h2 className="text-2xl font-semibold text-gray-900">Smart Contract Features</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl">⚡</span>
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-2">Automated Payouts</h4>
                                <p className="text-gray-600 text-sm">Instant rewards for verified events</p>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl">🛡️</span>
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-2">Trust-based Rewards</h4>
                                <p className="text-gray-600 text-sm">Higher trust scores earn more</p>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl">🔗</span>
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-2">Transparent Ledger</h4>
                                <p className="text-gray-600 text-sm">All transactions on-chain</p>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl">💰</span>
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-2">Decentralized Verification</h4>
                                <p className="text-gray-600 text-sm">News verification rewards</p>
                            </div>
                        </div>
                    </div>

                    {/* Transaction History */}
                    <Card className="p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-semibold text-gray-900">Transaction History</h2>
                            <Button
                                variant="outline"
                                onClick={() => window.open('https://mumbai.polygonscan.com/', '_blank')}
                                className="flex items-center space-x-2"
                            >
                                <ExternalLink className="w-4 h-4" />
                                <span>View on Explorer</span>
                            </Button>
                        </div>

                        {transactions.length > 0 ? (
                            <div className="space-y-4">
                                {transactions.map((tx) => (
                                    <motion.div
                                        key={tx.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'reward' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                                                }`}>
                                                {tx.type === 'reward' ? '🎁' : '💰'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{tx.description}</p>
                                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                                    <span>{formatDate(tx.timestamp)}</span>
                                                    <span>•</span>
                                                    <span className="font-mono">{formatAddress(tx.hash)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">+{tx.amount} ETH</p>
                                            <Badge
                                                variant={tx.status === 'confirmed' ? 'success' : 'warning'}
                                                size="sm"
                                            >
                                                {tx.status}
                                            </Badge>
                                        </div>
                                    </motion.div>
                                ))}

                                <div className="text-center pt-4">
                                    <Button variant="outline">
                                        Load More Transactions
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    No Transactions Yet
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    Start submitting news reports to earn rewards and see your transaction history.
                                </p>
                                <Button>
                                    Submit Your First Event
                                </Button>
                            </div>
                        )}
                    </Card>
                </motion.div>
            </div>
        </div>
    );
};

export default BlockchainView;