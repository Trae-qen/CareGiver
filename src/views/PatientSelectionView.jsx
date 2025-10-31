import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const PatientSelectionView = () => {
    // 'patients' here is the user's *assigned* patients list
    const { patients, selectPatient, createPatient, user } = useAuth();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [newPatient, setNewPatient] = useState({
        name: '',
        age: '',
        allergies: '',
        emergency_contact: '',
        doctor: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleSelectPatient = async () => {
        if (!selectedPatientId) {
            alert('Please select a patient');
            return;
        }

        const patient = patients.find(p => p.id === parseInt(selectedPatientId));
        if (patient) {
            selectPatient(patient);
            // Navigation happens automatically via App.jsx when selectedPatient changes
        }
    };

    const handleCreatePatient = async (e) => {
        e.preventDefault();
        
        if (!newPatient.name.trim()) {
            alert('Patient name is required');
            return;
        }

        setIsLoading(true);
        try {
            const patientData = {
                name: newPatient.name.trim(),
                age: newPatient.age ? parseInt(newPatient.age) : null,
                allergies: newPatient.allergies.trim() || null,
                emergency_contact: newPatient.emergency_contact.trim() || null,
                doctor: newPatient.doctor.trim() || null
            };

            // This will create the patient, add it to our list, and auto-select it.
            // App.jsx will then hide this view.
            await createPatient(patientData);
        } catch (error) {
            alert('Failed to create patient. Please try again.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Show a different view if user *can* create patients but has none assigned
    const canCreate = user?.role?.toLowerCase() === 'admin'; // Or any other role you allow
    const hasNoPatients = patients.length === 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-md mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mb-4 shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, {user?.name}!</h1>
                    <p className="text-gray-600">
                        {hasNoPatients && !canCreate ? "You are not yet assigned to any patients." : "Which patient are you with today?"}
                    </p>
                </div>

                {/* Selection Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {!showCreateForm ? (
                        <div>
                            {/* Patient Selection */}
                            {!hasNoPatients && (
                                <>
                                    <div className="mb-6">
                                        <label htmlFor="patient-select" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Select Patient
                                        </label>
                                        <select
                                            id="patient-select"
                                            value={selectedPatientId}
                                            onChange={(e) => setSelectedPatientId(e.target.value)}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors appearance-none bg-white"
                                        >
                                            <option value="">-- Choose a patient --</option>
                                            {patients.map(patient => (
                                                <option key={patient.id} value={patient.id}>
                                                    {patient.name} {patient.age ? `(${patient.age} years old)` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <button 
                                        onClick={handleSelectPatient}
                                        disabled={!selectedPatientId}
                                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mb-4"
                                    >
                                        Continue
                                    </button>
                                </>
                            )}
                            
                            {/* Show "or" separator if both selection and creation are possible */}
                            {!hasNoPatients && canCreate && (
                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-200"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-4 bg-white text-gray-500">or</span>
                                    </div>
                                </div>
                            )}

                            {/* Add New Patient Button (Only show if allowed) */}
                            {canCreate && (
                                <button 
                                    onClick={() => setShowCreateForm(true)}
                                    className="w-full py-3 border-2 border-blue-500 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add New Patient
                                </button>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleCreatePatient}>
                            <div className="mb-4">
                                <label htmlFor="patient-name" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Patient Name *
                                </label>
                                <input
                                    id="patient-name"
                                    type="text"
                                    value={newPatient.name}
                                    onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                                    placeholder="Enter patient name"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="patient-age" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Age
                                </label>
                                <input
                                    id="patient-age"
                                    type="number"
                                    value={newPatient.age}
                                    onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                                    placeholder="Enter age"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                                    min="0"
                                    max="150"
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="patient-allergies" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Allergies
                                </label>
                                <input
                                    id="patient-allergies"
                                    type="text"
                                    value={newPatient.allergies}
                                    onChange={(e) => setNewPatient({ ...newPatient, allergies: e.target.value })}
                                    placeholder="e.g., Penicillin, Peanuts"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="patient-emergency" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Emergency Contact
                                </label>
                                <input
                                    id="patient-emergency"
                                    type="text"
                                    value={newPatient.emergency_contact}
                                    onChange={(e) => setNewPatient({ ...newPatient, emergency_contact: e.target.value })}
                                    placeholder="Name - Phone Number"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            <div className="mb-6">
                                <label htmlFor="patient-doctor" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Doctor
                                </label>
                                <input
                                    id="patient-doctor"
                                    type="text"
                                    value={newPatient.doctor}
                                    onChange={(e) => setNewPatient({ ...newPatient, doctor: e.target.value })}
                                    placeholder="Dr. Name - Phone Number"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mb-3"
                            >
                                {isLoading ? 'Creating...' : 'Create Patient'}
                            </button>

                            <button 
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                disabled={isLoading}
                                className="w-full py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

