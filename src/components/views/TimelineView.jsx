import React from 'react';
import AppIcon from '../common/AppIcon';
import EmptyState from '../common/EmptyState';
import { useCheckIn } from '../../context/CheckInContext';
import { categoryIconColors, iconColors } from '../../utils/iconColors';

const TimelineView = () => {
    const { checkIns } = useCheckIn();

    if (checkIns.length === 0) {
        return <EmptyState icon="timelineEmpty" title="No Timeline Data" message="Start adding check-ins to see your health timeline." />;
    }

    const getCategoryIcon = (category) => {
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

    const getDisplayText = (checkIn) => {
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

    // Group check-ins by date
    const groupedByDate = checkIns.reduce((acc, checkIn) => {
        if (!acc[checkIn.date]) {
            acc[checkIn.date] = [];
        }
        acc[checkIn.date].push(checkIn);
        return acc;
    }, {});

    return (
        <div className="p-4 bg-gray-50 min-h-full">
            <header className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Timeline</h1>
                <span className="text-sm font-medium text-gray-500">{checkIns.length} entries</span>
            </header>

            <div className="space-y-6">
                {Object.entries(groupedByDate).map(([date, dateCheckIns]) => (
                    <div key={date}>
                        <div className="flex items-center mb-3">
                            <div className="flex-shrink-0 w-2 h-2 bg-gray-800 rounded-full mr-3"></div>
                            <h2 className="text-sm font-bold text-gray-700 uppercase">{date}</h2>
                            <div className="flex-1 h-px bg-gray-200 ml-3"></div>
                        </div>
                        
                        <div className="ml-5 border-l-2 border-gray-200 pl-4 space-y-3">
                            {dateCheckIns.map(checkIn => {
                                const colors = categoryIconColors[checkIn.category] || iconColors.slate;
                                
                                return (
                                    <div key={checkIn.id} className="bg-white p-4 rounded-xl shadow-sm relative">
                                        <div className="absolute -left-[1.65rem] top-4 w-3 h-3 bg-white border-2 border-gray-300 rounded-full"></div>
                                        <div className="flex items-start">
                                            <div className={`w-10 h-10 flex items-center justify-center rounded-lg mr-3 flex-shrink-0 ${colors.bg}`}>
                                                <AppIcon name={getCategoryIcon(checkIn.category)} className={`w-6 h-6 ${colors.text}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-semibold text-gray-500 uppercase">{checkIn.category}</span>
                                                    <span className="text-xs text-gray-400">{checkIn.time}</span>
                                                </div>
                                                <p className="text-sm font-medium text-gray-800 mb-1">{getDisplayText(checkIn)}</p>
                                                
                                                {checkIn.user && (
                                                    <p className="text-xs text-blue-600 mt-1 flex items-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                        By {checkIn.user.name}
                                                    </p>
                                                )}
                                                
                                                {checkIn.data.notes && (
                                                    <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">{checkIn.data.notes}</p>
                                                )}
                                                
                                                {/* Display additional details based on category */}
                                                {checkIn.category === 'Medications' && checkIn.data.time && (
                                                    <p className="text-xs text-gray-500 mt-1">Taken at: {checkIn.data.time}</p>
                                                )}
                                                {checkIn.category === 'Symptoms' && checkIn.data.description && (
                                                    <p className="text-xs text-gray-500 mt-1">{checkIn.data.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TimelineView;
