import React from 'react';

const EarlyWarningCard = ({ earlyWarning }) => {
    if (!earlyWarning) return null;
    return (
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">⚠️ Early Warning</h4>
            <div className="space-y-1">
                <div>Alert Level: {earlyWarning.alert_level || 'N/A'}</div>
                {earlyWarning.warnings && earlyWarning.warnings.length > 0 && (
                    <div>Warnings: {earlyWarning.warnings.join(', ')}</div>
                )}
            </div>
        </div>
    );
};

export default EarlyWarningCard;
