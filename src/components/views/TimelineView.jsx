import React, { useMemo } from 'react';
import AppIcon from '../common/AppIcon';
import EmptyState from '../common/EmptyState';
import { useCheckIn } from '../../context/CheckInContext';
import { categoryIconColors, iconColors } from '../../utils/iconColors';
import { format } from 'date-fns-tz';
import { parseISO } from 'date-fns';

const TimelineView = () => {
    const { checkIns, adherences, isLoading, isAdherenceLoading } = useCheckIn();
    
    //Debug
    console.log('Raw checkIns from context:', checkIns);

    const targetTimeZone = 'America/Chicago';

    const timelineItems = useMemo(() => {
        const combined = [
            ...checkIns.map(c => ({ ...c, type: 'check-in' })),
            ...adherences.map(a => ({ ...a, type: 'adherence', category: 'Medications' }))
        ];

        const validItems = combined.filter(item => 
            (item.type === 'check-in' && item.timestamp) || 
            (item.type === 'adherence' && item.taken_time)
        );

        validItems.sort((a, b) => {
            const timeA = parseISO(a.type === 'check-in' ? a.timestamp : a.taken_time);
            const timeB = parseISO(b.type === 'check-in' ? b.timestamp : b.taken_time);
            return timeB - timeA;
        });

        return validItems;
    }, [checkIns, adherences]);

    if (isLoading || isAdherenceLoading) {
        return <div>Loading...</div>;
    }

    if (timelineItems.length === 0) {
        return <EmptyState icon="timelineEmpty" title="No Timeline Data" message="Start adding check-ins to see your health timeline." />;
    }

    const getCategoryIcon = (item) => {
        if (item.type === 'adherence') return 'medication';
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
        return iconMap[item.category] || 'check-in';
    };

    const getDisplayText = (item) => {
        const { category, data = {}, type } = item;

        if (type === 'adherence') {
            return `Medication Taken: ${item.medication?.name || 'Unknown'}`;
        }

        const safeData = data || {};

        switch (category) {
            case 'Medications':
                return `${safeData.name || 'Medication'}${safeData.dosage ? ` - ${safeData.dosage}` : ''}`;
            case 'Symptoms':
                return `${safeData.symptom || 'Symptom'} (Severity: ${safeData.severity || 'N/A'})`;
            case 'Measurements':
                return `${safeData.type || 'Measurement'}${safeData.value ? `: ${safeData.value}` : ''}${safeData.unit ? ` ${safeData.unit}` : ''}`;
            case 'Tasks':
                return `${safeData.task || 'Task'}${safeData.status ? ` - ${safeData.status}` : ''}`;
            case 'Activity':
                return `${safeData.type || 'Activity'}: ${safeData.duration || '0'} mins${safeData.details ? ` - ${safeData.details}` : ''}`;
            case 'Nutrition':
                return `${safeData.meal || 'Meal'}: ${safeData.description || ''}${safeData.amount ? ` (${safeData.amount})` : ''}`;
            case 'Sleep':
                return `Sleep: ${safeData.quality || 'N/A'} - ${safeData.duration || '0'} hours${safeData.notes ? ` - ${safeData.notes}` : ''}`;
            case 'Mood':
                const moods = ['😢', '😟', '😐', '🙂', '😄'];
                return `Mood: ${moods[safeData.mood - 1] || '😐'}`;
            default:
                return safeData.notes || safeData.task || category || 'Entry';
        }
    };

    const groupedByDate = timelineItems.reduce((acc, item) => {
        const itemTime = parseISO(item.type === 'check-in' ? item.timestamp : item.taken_time);
        const date = format(itemTime, 'yyyy-MM-dd', { timeZone: targetTimeZone });
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(item);
        return acc;
    }, {});

    return (
        <div className="p-4 bg-gray-50 min-h-full">
            <header className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Timeline</h1>
                <span className="text-sm font-medium text-gray-500">{timelineItems.length} entries</span>
            </header>

            <div className="space-y-6">
                {Object.entries(groupedByDate).map(([date, items]) => (
                    <div key={date}>
                        <div className="flex items-center mb-3">
                            <div className="flex-shrink-0 w-2 h-2 bg-gray-800 rounded-full mr-3"></div>
                            
                            {/* CHANGED: Format the date header */}
                            {/* We parse the 'yyyy-MM-dd' string and format it. */}
                            {/* We use timeZone: 'UTC' here to prevent 'parseISO' from shifting the date */}
                            {/* to the previous day (e.g., '2025-10-27' becoming '2025-10-26'). */}
                            <h2 className="text-sm font-bold text-gray-700 uppercase">
                                {format(parseISO(date), 'MMMM d, yyyy', { timeZone: 'UTC' })}
                            </h2>

                            <div className="flex-1 h-px bg-gray-200 ml-3"></div>
                        </div>
                        
                        <div className="ml-5 border-l-2 border-gray-200 pl-4 space-y-3">
                            {items.map(item => {
                                const category = item.type === 'adherence' ? 'Medications' : item.category;
                                const colors = categoryIconColors[category] || iconColors.slate;

                                //DEBUG:
                                const rawTimestamp = item.type === 'check-in' ? item.timestamp : item.taken_time;
                                console.log('--- DEBUGGING TIMEZONE ---');
                                console.log('Raw Timestamp:', rawTimestamp);
                                console.log('Parsed Date Object:', parseISO(rawTimestamp));


                                // CHANGED: Format the time using the target timezone
                                const time = format(
                                    parseISO(item.type === 'check-in' ? item.timestamp : item.taken_time), 
                                    'p', // 'p' is the token for localized time, e.g., "10:57 AM"
                                    { timeZone: targetTimeZone }
                                );
                                
                                return (
                                    <div key={item.type === 'check-in' ? item.timestamp : item.taken_time} className="bg-white p-4 rounded-xl shadow-sm relative">
                                        {/* ... (rest of the component is the same) ... */}
                                        <div className="absolute -left-[1.65rem] top-4 w-3 h-3 bg-white border-2 border-gray-300 rounded-full"></div>
                                        <div className="flex items-start">
                                            <div className={`w-10 h-10 flex items-center justify-center rounded-lg mr-3 flex-shrink-0 ${colors.bg}`}>
                                                <AppIcon name={getCategoryIcon(item)} className={`w-6 h-6 ${colors.text}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-semibold text-gray-500 uppercase">{category}</span>
                                                    <span className="text-xs text-gray-400">{time}</span>
                                                </div>
                                                <p className="text-sm font-medium text-gray-800 mb-1">{getDisplayText(item)}</p>
                                                {item.user && (
                                                    <div className="flex flex-col gap-1 mt-2 border-t border-gray-100 pt-2">
                                                        <p className="text-xs text-blue-600 flex items-center">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                            </svg>
                                                            <span className="font-medium">{item.user.name}</span>
                                                            <span className="text-gray-400 ml-1">({item.user.role || 'Caregiver'})</span>
                                                        </p>
                                                    </div>
                                                )}
                                                
                                                {(item.data?.notes || item.notes) && (
                                                    <div className="mt-2">
                                                        <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                                            <span className="font-medium">Notes:</span> {item.data?.notes || item.notes}
                                                        </p>
                                                    </div>
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
