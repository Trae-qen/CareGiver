import React, { createContext, useContext, useState, useEffect } from 'react';
import { checkInAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CheckInContext = createContext();

export const useCheckIn = () => {
    const context = useContext(CheckInContext);
    if (!context) {
        throw new Error('useCheckIn must be used within a CheckInProvider');
    }
    return context;
};

export const CheckInProvider = ({ children }) => {
    const { selectedPatient } = useAuth();
    const [checkIns, setCheckIns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load check-ins when patient changes
    useEffect(() => {
        if (selectedPatient) {
            loadCheckIns();
        } else {
            setCheckIns([]);
            setIsLoading(false);
        }
    }, [selectedPatient]);

    const loadCheckIns = async () => {
        try {
            setIsLoading(true);
            const data = await checkInAPI.getAll();
            // Filter by selected patient
            const patientCheckIns = data.filter(c => c.patient_id === selectedPatient.id);
            setCheckIns(patientCheckIns);
        } catch (error) {
            console.error('Failed to load check-ins:', error);
        } finally {
            setIsLoading(false);
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

    const value = {
        checkIns,
        isLoading,
        addCheckIn,
        getCheckInsByDate,
        getCheckInsByCategory,
        deleteCheckIn
    };

    return (
        <CheckInContext.Provider value={value}>
            {children}
        </CheckInContext.Provider>
    );
};
