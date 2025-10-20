import React, { useState, useMemo } from 'react';
import AppIcon from '../common/AppIcon';
import { useCheckIn } from '../../context/CheckInContext';
import { useCarePlan } from '../../context/CarePlanContext';
import { useAuth } from '../../context/AuthContext';
import { mockReminders } from '../../data/mockData';
import { iconColors, categoryIconColors } from '../../utils/iconColors';

const TodayView = () => {
    const { getCheckInsByDate, addCheckIn } = useCheckIn();
    const { getActiveMedications } = useCarePlan();
    const { user } = useAuth();
    const [date, setDate] = useState(new Date());
    const [checkedState, setCheckedState] = useState({});
    
    const todayCheckIns = getCheckInsByDate(date);
    const activeMedications = getActiveMedications();

    const handleCheck = (id) => {
        setCheckedState(prevState => ({ ...prevState, [id]: !prevState[id] }));
    };

    const handleMedicationCheck = (medication) => {
        // Create a check-in entry for this medication
        const now = new Date();
        const medicationData = {
            name: medication.name,
            dosage: medication.dosage,
            time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
            notes: `Administered as scheduled (${medication.frequency})`
        };
        
        addCheckIn('Medications', medicationData, user);
    };

    const days = useMemo(() => {
        const d = new Date(date);
        d.setDate(d.getDate() - 2);
        return Array.from({ length: 7 }, (_, i) => {
            const newDate = new Date(d);
            newDate.setDate(d.getDate() + i);
            return {
                day: newDate.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
                date: newDate.getDate(),
                isToday: newDate.getDate() === date.getDate()
            };
        });
    }, [date]);

    const groupedReminders = mockReminders.reduce((acc, reminder) => {
        const group = reminder.group;
        if (!acc[group]) {
            acc[group] = [];
        }
        acc[group].push(reminder);
        return acc;
    }, {});

    return (
        <div className="p-4 bg-gray-50 min-h-full">
            <header className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                     <AppIcon name="info" className="w-6 h-6 text-gray-400" />
                </div>
                <h1 className="text-xl font-bold text-gray-800">
                    {date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h1>
                <div className="flex items-center space-x-2">
                     <AppIcon name="reminders" className="w-6 h-6 text-red-500" />
                </div>
            </header>
            
            <div className="flex justify-between mb-8 px-2">
                {days.map((d, i) => (
                    <div key={i} className={`text-center p-2 rounded-lg w-10 ${d.isToday ? 'bg-gray-800 text-white' : ''}` }>
                        <p className="text-xs font-medium text-gray-400">{d.day}</p>
                        <p className="font-bold">{d.date}</p>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Reminders</h2>
                <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-500">3 Left</span>
                    <AppIcon name="moreDots" className="w-5 h-5 text-gray-400" />
                </div>
            </div>

            {/* Medication Reminders */}
            {activeMedications.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center space-x-2 text-gray-500 mb-2">
                        <AppIcon name="medication" className="w-5 h-5" />
                        <h3 className="text-sm font-semibold">Medications</h3>
                    </div>
                    {activeMedications.map(med => {
                        const medId = `med-${med.id}`;
                        const isCompleted = todayCheckIns.some(
                            checkIn => checkIn.category === 'Medications' && checkIn.data.name === med.name
                        );
                        return (
                            <div key={med.id} className="bg-white p-4 rounded-xl shadow-sm mb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center flex-1">
                                        <div className="w-12 text-sm font-semibold text-gray-700">{med.time}</div>
                                        <div className="w-10 h-10 flex items-center justify-center rounded-lg mr-4 bg-violet-100">
                                            <AppIcon name="medication" className="w-6 h-6 text-violet-600" />
                                        </div>
                                        <div className="flex-1">
                                            <span className={`font-medium text-gray-800 ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                                                {med.name}
                                            </span>
                                            <p className="text-xs text-gray-500">{med.dosage} - {med.frequency}</p>
                                        </div>
                                    </div>
                                    {isCompleted ? (
                                        <div className="w-6 h-6 rounded-md border-2 flex items-center justify-center bg-green-500 border-green-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => handleMedicationCheck(med)} 
                                            className="w-6 h-6 rounded-md border-2 border-gray-300 flex items-center justify-center transition-colors hover:border-blue-400 hover:bg-blue-50"
                                        >
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Other Reminders */}
            {Object.entries(groupedReminders).map(([group, reminders]) => (
                <div key={group} className="mb-6">
                    <div className="flex items-center space-x-2 text-gray-500 mb-2">
                        <AppIcon name={group.toLowerCase()} className="w-5 h-5" />
                        <h3 className="text-sm font-semibold">{group}</h3>
                    </div>
                    {reminders.map(reminder => (
                         <div key={reminder.id} className="bg-white p-4 rounded-xl shadow-sm mb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-12 text-sm font-semibold text-gray-700">{reminder.time}</div>
                                    <div className="w-10 h-10 flex items-center justify-center rounded-lg mr-4" style={{ backgroundColor: iconColors[reminder.color]?.bg || 'bg-gray-100' }}>
                                        <AppIcon name={reminder.icon} className="w-6 h-6" style={{ color: iconColors[reminder.color]?.text || 'text-gray-600' }} />
                                    </div>
                                    <span className={`font-medium text-gray-800 ${checkedState[reminder.id] ? 'line-through text-gray-400' : ''}` }>{reminder.title}</span>
                                </div>
                                <button onClick={() => handleCheck(reminder.id)} className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${checkedState[reminder.id] ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}` }>
                                    {checkedState[reminder.id] && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ))}

            {todayCheckIns.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-gray-800">Today's Check-Ins</h2>
                        <span className="text-sm font-medium text-gray-500">{todayCheckIns.length}</span>
                    </div>
                    <div className="space-y-3">
                        {todayCheckIns.map(checkIn => {
                            const colors = categoryIconColors[checkIn.category] || iconColors.slate;
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

                            return (
                                <div key={checkIn.id} className="bg-white p-4 rounded-xl shadow-sm">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start flex-1">
                                            <div className={`w-10 h-10 flex items-center justify-center rounded-lg mr-3 ${colors.bg}`}>
                                                <AppIcon name={getCategoryIcon(checkIn.category)} className={`w-6 h-6 ${colors.text}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-semibold text-gray-500 uppercase">{checkIn.category}</span>
                                                    <span className="text-xs text-gray-400">{checkIn.time}</span>
                                                </div>
                                                <p className="text-sm font-medium text-gray-800">{getDisplayText(checkIn)}</p>
                                                {checkIn.user && (
                                                    <p className="text-xs text-blue-600 mt-1 flex items-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                        By {checkIn.user.name}
                                                    </p>
                                                )}
                                                {checkIn.data.notes && (
                                                    <p className="text-xs text-gray-500 mt-1">{checkIn.data.notes}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TodayView;
