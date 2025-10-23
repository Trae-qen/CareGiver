// Mock data for the CareGiver app
// In a real app, this would come from your FastAPI backend

export const mockCategories = [
    { id: 1, name: 'Medications', icon: 'medication' },
    { id: 2, name: 'Symptoms', icon: 'symptoms' },
    { id: 3, name: 'Measurements', icon: 'measurements' },
    { id: 4, name: 'Mood', icon: 'mood' },
    { id: 5, name: 'Activity', icon: 'activity' },
    { id: 6, name: 'Tasks', icon: 'tasks' },
];

export const mockReminders = [
    { id: 1, time: '7:30 AM', title: 'Morning Check-in', icon: 'check-in', color: 'indigo', group: 'Morning' },
    { id: 2, time: '12:00 PM', title: 'Hydration Break', icon: 'hydration', color: 'blue', group: 'Noon' },
    { id: 3, time: '8:00 PM', title: 'Evening Reflection', icon: 'reflection', color: 'purple', group: 'Evening' },
];

export const commonSymptoms = [
    'Headache',
    'Nausea',
    'Dizziness',
    'Shortness of Breath',
    'Cough',
    'Fever',
    'Fatigue',
    'Pain',
    'Swelling',
    'Rash'
];
