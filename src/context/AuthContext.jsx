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
    const [patients, setPatients] = useState([]); // This will now *only* hold assigned patients
    const [isLoading, setIsLoading] = useState(true);

    const [isPatientSelectionRequired, setIsPatientSelectionRequired] = useState(false);

    // --- UPDATED ---
    // Check for stored user and patient on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('caregiverUser');
        
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);

            // Load this user's assigned patients from the stored object
            const assignedPatients = parsedUser.assigned_patients || [];
            setPatients(assignedPatients);

            const storedPatient = localStorage.getItem('selectedPatient');
            if (storedPatient) {
                // User has a session AND a previously selected patient
                setSelectedPatient(JSON.parse(storedPatient));
                setIsPatientSelectionRequired(false);
            } else if (assignedPatients.length > 1) {
                // User has a session, but no patient selected, and has multiple to choose from
                setIsPatientSelectionRequired(true);
            } else if (assignedPatients.length === 1) {
                // User has a session, auto-select their only patient
                selectPatient(assignedPatients[0]); // selectPatient also saves to localStorage
                setIsPatientSelectionRequired(false);
            }
            // else (0 patients), isPatientSelectionRequired remains false, app will show "no patients"
        }
        setIsLoading(false);
    }, []);

    
    // --- UPDATED ---
    const login = async (email) => {
        try {
            const userData = await authAPI.login(email);
            
            if (!userData || !userData.id) {
                throw new Error("Invalid user data received from API.");
            }

            localStorage.removeItem('selectedPatient');
            setSelectedPatient(null);
            const assignedPatients = userData.patients || []; 
            const userWithPatients = { ...userData, assigned_patients: assignedPatients };
            
            setUser(userWithPatients);
            localStorage.setItem('caregiverUser', JSON.stringify(userWithPatients));
            setPatients(assignedPatients);

            // Step 3: Run the selection logic (no change)
            if (assignedPatients.length === 1) {
                selectPatient(assignedPatients[0]);
                setIsPatientSelectionRequired(false);
            } else if (assignedPatients.length > 1) {
                setIsPatientSelectionRequired(true);
            } else {
                setIsPatientSelectionRequired(false);
            }

            return userWithPatients;
        } catch (error) {
            console.error('Login failed:', error);
            throw error; 
        }
    };

    const logout = () => {
        setUser(null);
        setSelectedPatient(null);
        setPatients([]); // Clear patient list
        setIsPatientSelectionRequired(false); // Reset flag
        localStorage.removeItem('caregiverUser');
        localStorage.removeItem('selectedPatient');
    };

    const selectPatient = (patient) => {
        setSelectedPatient(patient);
        localStorage.setItem('selectedPatient', JSON.stringify(patient));
        
        // When a patient is selected, we are no longer in the "selection required" state
        setIsPatientSelectionRequired(false);
    };

    const createPatient = async (patientData) => {
        try {
            await patientAPI.create(patientData);
            const userData = await authAPI.login(user.email); 
            setUser(userData);
            localStorage.setItem('caregiverUser', JSON.stringify(userData));

            const patientList = userData.assigned_patients || [];
            setPatients(patientList);
            const newPatient = patientList.find(p => p.name === patientData.name);
            
            if (newPatient) {
                selectPatient(newPatient); // Auto-select it
            } else if (patientList.length === 1) {
                selectPatient(patientList[0]); // Select the only one
            } else {
                // Couldn't find it, or list is > 1, show selection screen
                setIsPatientSelectionRequired(true);
            }
            return newPatient;

        } catch (error) {
            console.error('Failed to create patient:', error);
            throw error;
        }
    };

    const updatePatient = async (patientId, updates) => {
        try {
            await patientAPI.update(patientId, updates);
            const userData = await authAPI.login(user.email); 
            setUser(userData);
            localStorage.setItem('caregiverUser', JSON.stringify(userData));

            const patientList = userData.assigned_patients || [];
            setPatients(patientList);
            const updatedPatient = patientList.find(p => p.id === patientId);
            if (updatedPatient) {
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
        isPatientSelectionRequired, // --- NEWLY EXPOSED ---
        login,
        logout,
        selectedPatient,
        patients, // This is now the user's *assigned* patient list
        selectPatient,
        createPatient,
        updatePatient,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

