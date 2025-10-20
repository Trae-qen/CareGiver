import React, { createContext, useContext, useState, useEffect } from 'react';
import { medicationAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CarePlanContext = createContext();

export const useCarePlan = () => {
    const context = useContext(CarePlanContext);
    if (!context) {
        throw new Error('useCarePlan must be used within a CarePlanProvider');
    }
    return context;
};

export const CarePlanProvider = ({ children }) => {
    const { selectedPatient, updatePatient } = useAuth();
    const [medications, setMedications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load medications when patient changes
    useEffect(() => {
        if (selectedPatient) {
            loadMedications();
        } else {
            setMedications([]);
            setIsLoading(false);
        }
    }, [selectedPatient]);

    const loadMedications = async () => {
        try {
            setIsLoading(true);
            const data = await medicationAPI.getAll(selectedPatient.id, false);
            setMedications(data);
        } catch (error) {
            console.error('Failed to load medications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addMedication = async (medication) => {
        if (!selectedPatient) {
            throw new Error('No patient selected');
        }
        try {
            const newMed = await medicationAPI.create({
                patient_id: selectedPatient.id,
                ...medication,
                active: true
            });
            setMedications(prev => [...prev, newMed]);
            return newMed;
        } catch (error) {
            console.error('Failed to add medication:', error);
            throw error;
        }
    };

    const updateMedication = async (id, updates) => {
        try {
            const updatedMed = await medicationAPI.update(id, {
                patient_id: selectedPatient.id,
                ...updates
            });
            setMedications(prev => prev.map(med => 
                med.id === id ? updatedMed : med
            ));
        } catch (error) {
            console.error('Failed to update medication:', error);
            throw error;
        }
    };

    const deleteMedication = async (id) => {
        try {
            await medicationAPI.delete(id);
            setMedications(prev => prev.filter(med => med.id !== id));
        } catch (error) {
            console.error('Failed to delete medication:', error);
            throw error;
        }
    };

    const getActiveMedications = () => {
        return medications.filter(med => med.active);
    };

    const updatePatientInfo = async (updates) => {
        if (!selectedPatient) {
            throw new Error('No patient selected');
        }
        try {
            await updatePatient(selectedPatient.id, updates);
        } catch (error) {
            console.error('Failed to update patient info:', error);
            throw error;
        }
    };

    const value = {
        medications,
        patientInfo: selectedPatient,
        isLoading,
        addMedication,
        updateMedication,
        deleteMedication,
        getActiveMedications,
        updatePatientInfo
    };

    return (
        <CarePlanContext.Provider value={value}>
            {children}
        </CarePlanContext.Provider>
    );
};
