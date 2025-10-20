// Helper functions for displaying check-in data

export const getCategoryIcon = (category) => {
    const iconMap = {
        'Medications': 'medication',
        'Symptoms': 'symptoms',
        'Measurements': 'measurements',
        'Factors': 'factors',
        'Mood': 'mood',
        'Nutrition': 'nutrition',
        'Activity': 'activity',
        'Sleep': 'sleep',
        'Tasks': 'tasks'
    };
    return iconMap[category] || 'check-in';
};

export const getDisplayText = (checkIn) => {
    const { category, data } = checkIn;
    switch (category) {
        case 'Medications':
            return `${data.name || 'Medication'} - ${data.dosage || ''}`;
        case 'Symptoms':
            return `${data.symptom || 'Symptom'} (Severity: ${data.severity || 'N/A'})`;
        case 'Measurements':
            return `${data.type || 'Measurement'}: ${data.value || ''}`;
        case 'Tasks':
            return `${data.task || 'Task'} - ${data.completedBy || 'Completed'}`;
        case 'Mood':
            const moods = ['😢', '😟', '😐', '🙂', '😄'];
            return `Mood: ${moods[data.mood - 1] || '😐'}`;
        default:
            return data.notes || category;
    }
};
