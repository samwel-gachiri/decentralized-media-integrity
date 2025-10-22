import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Toast } from '../ui/Toast';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';

const DAOWidget = () => {
    const { user } = useAuth();
    const [proposals, setProposals] = useState([]);
    const [daoStats, setDaoStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [toast, setToast] = useState(null);
    const [newProposal, setNewProposal] = useState({
        title: '',
        description: '',
        requested_amount: 1000
    });

    useEffect(() => {
        if (user) {
            loadDAOData();
        }
    }, [user]);

    const loadDAOData = async () => {
        try {
            setLoading(true);

            // Load active proposals
            const proposalsResponse = await fetch('/api/dao/proposals/active');
            if (proposalsResponse.ok) {
                const proposalsData = await proposalsResponse.json();
                setProposals(proposalsData.proposals || []);
            }

            // Load DAO stats
            const statsResponse = await fetch('/api/dao/stats');
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setDaoStats(statsData);
            }

        } catch (error) {
            console.error('Error loading DAO data:', error);
            setToast({
                type: 'error',
                message: 'Failed to load DAO data'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProposal = async () => {
        try {
            const response = await fetch('/api/dao/create-proposal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    proposer_id: user.id,
                    title: newProposal.title,
                    description: newProposal.description,
                    requested_amount: newProposal.requested_amount
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to create proposal');
            }

            const result = await response.json();

            setToast({
                type: 'success',
                message: result.message || 'Proposal created successfully!'
            });

            setShowCreateModal(false);
            setNewProposal({ title: '', description: '', requested_amount: 1000 });
            await loadDAOData();

        } catch (error) {
            setToast({
                type: 'error',
                message: error.message || 'Failed to create proposal'
            });
        }
    };

    const handleVote = async (proposalId, voteChoice) => {
        try {
            const response = await fetch('/api/dao/vote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    proposal_id: proposalId,
                    voter_id: user.id,
                    vote_choice: voteChoice
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to vote');
            }

            const result = await response.json();

            setToast({
                type: 'success',
                message: result.message || 'Vote recorded successfully!'
            });

            await loadDAOData();

        } catch (error) {
            setToast({
                type: 'error',
                message: error.message || 'Failed to vote'
            });
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            active: 'bg-blue-100 text-blue-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            executed: 'bg-purple-100 text-purple-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const canCreateProposal = user && user.trust_score >= 70;
    const canVote = user && user.trust_score >= 60;

    if (loading) {
        return (
            <Card className="p-6">
                <div className="flex justify-center items-center h-32">
                    <LoadingSpinner size="md" />
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* DAO Overview */}
            <Card className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Climate Relief DAO</h3>
                        <p className="text-sm text-gray-600">
                            Community governance for climate relief funding
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(daoStats?.treasury_balance || 0)}
                        </div>
                        <div className="text-sm text-gray-500">Treasury Balance</div>
                    </div>
                </div>

                {/* DAO Stats */}
                {daoStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                            <div className="text-xl font-bold text-blue-600">{daoStats.total_proposals}</div>
                            <div className="text-xs text-gray-500">Total Proposals</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-bold text-green-600">{daoStats.approved_proposals}</div>
                            <div className="text-xs text-gray-500">Approved</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-bold text-purple-600">{daoStats.executed_proposals}</div>
                            <div className="text-xs text-gray-500">Executed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-bold text-orange-600">
                                {formatCurrency(daoStats.total_funding_distributed || 0)}
                            </div>
                            <div className="text-xs text-gray-500">Distributed</div>
                        </div>
                    </div>
                )}

                {/* Create Proposal Button */}
                {canCreateProposal ? (
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Create Funding Proposal
                    </Button>
                ) : (
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <p className="text-yellow-800 font-medium">Trust Score Too Low</p>
                        <p className="text-sm text-yellow-700 mt-1">
                            You need a trust score of at least 70 to create proposals.
                            Current score: {user?.trust_score || 0}
                        </p>
                    </div>
                )}
            </Card>

            {/* Active Proposals */}
            {proposals.length > 0 && (
                <Card className="p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Active Proposals</h4>
                    <div className="space-y-4">
                        {proposals.map((proposal) => (
                            <motion.div
                                key={proposal.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="border border-gray-200 rounded-lg p-4"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <h5 className="font-medium text-gray-900">{proposal.title}</h5>
                                        <p className="text-sm text-gray-600 mt-1">{proposal.description}</p>
                                    </div>
                                    <div className="text-right ml-4">
                                        <div className="font-bold text-green-600">
                                            {formatCurrency(proposal.requested_amount)}
                                        </div>
                                        <Badge className={getStatusColor(proposal.status)}>
                                            {proposal.status.toUpperCase()}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                                    <div>Voting ends: {formatDate(proposal.voting_deadline)}</div>
                                    <div>Yes: {proposal.votes_yes} | No: {proposal.votes_no}</div>
                                </div>

                                {/* Voting Buttons */}
                                {canVote && proposal.status === 'active' && (
                                    <div className="flex space-x-2">
                                        <Button
                                            onClick={() => handleVote(proposal.id, true)}
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            Vote Yes
                                        </Button>
                                        <Button
                                            onClick={() => handleVote(proposal.id, false)}
                                            size="sm"
                                            variant="outline"
                                            className="border-red-300 text-red-600 hover:bg-red-50"
                                        >
                                            Vote No
                                        </Button>
                                    </div>
                                )}

                                {!canVote && (
                                    <div className="text-sm text-gray-500">
                                        Trust score of 60+ required to vote (Current: {user?.trust_score || 0})
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </Card>
            )}

            {/* How DAO Works */}
            <Card className="p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">How the Climate Relief DAO Works</h4>
                <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                        <div>
                            <strong>Create Proposals:</strong> High-trust community members (70+ trust score) can propose funding for climate relief
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                        <div>
                            <strong>Community Voting:</strong> Members with 60+ trust score can vote on proposals during the voting period
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                        <div>
                            <strong>Automatic Execution:</strong> Approved proposals (60%+ approval) are automatically executed from the treasury
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</div>
                        <div>
                            <strong>Transparent Distribution:</strong> All funding decisions are recorded on-chain for full transparency
                        </div>
                    </div>
                </div>
            </Card>

            {/* Create Proposal Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create Funding Proposal"
                size="lg"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Proposal Title *
                        </label>
                        <input
                            type="text"
                            value={newProposal.title}
                            onChange={(e) => setNewProposal(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Brief, descriptive title for your proposal"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description *
                        </label>
                        <textarea
                            value={newProposal.description}
                            onChange={(e) => setNewProposal(prev => ({ ...prev, description: e.target.value }))}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Detailed description of what the funding will be used for and who will benefit"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Requested Amount (USD) *
                        </label>
                        <input
                            type="number"
                            min="100"
                            max={daoStats?.treasury_balance || 10000}
                            value={newProposal.requested_amount}
                            onChange={(e) => setNewProposal(prev => ({ ...prev, requested_amount: parseFloat(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="text-sm text-gray-500 mt-1">
                            Available treasury: {formatCurrency(daoStats?.treasury_balance || 0)}
                        </div>
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <Button
                            onClick={handleCreateProposal}
                            disabled={!newProposal.title || !newProposal.description || newProposal.requested_amount <= 0}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Create Proposal
                        </Button>
                        <Button
                            onClick={() => setShowCreateModal(false)}
                            variant="outline"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal>

            {toast && (
                <Toast
                    type={toast.type}
                    message={toast.message}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default DAOWidget;