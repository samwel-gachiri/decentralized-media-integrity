import React from 'react';

const CommunityVerificationCard = ({ communityVerification }) => {
    if (!communityVerification) return null;
    return (
        <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
            <h4 className="font-medium text-indigo-900 mb-2">👥 Community Verification</h4>
            <div className="space-y-1">
                <div>Status: {communityVerification.status || 'N/A'}</div>
                {/* Add more details as needed */}
            </div>
        </div>
    );
};

export default CommunityVerificationCard;
