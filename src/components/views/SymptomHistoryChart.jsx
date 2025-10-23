import React, { useEffect, useState } from 'react';
import { symptomAPI } from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getColorForString } from '../../utils/colorForString';
import { useAuth } from '../../context/AuthContext';

const SymptomHistoryChart = () => {
    const { selectedPatient } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [symptomTypes, setSymptomTypes] = useState([]);

    useEffect(() => {
        if (!selectedPatient) return;
        setLoading(true);
        symptomAPI.aggregate({
            patient_id: selectedPatient.id,
            group_by: 'day',
        })
            .then(res => {
                // Transform { date: {symptom_type: count, ...}, ... } to array of { date, symptom1, symptom2, ... }
                const rows = Object.entries(res).map(([date, counts]) => ({ date, ...counts }));
                // Collect all unique symptom types
                const allTypes = new Set();
                rows.forEach(row => Object.keys(row).forEach(k => k !== 'date' && allTypes.add(k)));
                const typesArray = Array.from(allTypes);
                setSymptomTypes(typesArray);
                setData(rows);
            })
            .catch(err => {
                setError('Failed to load symptom history');
                console.error('SymptomHistoryChart API error:', err);
            })
            .finally(() => setLoading(false));
    }, [selectedPatient]);

    if (!selectedPatient) return <div className="p-4">Select a patient to view symptom history.</div>;
    if (loading) return <div className="p-4">Loading symptom history...</div>;
    if (error) return <div className="p-4 text-red-600">{error}</div>;
    if (!data.length) return <div className="p-4">No symptom logs found.</div>;

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Symptom History</h2>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    {symptomTypes.map(type => (
                        <Line key={type} type="monotone" dataKey={type} stroke={getColorForString(type)} />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SymptomHistoryChart;
