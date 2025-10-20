// API service for connecting to FastAPI backend
// Update the BASE_URL when you deploy your FastAPI server

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_PREFIX = '/api';

// Generic fetch wrapper with error handling
const fetchAPI = async (endpoint, options = {}) => {
    const url = `${BASE_URL}${API_PREFIX}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'API request failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// Check-in API endpoints
export const checkInAPI = {
    // Get all check-ins
    getAll: async () => {
        return fetchAPI('/checkins');
    },

    // Get check-ins by date
    getByDate: async (date) => {
        const dateString = new Date(date).toISOString().split('T')[0];
        return fetchAPI(`/checkins?date=${dateString}`);
    },

    // Get check-ins by category
    getByCategory: async (category) => {
        return fetchAPI(`/checkins?category=${category}`);
    },

    // Create a new check-in
    create: async (category, data, userId, patientId) => {
        return fetchAPI('/checkins', {
            method: 'POST',
            body: JSON.stringify({
                user_id: userId,
                patient_id: patientId,
                category,
                data,
            }),
        });
    },

    // Update a check-in
    update: async (id, updates) => {
        return fetchAPI(`/checkins/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    },

    // Delete a check-in
    delete: async (id) => {
        return fetchAPI(`/checkins/${id}`, {
            method: 'DELETE',
        });
    },
};

// Authentication API endpoints
export const authAPI = {
    // Login with email
    login: async (email) => {
        return fetchAPI(`/auth/login?email=${encodeURIComponent(email)}`, {
            method: 'POST',
        });
    },

    // Verify user exists in database
    verifyUser: async (email) => {
        return fetchAPI(`/auth/verify?email=${email}`);
    },

    // Logout
    logout: async () => {
        return fetchAPI('/auth/logout', {
            method: 'POST',
        });
    },
};

// Patient API endpoints
export const patientAPI = {
    getAll: async () => {
        return fetchAPI('/patients');
    },

    getById: async (id) => {
        return fetchAPI(`/patients/${id}`);
    },

    create: async (patientData) => {
        return fetchAPI('/patients', {
            method: 'POST',
            body: JSON.stringify(patientData),
        });
    },

    update: async (id, updates) => {
        return fetchAPI(`/patients/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    },
};

// Medication API endpoints
export const medicationAPI = {
    getAll: async (patientId, activeOnly = false) => {
        const params = new URLSearchParams();
        if (patientId) params.append('patient_id', patientId);
        if (activeOnly) params.append('active_only', 'true');
        return fetchAPI(`/medications?${params.toString()}`);
    },

    create: async (medicationData) => {
        return fetchAPI('/medications', {
            method: 'POST',
            body: JSON.stringify(medicationData),
        });
    },

    update: async (id, updates) => {
        return fetchAPI(`/medications/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    },

    delete: async (id) => {
        return fetchAPI(`/medications/${id}`, {
            method: 'DELETE',
        });
    },
};

// Reminders API endpoints
export const remindersAPI = {
    getAll: async () => {
        return fetchAPI('/reminders');
    },

    create: async (reminderData) => {
        return fetchAPI('/reminders', {
            method: 'POST',
            body: JSON.stringify(reminderData),
        });
    },

    update: async (id, updates) => {
        return fetchAPI(`/reminders/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    },

    delete: async (id) => {
        return fetchAPI(`/reminders/${id}`, {
            method: 'DELETE',
        });
    },
};

// Example usage in CheckInView.jsx:
/*
import { checkInAPI } from '../../services/api';

const handleSave = async (data) => {
    try {
        const result = await checkInAPI.create(selectedCategory, data);
        console.log('Saved to backend:', result);
        // Update local state
        addCheckIn(selectedCategory, data);
    } catch (error) {
        console.error('Failed to save:', error);
        alert('Failed to save check-in. Please try again.');
    }
};
*/

export default {
    authAPI,
    checkInAPI,
    patientAPI,
    medicationAPI,
    remindersAPI,
};
