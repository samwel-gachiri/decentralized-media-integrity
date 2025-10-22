import React from 'react';

const DAOReliefCard = ({ daoRelief }) => {
    if (!daoRelief) return null;
    return (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">🏛️ DAO Relief Proposal</h4>
            <div className="space-y-1">
                <div>Status: {daoRelief.status || 'N/A'}</div>
                {daoRelief.evaluation && (
                    <div>Evaluation: {typeof daoRelief.evaluation === 'object' ? JSON.stringify(daoRelief.evaluation) : daoRelief.evaluation}</div>
                )}
            </div>
        </div>
    );
};

export default DAOReliefCard;
