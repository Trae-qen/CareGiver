import React, { useState, useEffect, useMemo } from 'react';
import { medicationScheduleAPI } from '../../services/api';
import AppIcon from './AppIcon';
import { useCarePlan } from '../../context/CarePlanContext';
import { useAuth } from '../../context/AuthContext';

const ManagePlanModal = ({ isOpen, onClose}) => {
    const { medications, patientInfo, updateMedication, updatePatientInfo, addMedication, deleteMedication } = useCarePlan();    const { user, selectedPatient } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [showAddMedModal, setShowAddMedModal] = useState(false);
    const [newMedication, setNewMedication] = useState({
        name: '',
        dosage: '',
        frequency: 'Daily',
        time: '08:00'
    });

    // --- MOVED HOOKS START ---
    // These hooks must be called before any conditional returns.
    
    // Medication schedule state
    const [schedules, setSchedules] = useState([]);
    const [loadingSchedules, setLoadingSchedules] = useState(true);
    const [showAddSchedule, setShowAddSchedule] = useState(false);
    const [newSchedule, setNewSchedule] = useState({
        medication_id: '',
        time_of_day: '08:00',
        recurrence_rule: 'daily',
        day_of_week: 'monday', // Add this
        notes: ''
    });
    const [aideToAssign, setAideToAssign] = useState('');

    useEffect(() => {
        // Fetch schedules when the modal opens, not just when the tab is clicked
        if (isOpen && selectedPatient) {
            setLoadingSchedules(true);
            // Pass the patient_id so you only get schedules for this patient
            medicationScheduleAPI.getAll({ patient_id: selectedPatient.id })
                .then(setSchedules)
                .catch(error => console.error("Failed to load schedules", error))
                .finally(() => setLoadingSchedules(false));
        } else if (!isOpen) {
            // Clear data when modal closes
            setSchedules([]);
        }
    }, [isOpen, selectedPatient]);
    // --- MOVED HOOKS END ---

   const currentAideIds = useMemo(() => {
        // We use (selectedPatient?.aides || []) as a "guard"
        // This says: if selectedPatient exists, use its .aides,
        // otherwise, use an empty array []. This prevents the crash.
        return new Set((selectedPatient?.aides || []).map(a => a.id));
    }, [selectedPatient?.aides]);

    



    if (!isOpen) return null;
    if (!selectedPatient) {
        return null;
    }

    const tabs = [
        { id: 'overview', name: 'Overview', icon: 'check-in' },
        { id: 'medications', name: 'Medications', icon: 'medication' },
        { id: 'schedule', name: 'Schedule', icon: 'today' },
        { id: 'patient', name: 'Patient Info', icon: 'info' },
    ];

    const handleAddMedication = () => {
        if (newMedication.name && newMedication.dosage) {
            addMedication(newMedication);
            setNewMedication({
                name: '',
                dosage: '',
                frequency: 'Daily',
                time: '08:00'
            });
            setShowAddMedModal(false);
        }
    };

    const handleDeleteMedication = (id, name) => {
        if (window.confirm(`Are you sure you want to remove ${name} from the care plan?`)) {
            deleteMedication(id);
        }
    };

    

    const renderOverview = () => {
        // Calculate dynamic stats
        const activeMeds = medications.filter(m => m.active).length;
        const totalSchedules = schedules.length;
        const dailySchedules = schedules.filter(s => s.recurrence_rule === 'daily').length;
        const weeklySchedules = schedules.filter(s => s.recurrence_rule === 'weekly').length;

        const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

        return (
            <div className="space-y-4">
                {/* 1. Care Plan Summary (Now Dynamic) */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Care Plan Summary</h3>
                    {loadingSchedules ? (
                        <div className="text-sm text-blue-800">Loading summary...</div>
                    ) : (
                        <div className="space-y-2 text-sm text-blue-800">
                            <p>• <strong>{activeMeds}</strong> active medications</p>
                            <p>• <strong>{totalSchedules}</strong> total medication schedules</p>
                            <p>• <strong>{dailySchedules}</strong> daily schedules</p>
                            <p>• <strong>{weeklySchedules}</strong> weekly schedules</p>
                        </div>
                    )}
                </div>

                {/* 2. Medication Schedules (Now Dynamic) */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Medication Schedules</h3>
                    {loadingSchedules ? (
                        <div className="text-sm text-gray-500">Loading schedules...</div>
                    ) : schedules.length === 0 ? (
                        <div className="text-sm text-gray-500">No medication schedules have been added.</div>
                    ) : (
                        <div className="space-y-3">
                            {/* Show a preview of the first 3 schedules */}
                            {schedules.slice(0, 3).map(sch => {
                                const med = medications.find(m => m.id === sch.medication_id);
                                return (
                                    <div key={sch.id} className="flex items-center justify-between pb-2 border-b last:border-b-0">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                                                <AppIcon name="medication" className="w-5 h-5 text-violet-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{med?.name || 'Medication'}</p>
                                                <p className="text-xs text-gray-500">
                                                    {sch.recurrence_rule === 'weekly' && sch.day_of_week
                                                        ? `Weekly on ${capitalize(sch.day_of_week)}`
                                                        : capitalize(sch.recurrence_rule)
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-medium text-gray-800 ml-2">{sch.time_of_day}</span>
                                    </div>
                                );
                            })}
                            {schedules.length > 3 && (
                                <p className="text-xs text-gray-500 text-center pt-2">
                                    ...and {schedules.length - 3} more. See 'Schedule' tab for details.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* 3. Important Notes (Now Dynamic from patientInfo) */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h3 className="font-semibold text-amber-900 mb-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Important Patient Info
                    </h3>
                    <ul className="text-sm text-amber-800 space-y-2">
                        <li>
                            <strong>Allergies:</strong> {patientInfo.allergies || 'N/A'}
                        </li>
                        <li>
                            <strong>Primary Doctor:</strong> {patientInfo.doctor || 'N/A'}
                        </li>
                        <li>
                            <strong>Emergency Contact:</strong> {patientInfo.emergencyContact || 'N/A'}
                        </li>
                    </ul>
                </div>
            </div>
        );
    };

    const renderMedications = () => (
        <div className="space-y-4">
            <button 
                onClick={() => setShowAddMedModal(true)}
                className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Medication
            </button>

            <div className="space-y-3">
                {medications.map(med => (
                    <div key={med.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{med.name}</h4>
                                <p className="text-sm text-gray-600">{med.dosage}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={med.active}
                                    onChange={() => {
                                        updateMedication(med.id, { active: !med.active });
                                    }}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                            <span className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {med.time}
                            </span>
                            <span className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {med.frequency}
                            </span>
                        </div>
                        <div className="mt-3 flex space-x-2">
                            <button 
                                onClick={() => handleDeleteMedication(med.id, med.name)}
                                className="flex-1 text-sm bg-red-50 text-red-600 py-2 rounded hover:bg-red-100 transition-colors"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );


    const handleAddSchedule = async () => {
        if (!newSchedule.medication_id || !newSchedule.time_of_day) return;
        
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // 1. Build the payload
        const scheduleWithIds = {
            ...newSchedule,
            user_id: user?.id,
            patient_id: selectedPatient?.id,
            timezone: userTimezone
        };

        // 2. Clean up the payload: remove day_of_week if not weekly
        if (scheduleWithIds.recurrence_rule !== 'weekly') {
            delete scheduleWithIds.day_of_week;
        }

        await medicationScheduleAPI.create(scheduleWithIds);
        setShowAddSchedule(false);
        
        // 3. Reset the state (including the new day_of_week)
        setNewSchedule({
            medication_id: '',
            time_of_day: '08:00',
            recurrence_rule: 'daily',
            day_of_week: 'monday', // Reset this
            notes: ''
        });

        setLoadingSchedules(true);
        medicationScheduleAPI.getAll().then(setSchedules).finally(() => setLoadingSchedules(false));
    };

    const handleDeleteSchedule = async (id) => {
        await medicationScheduleAPI.delete(id);
        setLoadingSchedules(true);
        medicationScheduleAPI.getAll().then(setSchedules).finally(() => setLoadingSchedules(false));
    };

    const renderSchedule = () => (
        <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Medication Schedules</h3>
                {loadingSchedules ? (
                    <div>Loading schedules...</div>
                ) : (
                    <div className="space-y-3">
                        {schedules.length === 0 && <div className="text-gray-500">No schedules found.</div>}
                        {schedules.map(sch => (
                            <div key={sch.id} className="flex items-center justify-between border-b py-2 last:border-b-0">
                                <div>
                                    <div className="font-medium text-gray-800">{medications.find(m => m.id === sch.medication_id)?.name || 'Medication'} at {sch.time_of_day}</div>
                                    <div className="text-xs text-gray-500">
                                    {(() => {
                                        // Helper to capitalize first letter
                                        const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
                                        
                                        // Check if rule is weekly and day_of_week exists
                                        if (sch.recurrence_rule === 'weekly' && sch.day_of_week) {
                                            return `Weekly on ${capitalize(sch.day_of_week)}`;
                                        }
                                        // Fallback for 'daily', 'as_needed', or old data
                                        return capitalize(sch.recurrence_rule);
                                    })()}
                                    {sch.notes && ` - ${sch.notes}`}
                                </div>
                                </div>
                                <button onClick={() => handleDeleteSchedule(sch.id)} className="text-red-500 hover:underline text-xs">Delete</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <button onClick={() => setShowAddSchedule(true)} className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors">
                Add Medication Schedule
            </button>
            {showAddSchedule && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full m-4">
                        <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white p-4 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold">Add Medication Schedule</h3>
                                <button onClick={() => setShowAddSchedule(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Medication *</label>
                                <select
                                    value={newSchedule.medication_id}
                                    onChange={e => setNewSchedule({ ...newSchedule, medication_id: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                >
                                    <option value="">Select medication...</option>
                                    {medications.map(med => (
                                        <option key={med.id} value={med.id}>{med.name} ({med.dosage})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Time of Day *</label>
                                <input
                                    type="time"
                                    value={newSchedule.time_of_day}
                                    onChange={e => setNewSchedule({ ...newSchedule, time_of_day: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Recurrence</label>
                                <select
                                    value={newSchedule.recurrence_rule}
                                    onChange={e => setNewSchedule({ ...newSchedule, recurrence_rule: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="as_needed">As Needed</option>
                                </select>
                            </div>
                            {newSchedule.recurrence_rule === 'weekly' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Day of Week *</label>
                                    <select
                                        value={newSchedule.day_of_week}
                                        onChange={e => setNewSchedule({ ...newSchedule, day_of_week: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    >
                                        <option value="monday">Monday</option>
                                        <option value="tuesday">Tuesday</option>
                                        <option value="wednesday">Wednesday</option>
                                        <option value="thursday">Thursday</option>
                                        <option value="friday">Friday</option>
                                        <option value="saturday">Saturday</option>
                                        <option value="sunday">Sunday</option>
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                <input
                                    type="text"
                                    value={newSchedule.notes}
                                    onChange={e => setNewSchedule({ ...newSchedule, notes: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button onClick={() => setShowAddSchedule(false)} className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                                <button onClick={handleAddSchedule} disabled={!newSchedule.medication_id || !newSchedule.time_of_day} className="flex-1 px-4 py-3 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Add Schedule</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderPatientInfo = () => (
        <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Patient Information</h3>
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            value={patientInfo.name}
                            onChange={(e) => updatePatientInfo({ name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                        <input
                            type="number"
                            value={patientInfo.age}
                            onChange={(e) => updatePatientInfo({ age: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                        <textarea
                            value={patientInfo.allergies}
                            onChange={(e) => updatePatientInfo({ allergies: e.target.value })}
                            rows="2"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                        <input
                            type="text"
                            value={patientInfo.emergencyContact}
                            onChange={(e) => updatePatientInfo({ emergencyContact: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Primary Doctor</label>
                        <input
                            type="text"
                            value={patientInfo.doctor}
                            onChange={(e) => updatePatientInfo({ doctor: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            <button className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors">
                Save Patient Information
            </button>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return renderOverview();
            case 'medications':
                return renderMedications();
            case 'schedule':
                return renderSchedule();
            case 'patient':
                return renderPatientInfo();
            default:
                return renderOverview();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-50 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">Manage Patient: {selectedPatient.name}</h2>
                            <p className="text-blue-100 text-sm mt-1">Configure patient information, care and medications</p>
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

                {/* Tabs */}
                <div className="bg-white border-b border-gray-200 px-4">
                    <div className="flex space-x-1 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <AppIcon name={tab.icon} className="w-4 h-4" />
                                <span>{tab.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {renderContent()}
                </div>
            </div>

            {/* Add Medication Modal */}
            {showAddMedModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full m-4">
                        <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white p-4 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold">Add New Medication</h3>
                                <button
                                    onClick={() => setShowAddMedModal(false)}
                                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Medication Name *</label>
                                <input
                                    type="text"
                                    value={newMedication.name}
                                    onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    placeholder="e.g., Aspirin"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Dosage *</label>
                                <input
                                    type="text"
                                    value={newMedication.dosage}
                                    onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    placeholder="e.g., 100mg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                                <select
                                    value={newMedication.frequency}
                                    onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                >
                                    <option value="Daily">Daily</option>
                                    <option value="Twice Daily">Twice Daily</option>
                                    <option value="Three Times Daily">Three Times Daily</option>
                                    <option value="Weekly">Weekly</option>
                                    <option value="As Needed">As Needed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                                <input
                                    type="time"
                                    value={newMedication.time}
                                    onChange={(e) => setNewMedication({ ...newMedication, time: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button
                                    onClick={() => setShowAddMedModal(false)}
                                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddMedication}
                                    disabled={!newMedication.name || !newMedication.dosage}
                                    className="flex-1 px-4 py-3 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Add Medication
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagePlanModal;