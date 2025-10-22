import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Toast } from '../ui/Toast';
import { LoadingSpinner } from '../ui/LoadingSpinner';

const ImpactReporting = ({ eventId, onImpactReported }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [impactTypes, setImpactTypes] = useState([]);
  const [selectedImpacts, setSelectedImpacts] = useState([]);
  const [impactDetails, setImpactDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadImpactTypes();
  }, []);

  const loadImpactTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/economic-impact/types');
      if (response.ok) {
        const data = await response.json();
        setImpactTypes(data.impact_types);
      }
    } catch (error) {
      console.error('Error loading impact types:', error);
      setToast({
        type: 'error',
        message: 'Failed to load impact types'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImpactToggle = (impactType) => {
    setSelectedImpacts(prev => {
      const isSelected = prev.includes(impactType.id);
      if (isSelected) {
        const newSelected = prev.filter(id => id !== impactType.id);
        const newDetails = { ...impactDetails };
        delete newDetails[impactType.id];
        setImpactDetails(newDetails);
        return newSelected;
      } else {
        setImpactDetails(prev => ({
          ...prev,
          [impactType.id]: {
            severity: 5,
            affectedPopulation: 100,
            estimatedCost: 10000,
            description: ''
          }
        }));
        return [...prev, impactType.id];
      }
    });
  };

  const handleDetailChange = (impactId, field, value) => {
    setImpactDetails(prev => ({
      ...prev,
      [impactId]: {
        ...prev[impactId],
        [field]: value
      }
    }));
  };

  const handleSubmitReport = async () => {
    if (selectedImpacts.length === 0) {
      setToast({
        type: 'error',
        message: 'Please select at least one impact type'
      });
      return;
    }

    try {
      setSubmitting(true);
      const reports = [];
      for (const impactId of selectedImpacts) {
        const details = impactDetails[impactId];
        reports.push({
          event_id: eventId,
          impact_type: impactId,
          severity_level: details.severity,
          affected_population: details.affectedPopulation,
          estimated_cost: details.estimatedCost,
          description: details.description
        });
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      setToast({
        type: 'success',
        message: `Successfully reported ${selectedImpacts.length} impact(s)`
      });

      setSelectedImpacts([]);
      setImpactDetails({});
      setIsModalOpen(false);

      if (onImpactReported) {
        onImpactReported(reports);
      }

    } catch (error) {
      console.error('Error submitting impact report:', error);
      setToast({
        type: 'error',
        message: 'Failed to submit impact report'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityColor = (severity) => {
    if (severity <= 3) return 'text-green-600';
    if (severity <= 6) return 'text-yellow-600';
    if (severity <= 8) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSeverityLabel = (severity) => {
    if (severity <= 3) return 'Low';
    if (severity <= 6) return 'Medium';
    if (severity <= 8) return 'High';
    return 'Critical';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="bg-orange-600 hover:bg-orange-700 text-white"
      >
        Report Economic Impact
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Report Economic Impact"
        size="xl"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Impact Reporting</h4>
            <p className="text-sm text-blue-700">
              Help the community understand the consequences of misinformation by reporting observed impacts.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Select Impact Types</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {impactTypes.map((impactType) => (
                <div
                  key={impactType.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${selectedImpacts.includes(impactType.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                    }`}
                  onClick={() => handleImpactToggle(impactType)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-gray-900">{impactType.name}</h5>
                      <p className="text-sm text-gray-600 mt-1">{impactType.description}</p>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedImpacts.includes(impactType.id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                      }`}>
                      {selectedImpacts.includes(impactType.id) && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedImpacts.length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Impact Details</h4>
              <div className="space-y-6">
                {selectedImpacts.map((impactId) => {
                  const impactType = impactTypes.find(t => t.id === impactId);
                  const details = impactDetails[impactId] || {};

                  return (
                    <Card key={impactId} className="p-4">
                      <h5 className="font-medium text-gray-900 mb-4">{impactType?.name}</h5>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Severity Level: {details.severity || 5} - {getSeverityLabel(details.severity || 5)}
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={details.severity || 5}
                            onChange={(e) => handleDetailChange(impactId, 'severity', parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Minimal</span>
                            <span className={getSeverityColor(details.severity || 5)}>
                              {getSeverityLabel(details.severity || 5)}
                            </span>
                            <span>Critical</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Affected Population
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={details.affectedPopulation || 100}
                            onChange={(e) => handleDetailChange(impactId, 'affectedPopulation', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Number of people affected"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estimated Cost (USD)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={details.estimatedCost || 10000}
                            onChange={(e) => handleDetailChange(impactId, 'estimatedCost', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Estimated economic loss"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                          </label>
                          <textarea
                            value={details.description || ''}
                            onChange={(e) => handleDetailChange(impactId, 'description', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Describe the observed impact..."
                          />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleSubmitReport}
              disabled={submitting || selectedImpacts.length === 0}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              {submitting ? 'Submitting...' : `Submit ${selectedImpacts.length} Impact Report(s)`}
            </Button>
            <Button
              onClick={() => setIsModalOpen(false)}
              variant="outline"
              disabled={submitting}
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

export default ImpactReporting;