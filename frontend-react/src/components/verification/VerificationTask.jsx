import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Toast } from '../ui/Toast';

const VerificationTask = ({ assignment, onSubmitVerification, onSkip }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [verificationData, setVerificationData] = useState({
        verified: null,
        confidence: 0.5,
        evidence: [],
        reasoning: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    const handleVerificationSubmit = async () => {
        if (verificationData.verified === null) {
            setToast({
                type: 'error',
                message: 'Please select whether you verify this event or not'
            });
            return;
        }

        if (!verificationData.reasoning.trim()) {
            setToast({
                type: 'error',
                message: 'Please provide reasoning for your verification decision'
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmitVerification(assignment.event_id, verificationData);
            setToast({
                type: 'success',
                message: 'Verification submitted successfully!'
            });
            setIsModalOpen(false);
        } catch (error) {
            setToast({
                type: 'error',
                message: error.message || 'Failed to submit verification'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getEventTypeColor = (eventType) => {
        const colors = {
            drought: 'bg-orange-100 text-orange-800',
            flood: 'bg-blue-100 text-blue-800',
            locust: 'bg-green-100 text-green-800',
            extreme_heat: 'bg-red-100 text-red-800'
        };
        return colors[eventType] || 'bg-gray-100 text-gray-800';
    };

    const isDeadlineNear = () => {
        const deadline = new Date(assignment.deadline);
        const now = new Date();
        const hoursLeft = (deadline - now) / (1000 * 60 * 60);
        return hoursLeft < 24;
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-3">
                            <Badge className={getEventTypeColor(assignment.event_type)}>
                                {assignment.event_type.replace('_', ' ').toUpperCase()}
                            </Badge>
                            {isDeadlineNear() && (
                                <Badge className="bg-red-100 text-red-800">
                                    Urgent
                                </Badge>
                            )}
                        </div>
                        <div className="text-sm text-gray-500">
                            Due: {formatDate(assignment.deadline)}
                        </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        News Integrity Verification
                    </h3>

                    <p className="text-gray-600 mb-4">
                        {assignment.description || 'No description provided'}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                            <span className="font-medium text-gray-700">Location:</span>
                            <div className="text-gray-600">
                                {assignment.location.latitude.toFixed(4)}, {assignment.location.longitude.toFixed(4)}
                            </div>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Reported:</span>
                            <div className="text-gray-600">
                                {assignment.timestamp ? formatDate(assignment.timestamp) : 'Unknown'}
                            </div>
                        </div>
                    </div>

                    {assignment.photo_path && (
                        <div className="mb-4">
                            <img
                                src={assignment.photo_path}
                                alt="Event evidence"
                                className="w-full h-48 object-cover rounded-lg"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                            />
                        </div>
                    )}

                    <div className="flex space-x-3">
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Verify Event
                        </Button>
                        <Button
                            onClick={() => onSkip(assignment.event_id)}
                            variant="outline"
                            className="px-6"
                        >
                            Skip
                        </Button>
                    </div>
                </Card>
            </motion.div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Verify News Report"
                size="lg"
            >
                <div className="space-y-6">
                    {/* Event Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Event Details</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                            <div><strong>Type:</strong> {assignment.event_type.replace('_', ' ')}</div>
                            <div><strong>Description:</strong> {assignment.description || 'No description'}</div>
                            <div><strong>Location:</strong> {assignment.location.latitude.toFixed(4)}, {assignment.location.longitude.toFixed(4)}</div>
                            <div><strong>Reported:</strong> {assignment.timestamp ? formatDate(assignment.timestamp) : 'Unknown'}</div>
                        </div>
                    </div>

                    {/* Verification Decision */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Verification Decision *
                        </label>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setVerificationData(prev => ({ ...prev, verified: true }))}
                                className={`flex-1 p-4 rounded-lg border-2 transition-colors ${verificationData.verified === true
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : 'border-gray-200 hover:border-green-300'
                                    }`}
                            >
                                <div className="text-center">
                                    <div className="text-2xl mb-1">✓</div>
                                    <div className="font-medium">Verify</div>
                                    <div className="text-xs text-gray-500">This event is legitimate</div>
                                </div>
                            </button>
                            <button
                                onClick={() => setVerificationData(prev => ({ ...prev, verified: false }))}
                                className={`flex-1 p-4 rounded-lg border-2 transition-colors ${verificationData.verified === false
                                        ? 'border-red-500 bg-red-50 text-red-700'
                                        : 'border-gray-200 hover:border-red-300'
                                    }`}
                            >
                                <div className="text-center">
                                    <div className="text-2xl mb-1">✗</div>
                                    <div className="font-medium">Reject</div>
                                    <div className="text-xs text-gray-500">This event is not legitimate</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Confidence Level */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confidence Level: {Math.round(verificationData.confidence * 100)}%
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={verificationData.confidence}
                            onChange={(e) => setVerificationData(prev => ({
                                ...prev,
                                confidence: parseFloat(e.target.value)
                            }))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Not confident</span>
                            <span>Very confident</span>
                        </div>
                    </div>

                    {/* Reasoning */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reasoning *
                        </label>
                        <textarea
                            value={verificationData.reasoning}
                            onChange={(e) => setVerificationData(prev => ({
                                ...prev,
                                reasoning: e.target.value
                            }))}
                            placeholder="Explain your verification decision. Consider factors like location plausibility, timing, photo evidence, etc."
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Evidence Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Additional Evidence (Optional)
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <div className="text-gray-500">
                                <div className="text-sm">Upload supporting evidence</div>
                                <div className="text-xs">Photos, documents, or other relevant files</div>
                            </div>
                            <input
                                type="file"
                                multiple
                                accept="image/*,.pdf,.doc,.docx"
                                className="hidden"
                                onChange={(e) => {
                                    const files = Array.from(e.target.files);
                                    setVerificationData(prev => ({
                                        ...prev,
                                        evidence: files.map(f => f.name)
                                    }));
                                }}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => document.querySelector('input[type="file"]').click()}
                            >
                                Choose Files
                            </Button>
                        </div>
                        {verificationData.evidence.length > 0 && (
                            <div className="mt-2 text-sm text-gray-600">
                                {verificationData.evidence.length} file(s) selected
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-4">
                        <Button
                            onClick={handleVerificationSubmit}
                            disabled={isSubmitting || verificationData.verified === null}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Verification'}
                        </Button>
                        <Button
                            onClick={() => setIsModalOpen(false)}
                            variant="outline"
                            disabled={isSubmitting}
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
        </>
    );
};

export default VerificationTask;