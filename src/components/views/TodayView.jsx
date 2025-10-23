import React, { useMemo, useEffect, useState } from 'react';
import { medicationScheduleAPI, medicationAdherenceAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import SymptomHistoryChart from './SymptomHistoryChart';
import AppIcon from '../common/AppIcon';
import { useCheckIn } from '../../context/CheckInContext';
import { useCarePlan } from '../../context/CarePlanContext';
// import { mockReminders } from '../../data/mockData';
import { iconColors, categoryIconColors } from '../../utils/iconColors';

const TodayView = () => {
    const { getCheckInsByDate, adherences, isAdherenceLoading, refreshAdherenceData } = useCheckIn();
    const { getActiveMedications } = useCarePlan();
    const { user, selectedPatient } = useAuth();

    // Medication schedules state (still local, as CheckInContext only manages adherence records)
    const [todaySchedules, setTodaySchedules] = useState([]);
    const [loadingSchedules, setLoadingSchedules] = useState(true);

    const fetchSchedules = async () => {
        if (!selectedPatient) return;
        const todayStr = new Date().toISOString().split('T')[0];
        setLoadingSchedules(true);
        try {
            const schedules = await medicationScheduleAPI.getAll({ patient_id: selectedPatient.id });
            const filteredSchedules = schedules.filter(sch => sch.recurrence_rule === 'daily' || sch.recurrence_rule === 'as_needed' || (sch.next_run && sch.next_run.startsWith(todayStr)));
            setTodaySchedules(filteredSchedules);
        } catch (error) {
            console.error('TodayView: Failed to fetch schedules:', error);
        } finally {
            setLoadingSchedules(false);
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, [selectedPatient]); // Re-fetch schedules when selectedPatient changes

    const handleAdherence = async (schedule, status) => {
        if (!user || !selectedPatient) {
            return;
        }
        const today = new Date();
        const scheduledTime = new Date();
        const [h, m] = schedule.time_of_day.split(':');
        scheduledTime.setHours(Number(h), Number(m), 0, 0);
        try {
            await medicationAdherenceAPI.create({
                medication_id: schedule.medication_id,
                user_id: user.id,
                patient_id: selectedPatient.id,
                scheduled_time: scheduledTime.toISOString(),
                taken_time: status === 'taken' ? today.toISOString() : null,
                status,
                notes: ''
            });
            refreshAdherenceData(); // Refresh adherence data from CheckInContext
        } catch (error) {
            console.error('TodayView: Failed to create adherence record:', error);
        }
    };
    const date = new Date(); // Removed state since we're not allowing date changes

    const todayCheckIns = getCheckInsByDate(date);
    const activeMedications = getActiveMedications();
    // Deduplicate medications by id (or name+dosage fallback) in case backend returns duplicates
    const uniqueActiveMedications = (() => {
        const map = new Map();
        activeMedications.forEach(med => {
            const key = med.id ?? `${med.name}-${med.dosage}`;
            if (!map.has(key)) map.set(key, med);
        });
        const meds = Array.from(map.values());
        return meds;
    })();

    // Check-in functionality has been moved to the dedicated CheckIn screen

    const days = useMemo(() => {
        // Build a 7-day range centered on `date` (2 days before to 4 days after)
        const start = new Date(date);
        start.setDate(start.getDate() - 2);
        return Array.from({ length: 7 }, (_, i) => {
            const newDate = new Date(start);
            newDate.setDate(start.getDate() + i);
            const newDateStr = newDate.toISOString().split('T')[0];
            const activeDateStr = new Date(date).toISOString().split('T')[0];
            return {
                dateObj: newDate,
                day: newDate.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
                date: newDate.getDate(),
                iso: newDateStr,
                isToday: newDateStr === activeDateStr
            };
        });
    }, [date]);

    // Generate reminders for each scheduled medication for today
    const medReminders = todaySchedules.map(sch => {
        const med = uniqueActiveMedications.find(m => m.id === sch.medication_id);
        // sch.time_of_day expected like '08:00' or '8:00'
        const parts = (sch.time_of_day || '').split(':');
        let postTimeLabel = sch.time_of_day || '';
        try {
            const medHour = parseInt(parts[0], 10);
            const medMin = parseInt(parts[1] || '0', 10);
            const baseDate = new Date(date);
            baseDate.setHours(medHour, medMin, 0, 0);
            const postDate = new Date(baseDate.getTime() + 60 * 60 * 1000);
            postTimeLabel = postDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        } catch (e) {
            postTimeLabel = sch.time_of_day || '';
        }

        return {
            id: `postmed-${sch.id}`,
            time: postTimeLabel,
            title: `Post-med check for ${med?.name || 'Medication'}`,
            icon: 'check-in',
            color: 'indigo',
            group: 'Post-Med'
        };
    });

    const allReminders = [...medReminders];

    const groupedReminders = allReminders.reduce((acc, reminder) => {
        const group = reminder.group || 'General';
        if (!acc[group]) acc[group] = [];
        acc[group].push(reminder);
        return acc;
    }, {});

    return (
        <div className="p-4 bg-gray-50 min-h-full">
            <SymptomHistoryChart />
            <header className="flex items-center justify-center mb-6">
                <h1 className="text-xl font-bold text-gray-800">
                    {date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h1>
            </header>

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Reminders</h2>
                <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-500">3 Left</span>
                    <AppIcon name="moreDots" className="w-5 h-5 text-gray-400" />
                </div>
            </div>

            {/* Medication Adherence Logging */}
            <div className="mb-6">
                <div className="flex items-center space-x-2 text-gray-500 mb-2">
                    <AppIcon name="medication" className="w-5 h-5" />
                    <h3 className="text-sm font-semibold">Today's Medication Schedules</h3>
                </div>
                {isAdherenceLoading || loadingSchedules ? (
                    <div>Loading schedules...</div>
                ) : todaySchedules.length === 0 ? (
                    <div className="text-gray-500">No medication schedules for today.</div>
                ) : (
                    todaySchedules.map(sch => {
                        const med = uniqueActiveMedications.find(m => m.id === sch.medication_id);
                        // Compare local time strings for adherence matching
                        const adherence = adherences.find(a => 
                            a.medication_id === sch.medication_id && 
                            new Date(a.scheduled_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) === sch.time_of_day
                        );
                        return (
                            <div key={sch.id} className="bg-white p-4 rounded-xl shadow-sm mb-3 flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-12 text-sm font-semibold text-gray-700">{sch.time_of_day}</div>
                                    <div className="w-10 h-10 flex items-center justify-center rounded-lg mr-4 bg-violet-100">
                                        <AppIcon name="medication" className="w-6 h-6 text-violet-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-800">{med?.name || 'Medication'}</span>
                                        <p className="text-xs text-gray-500">{med?.dosage || ''}</p>
                                    </div>
                                </div>
                                {adherence ? (
                                    <span className={`text-xs px-2 py-1 rounded ${adherence.status === 'taken' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {adherence.status === 'taken' ? 'Taken' : 'Skipped'}
                                    </span>
                                ) : null}
                            </div>
                        );
                    })
                )}
            </div>

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
                                <div className="flex items-center flex-1">
                                    <div className="w-12 text-sm font-semibold text-gray-700">{reminder.time}</div>
                                    <div className="w-10 h-10 flex items-center justify-center rounded-lg mr-4" style={{ backgroundColor: iconColors[reminder.color]?.bg || 'bg-gray-100' }}>
                                        <AppIcon name={reminder.icon} className="w-6 h-6" style={{ color: iconColors[reminder.color]?.text || 'text-gray-600' }} />
                                    </div>
                                    <span className="font-medium text-gray-800">{reminder.title}</span>
                                </div>
                                {reminder.completed && (
                                    <div className="w-6 h-6 rounded-md border-2 flex items-center justify-center bg-blue-500 border-blue-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
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
