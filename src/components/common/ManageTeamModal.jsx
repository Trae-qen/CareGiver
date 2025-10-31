import React, { useState, useMemo, useEffect } from 'react';
import { patientAPI } from '../../services/api';

// This is a new, focused modal component
const ManageTeamModal = ({ isOpen, onClose, allUsers, patient, onTeamUpdate }) => {
    const [aideToAssign, setAideToAssign] = useState('');

    const currentAideIds = useMemo(() => {
        return new Set((patient?.aides || []).map(a => a.id));
    }, [patient?.aides]);

    const availableAides = useMemo(() => {
        return (allUsers || []).filter(u => !currentAideIds.has(u.id));
    }, [allUsers, currentAideIds]);

    const currentAides = useMemo(() => {
        return patient?.aides || [];
    }, [patient?.aides]);
    
    // Reset dropdown when modal opens/closes or patient changes
    useEffect(() => {
        if (isOpen) {
            setAideToAssign('');
        }
    }, [isOpen]);

    if (!isOpen || !patient) return null;

    const handleAssignAide = async () => {
        if (!aideToAssign) return;
        try {
            await patientAPI.assignAide(patient.id, aideToAssign);
            onTeamUpdate(); // Tell AdminView to refresh data
            setAideToAssign(''); 
        } catch (error) {
            console.error("Failed to assign aide:", error);
            alert("Failed to assign aide.");
        }
    };

    const handleRemoveAide = async (userId) => {
        try {
            await patientAPI.removeAide(patient.id, userId);
            onTeamUpdate(); // Tell AdminView to refresh data
        } catch (error) {
            console.error("Failed to remove aide:", error);
            alert("Failed to remove aide.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">Manage Care Team</h2>
                            <p className="text-purple-100 text-sm mt-1">Assign or remove aides for: {patient.name}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* 1. Add new aide section */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Assign New Aide</h3>
                        <div className="flex space-x-2">
                            <select
                                value={aideToAssign}
                                onChange={e => setAideToAssign(e.target.value)}
                                className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                            >
                                <option value="">Select an aide...</option>
                                {availableAides.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} ({user.email})
                                    </option>
                                ))}
                            </select>
                            <button 
                                onClick={handleAssignAide} 
                                disabled={!aideToAssign}
                                className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50"
                            >
                                Assign
                            </button>
                        </div>
                    </div>
                    
                    {/* 2. Current aides list */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Current Care Team</h3>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {currentAides.length === 0 && (
                                <p className="text-gray-500 text-sm">No aides are assigned to this patient.</p>
                            )}
                            {currentAides.map(aide => (
                                <div key={aide.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium">{aide.name}</p>
                                        <p className="text-sm text-gray-500">{aide.role}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleRemoveAide(aide.id)}
                                        className="text-sm text-red-600 hover:underline"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageTeamModal;