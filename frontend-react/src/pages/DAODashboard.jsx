import React, { useEffect, useState } from 'react';
import DAOReliefCard from '../components/dao/DAOReliefCard';
import Button from '../components/ui/Button';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../hooks/useAuth';

const DAODashboard = () => {
    // eslint-disable-next-line no-unused-vars
    const { user } = useAuth();
    const [proposals, setProposals] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        apiClient.get('/api/dao/proposals/active')
            .then(res => setProposals(res.data.proposals))
            .catch(() => setError('Failed to load proposals'))
            .finally(() => setLoading(false));
    }, []);

    const handleSelect = (proposal) => setSelected(proposal);

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">DAO Governance Dashboard</h1>
            {loading && <div>Loading...</div>}
            {error && <div className="text-red-600">{error}</div>}
            <div className="mb-4">
                <h2 className="font-semibold mb-2">Active Proposals</h2>
                <ul>
                    {proposals.map((p) => (
                        <li key={p.id} className="mb-2">
                            <Button variant="outline" onClick={() => handleSelect(p)}>
                                {p.title} ({p.status})
                            </Button>
                        </li>
                    ))}
                </ul>
            </div>
            {selected && <DAOReliefCard daoRelief={selected} />}
        </div>
    );
};

export default DAODashboard;
