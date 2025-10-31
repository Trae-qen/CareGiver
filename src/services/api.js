// PDF Report API
export const reportAPI = {
    generate: async ({ patient_id, from_date, to_date }) => {
        const url = `${BASE_URL}${API_PREFIX}/reports/generate?patient_id=${patient_id}&from_date=${from_date}&to_date=${to_date}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to generate report');
        const blob = await response.blob();
        return blob;
    },
};
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
    assignAide: (patientId, userId) => fetchAPI(`/patients/${patientId}/assign-aide/${userId}`, {
    method: 'POST'
  }),
  
  removeAide: (patientId, userId) => fetchAPI(`/patients/${patientId}/remove-aide/${userId}`, {
    method: 'DELETE'
  }),
};

export const userAPI = {
  getAll: () => fetchAPI('/users'),
  getOne: (id) => fetchAPI(`/users/${id}`),
  create: (userData) => fetchAPI('/users', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  update: (id, userData) => fetchAPI(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData)
  }),
  delete: (id) => fetchAPI(`/users/${id}`, {
    method: 'DELETE'
  }),
  
  // You can add update/delete later
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

// Medication Schedule API endpoints
export const medicationScheduleAPI = {
    create: async (scheduleData) => {
        return fetchAPI('/medication-schedules', {
            method: 'POST',
            body: JSON.stringify(scheduleData),
        });
    },
    getAll: async (params = {}) => {
        const urlParams = new URLSearchParams(params).toString();
        return fetchAPI(`/medication-schedules?${urlParams}`);
    },
    update: async (id, updates) => {
        return fetchAPI(`/medication-schedules/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    },
    delete: async (id) => {
        return fetchAPI(`/medication-schedules/${id}`, {
            method: 'DELETE',
        });
    },
};

// Medication Adherence API endpoints
export const medicationAdherenceAPI = {
    create: async (adherenceData) => {
        return fetchAPI('/medication-adherence', {
            method: 'POST',
            body: JSON.stringify(adherenceData),
        });
    },
    getAll: async (params = {}) => {
        const urlParams = new URLSearchParams(params).toString();
        return fetchAPI(`/medication-adherence?${urlParams}`);
    },
};

// Symptom API endpoints
export const symptomAPI = {
    create: async (symptomData) => {
        return fetchAPI('/symptom-logs', {
            method: 'POST',
            body: JSON.stringify(symptomData),
        });
    },
    list: async (params = {}) => {
        const urlParams = new URLSearchParams(params).toString();
        return fetchAPI(`/symptom-logs?${urlParams}`);
    },
    aggregate: async (params = {}) => {
        const urlParams = new URLSearchParams(params).toString();
        return fetchAPI(`/reports/symptom-agg?${urlParams}`);
    }
};

// Push Notification API endpoints
export const pushAPI = {
    /**
     * Saves a new push subscription to the backend
     * @param {number} userId - The ID of the user
     * @param {PushSubscription} subscription - The subscription object from the browser
     */
    subscribe: async (userId, subscription) => {
        return fetchAPI('/push/subscribe', {
            method: 'POST',
            body: JSON.stringify({
                user_id: userId,
                // 'subscription_data' is what our backend will expect
                subscription_data: subscription 
            }),
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
    medicationScheduleAPI,
    medicationAdherenceAPI,
    remindersAPI,
    symptomAPI,
    reportAPI,
    pushAPI,
};
