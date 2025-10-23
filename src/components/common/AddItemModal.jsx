import React, { useState, useEffect } from 'react';
import { useCarePlan } from '../../context/CarePlanContext';
import { commonSymptoms } from '../../data/mockData';

const AddItemModal = ({ isOpen, onClose, category, onSave }) => {
    const { getActiveMedications } = useCarePlan();
    const [formData, setFormData] = useState({});
    const [selectedMedication, setSelectedMedication] = useState(null);
    const activeMedications = getActiveMedications();

    // Auto-fill dosage when medication is selected
    useEffect(() => {
        if (selectedMedication) {
            const med = activeMedications.find(m => m.id === parseInt(selectedMedication));

            // ONLY update state if a med is found AND
            // the form data is different from the med data.
            if (med && (formData.medication_id !== med.id || formData.name !== med.name || formData.dosage !== med.dosage)) {
                setFormData(prev => ({
                    ...prev,
                    medication_id: med.id,
                    name: med.name,
                    dosage: med.dosage
                }));
            }
        }
    // Add formData.name and formData.dosage to the dependency array
    }, [selectedMedication, activeMedications, formData.name, formData.dosage]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        setFormData({});
        setSelectedMedication(null);
        onClose();
    };

    const renderFormFields = () => {
        switch (category) {
            case 'Medications':
                return (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Medication</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                value={selectedMedication || ''}
                                onChange={(e) => setSelectedMedication(e.target.value)}
                            >
                                <option value="">Choose from patient's medications...</option>
                                {activeMedications.map(med => (
                                    <option key={med.id} value={med.id}>
                                        {med.name} - {med.dosage}
                                    </option>
                                ))}
                            </select>
                            {activeMedications.length === 0 && (
                                <p className="text-xs text-amber-600 mt-1">
                                    No medications in care plan. Add medications in "Manage Plan" first.
                                </p>
                            )}
                        </div>
                        
                        {selectedMedication && (
                            <>
                                <div className="mb-4 bg-violet-50 border border-violet-200 rounded-lg p-3">
                                    <div className="flex items-start">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-violet-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-violet-900">{formData.name}</p>
                                            <p className="text-xs text-violet-700">Dosage: {formData.dosage}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Taken</label>
                                    <input
                                        type="time"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        value={formData.time || ''}
                                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        rows="3"
                                        placeholder="Any additional notes..."
                                        value={formData.notes || ''}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>
                            </>
                        )}
                    </>
                );
            
            case 'Symptoms':
                return (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Symptom</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                value={formData.symptom || ''}
                                onChange={(e) => setFormData({ ...formData, symptom: e.target.value })}
                            >
                                <option value="">Select a symptom...</option>
                                {commonSymptoms.map((s, idx) => (
                                    <option key={idx} value={s}>{s}</option>
                                ))}
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {formData.symptom === 'Other' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Other Symptom</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="Describe the symptom..."
                                    value={formData.otherSymptom || ''}
                                    onChange={(e) => setFormData({ ...formData, otherSymptom: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Severity (1-10)</label>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                className="w-full"
                                value={formData.severity || 5}
                                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                            />
                            <div className="text-center text-2xl font-bold text-gray-700">{formData.severity || 5}</div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                rows="3"
                                placeholder="Describe the symptom..."
                                value={formData.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </>
                );

            case 'Measurements':
                return (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Measurement Type</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={formData.type || ''}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="">Select type...</option>
                                <option value="blood_pressure">Blood Pressure</option>
                                <option value="temperature">Temperature</option>
                                <option value="weight">Weight</option>
                                <option value="blood_sugar">Blood Sugar</option>
                                <option value="heart_rate">Heart Rate</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="e.g., 120/80"
                                value={formData.value || ''}
                                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                            />
                        </div>
                    </>
                );

            case 'Tasks':
                return (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Task Name</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                placeholder="e.g., Dishes, Laundry, Grocery Shopping"
                                value={formData.task || ''}
                                onChange={(e) => setFormData({ ...formData, task: e.target.value })}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Completed By</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                placeholder="Aide name"
                                value={formData.completedBy || ''}
                                onChange={(e) => setFormData({ ...formData, completedBy: e.target.value })}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Time Completed</label>
                            <input
                                type="time"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                value={formData.time || ''}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                rows="3"
                                placeholder="Any additional details..."
                                value={formData.notes || ''}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </>
                );

            case 'Mood':
                return (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">How are you feeling?</label>
                            <div className="flex justify-around py-4">
                                {['😢', '😟', '😐', '🙂', '😄'].map((emoji, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        className={`text-4xl p-2 rounded-lg transition-all ${formData.mood === idx + 1 ? 'bg-pink-100 scale-110' : 'hover:bg-gray-100'}`}
                                        onClick={() => setFormData({ ...formData, mood: idx + 1 })}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                                rows="3"
                                placeholder="What's on your mind?"
                                value={formData.notes || ''}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </>
                );

            default:
                return (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                        <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="4"
                            placeholder={`Add ${category.toLowerCase()} details...`}
                            value={formData.notes || ''}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <h2 className="text-xl font-bold text-gray-800">Add {category}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {renderFormFields()}

                    <div className="flex space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddItemModal;
