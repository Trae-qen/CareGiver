import React, { createContext, useContext, useState, useEffect } from 'react';
import { checkInAPI, medicationScheduleAPI, medicationAdherenceAPI, medicationAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { format } from 'date-fns';

const CheckInContext = createContext();

export const CheckInProvider = ({ children }) => {
    const { selectedPatient, user } = useAuth();
    const [checkIns, setCheckIns] = useState([]);
    const [adherences, setAdherences] = useState([]); // New state for adherences
    const [isLoading, setIsLoading] = useState(true);
    const [isAdherenceLoading, setIsAdherenceLoading] = useState(true); // New loading state for adherence

    // Load check-ins when patient changes
    useEffect(() => {
        if (selectedPatient) {
            loadCheckIns();
            loadAdherenceData(); // Load adherence data as well
        } else {
            setCheckIns([]);
            setAdherences([]); // Clear adherences
            setIsLoading(false);
            setIsAdherenceLoading(false); // Clear adherence loading
        }
    }, [selectedPatient]);

    const loadCheckIns = async () => {
        try {
            setIsLoading(true);
            const data = await checkInAPI.getAll();
            const patientCheckIns = data.filter(c => c.patient_id === selectedPatient.id);
            setCheckIns(patientCheckIns);
        } catch (error) {
            console.error('Failed to load check-ins:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadAdherenceData = async () => {
        if (!selectedPatient) return;
        setIsAdherenceLoading(true);
        try {
            const [logs, medications] = await Promise.all([
                medicationAdherenceAPI.getAll({ patient_id: selectedPatient.id }),
                medicationAPI.getAll(selectedPatient.id)
            ]);

            const medicationMap = medications.reduce((acc, med) => {
                acc[med.id] = med;
                return acc;
            }, {});

            const populatedLogs = logs.map(log => ({
                ...log,
                medication: medicationMap[log.medication_id],
                user: log.user_id === user?.id ? user : { name: 'Another Aide', role: 'Caregiver' } // Placeholder for other users
            }));

            setAdherences(populatedLogs);
        } catch (error) {
            console.error('Failed to load adherence data:', error);
        } finally {
            setIsAdherenceLoading(false);
        }
    };

    const addCheckIn = async (category, data, user = null) => {
        if (!selectedPatient) {
            throw new Error('No patient selected');
        }
        try {
            const checkInData = {
                user_id: user?.id,
                patient_id: selectedPatient.id,
                category,
                data
            };
            
            const newCheckIn = await checkInAPI.create(category, data, user?.id, selectedPatient.id);
            setCheckIns(prev => [newCheckIn, ...prev]);
            return newCheckIn;
        } catch (error) {
            console.error('Failed to save check-in:', error);
            throw error;
        }
    };

    const getCheckInsByDate = (date) => {
        const dateString = new Date(date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        return checkIns.filter(checkIn => checkIn.date === dateString);
    };

    const getCheckInsByCategory = (category) => {
        return checkIns.filter(checkIn => checkIn.category === category);
    };

    const deleteCheckIn = async (id) => {
        try {
            await checkInAPI.delete(id);
            setCheckIns(prev => prev.filter(checkIn => checkIn.id !== id));
        } catch (error) {
            console.error('Failed to delete check-in:', error);
            throw error;
        }
    };

    const recordMedicationTaken = async (medicationId, timeTaken, notes, user, patient) => {
        if (!patient) {
            throw new Error('No patient selected');
        }
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const takenDateTime = new Date(`${today}T${timeTaken}:00`);

            const schedules = await medicationScheduleAPI.getAll({
                patient_id: patient.id,
                medication_id: medicationId
            });

            let closestSchedule = null;
            let minDiff = Infinity;

            schedules.forEach(schedule => {
                const scheduleTime = new Date(`${today}T${schedule.time_of_day}:00`);
                const diff = Math.abs(takenDateTime.getTime() - scheduleTime.getTime());
                if (diff < minDiff) {
                    minDiff = diff;
                    closestSchedule = schedule;
                }
            });

            if (!closestSchedule) {
                await medicationAdherenceAPI.create({
                    medication_id: medicationId,
                    user_id: user?.id,
                    patient_id: patient.id,
                    scheduled_time: takenDateTime.toISOString(),
                    taken_time: takenDateTime.toISOString(),
                    status: 'taken',
                    notes: notes || 'No specific schedule found.'
                });
            } else {
                await medicationAdherenceAPI.create({
                    medication_id: medicationId,
                    user_id: user?.id,
                    patient_id: patient.id,
                    scheduled_time: new Date(`${today}T${closestSchedule.time_of_day}:00`).toISOString(),
                    taken_time: takenDateTime.toISOString(),
                    status: 'taken',
                    notes: notes
                });
            }
            await loadAdherenceData(); // Refresh adherence data after recording
        } catch (error) {
            console.error('Failed to record medication taken:', error);
            throw error;
        }
    };

    const value = {
        checkIns,
        isLoading,
        addCheckIn,
        getCheckInsByDate,
        getCheckInsByCategory,
        deleteCheckIn,
        recordMedicationTaken,
        adherences, // Expose adherences
        isAdherenceLoading, // Expose adherence loading state
        refreshAdherenceData: loadAdherenceData // Expose refresh function
    };

    return (
        <CheckInContext.Provider value={value}>
            {children}
        </CheckInContext.Provider>
    );
};

export const useCheckIn = () => {
    const context = useContext(CheckInContext);
    if (!context) {
        throw new Error('useCheckIn must be used within a CheckInProvider');
    }
    return context;
};
