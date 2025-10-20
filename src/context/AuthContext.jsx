import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, patientAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patients, setPatients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Check for stored user and patient on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('caregiverUser');
        const storedPatient = localStorage.getItem('selectedPatient');
        
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        if (storedPatient) {
            setSelectedPatient(JSON.parse(storedPatient));
        }
        setIsLoading(false);
    }, []);

    // Load patients when user logs in
    useEffect(() => {
        if (user) {
            loadPatients();
        }
    }, [user]);

    const loadPatients = async () => {
        try {
            const data = await patientAPI.getAll();
            setPatients(data);
            
            // If no patient selected but patients exist, select the first one
            if (!selectedPatient && data.length > 0) {
                selectPatient(data[0]);
            }
        } catch (error) {
            console.error('Failed to load patients:', error);
        }
    };

    const login = async (email) => {
        try {
            // Call FastAPI backend
            const userData = await authAPI.login(email);
            
            setUser(userData);
            localStorage.setItem('caregiverUser', JSON.stringify(userData));
            return userData;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        setSelectedPatient(null);
        localStorage.removeItem('caregiverUser');
        localStorage.removeItem('selectedPatient');
    };

    const selectPatient = (patient) => {
        setSelectedPatient(patient);
        localStorage.setItem('selectedPatient', JSON.stringify(patient));
    };

    const createPatient = async (patientData) => {
        try {
            const newPatient = await patientAPI.create(patientData);
            setPatients(prev => [...prev, newPatient]);
            selectPatient(newPatient);
            return newPatient;
        } catch (error) {
            console.error('Failed to create patient:', error);
            throw error;
        }
    };

    const updatePatient = async (patientId, updates) => {
        try {
            const updatedPatient = await patientAPI.update(patientId, updates);
            setPatients(prev => prev.map(p => p.id === patientId ? updatedPatient : p));
            if (selectedPatient?.id === patientId) {
                selectPatient(updatedPatient);
            }
            return updatedPatient;
        } catch (error) {
            console.error('Failed to update patient:', error);
            throw error;
        }
    };

    const extractNameFromEmail = (email) => {
        // Extract name from email (e.g., john.doe@example.com -> John Doe)
        const username = email.split('@')[0];
        return username
            .split(/[._-]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const value = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        selectedPatient,
        patients,
        selectPatient,
        createPatient,
        updatePatient,
        loadPatients
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
