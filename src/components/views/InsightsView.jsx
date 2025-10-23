import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useCheckIn } from '../../context/CheckInContext'; // Import useCheckIn
import { reportAPI, medicationScheduleAPI, medicationAdherenceAPI } from '../../services/api';
import AppIcon from '../common/AppIcon';
import EmptyState from '../common/EmptyState';

const InsightsView = ({ showEmptyState }) => {
   const { selectedPatient } = useAuth();
   const { adherences, isAdherenceLoading } = useCheckIn();
   const [fromDate, setFromDate] = useState(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
   const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
   const [downloading, setDownloading] = useState(false);
   const [adherenceData, setAdherenceData] = useState([]);
   const [schedules, setSchedules] = useState([]); // Local state for schedules

   // Fetch schedules (adherences are now from context)
   useEffect(() => {
      if (showEmptyState || !selectedPatient) return;

      medicationScheduleAPI.getAll({ patient_id: selectedPatient.id, from_date: fromDate, to_date: toDate })
         .then(data => setSchedules(data))
         .catch(error => console.error('InsightsView: Failed to fetch schedules:', error));
   }, [showEmptyState, selectedPatient, fromDate, toDate]);

   // Process adherence data when schedules or context adherences change
   useEffect(() => {
      if (showEmptyState || !selectedPatient || isAdherenceLoading) {
         console.log('InsightsView: Skipping data processing.', { showEmptyState, selectedPatient, isAdherenceLoading });
         return;
      }
      
      console.log('InsightsView: Processing data...', { schedules, adherences });

      // Helper to get dates between two dates (inclusive)
      const getDatesInRange = (start, end) => {
         const dates = [];
         let currentDate = new Date(start);
         while (currentDate <= new Date(end)) {
            dates.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
         }
         return dates;
      };

      const allDatesInRange = getDatesInRange(fromDate, toDate);

      // Build a map of date -> scheduled meds
      const dateMap = {};
      allDatesInRange.forEach(date => {
         dateMap[date] = schedules.filter(sch => {
            if (sch.recurrence_rule === 'daily') return true;
            const scheduleDate = sch.next_run ? sch.next_run.split('T')[0] : new Date(sch.created_at).toISOString().split('T')[0];
            return scheduleDate === date;
         });
      });

      // Build a map of date -> taken/skipped
      const adherenceMap = {};
      adherences.forEach(a => {
         const date = new Date(a.scheduled_time).toISOString().split('T')[0];
         if (!adherenceMap[date]) adherenceMap[date] = [];
         adherenceMap[date].push(a);
      });

      // For each date, calculate missed and completion %
      const chartData = allDatesInRange.map(date => {
         const scheduled = dateMap[date] || [];
         const adherencesForDate = adherenceMap[date] || [];
         const taken = adherencesForDate.filter(a => a.status === 'taken').length;
         const missed = scheduled.length - taken;
         const completion = scheduled.length > 0 ? Math.round((taken / scheduled.length) * 100) : 0;
         return {
            date,
            scheduled: scheduled.length,
            taken,
            missed: missed < 0 ? 0 : missed,
            completion
         };
      });
      
      console.log('InsightsView: Processed chart data:', chartData);
      setAdherenceData(chartData);
   }, [showEmptyState, selectedPatient, fromDate, toDate, schedules, adherences, isAdherenceLoading]); // Add adherences and isAdherenceLoading to dependencies

   const handleDownload = async () => {
      if (!selectedPatient) return;
      setDownloading(true);
      try {
         const blob = await reportAPI.generate({ patient_id: selectedPatient.id, from_date: fromDate, to_date: toDate });
         const url = window.URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = `patient_report_${fromDate}_to_${toDate}.pdf`;
         document.body.appendChild(a);
         a.click();
         a.remove();
         window.URL.revokeObjectURL(url);
      } catch (e) {
         alert('Failed to download report.');
      } finally {
         setDownloading(false);
      }
   };

   // This conditional return is now safe because all hooks (useState, useEffect)
   // have already been called.
   if (showEmptyState) {
      return (
         <div className="p-4 bg-gray-50 min-h-full">
            <header className="flex items-center justify-between mb-6 text-gray-800">
               <AppIcon name="info" className="w-6 h-6" />
               <h1 className="text-xl font-bold">Medications</h1>
               <div></div>
            </header>
            <EmptyState
               icon="chartEmpty"
               title="No Data for Charts"
               message="No check-ins found for the current date range. Add data to view charts and reports."
               actionText="Add Data"
               onAction={() => alert("Navigate to Check-in page")}
            />
         </div>
      );
   }

   return (
      <div className="p-4 bg-gray-50 min-h-full">
         <header className="flex items-center justify-between mb-6 text-gray-800">
            <AppIcon name="info" className="w-6 h-6" />
            <h1 className="text-xl font-bold">Medications</h1>
            <div></div>
         </header>
         <div className="mb-6 flex items-center space-x-4">
            <label className="text-sm font-medium">From:
               <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="ml-2 border rounded px-2 py-1" />
            </label>
            <label className="text-sm font-medium">To:
               <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="ml-2 border rounded px-2 py-1" />
            </label>
            <button onClick={handleDownload} disabled={!selectedPatient || downloading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
               {downloading ? 'Generating PDF...' : 'Download PDF Report'}
            </button>
         </div>
         {isAdherenceLoading ? (
            <div>Loading charts...</div>
         ) : adherenceData.length === 0 ? (
            <EmptyState
               icon="chartEmpty"
               title="No Data for Charts"
               message="No medication adherence data found for the current date range."
               actionText="Add Data"
               onAction={() => alert("Navigate to Check-in page")}
            />
         ) : (
            <>
               <div className="mb-8">
                  <h2 className="text-lg font-semibold mb-2">Medications Missed Per Day</h2>
                  <ResponsiveContainer width="100%" height={250}>
                     <BarChart data={adherenceData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="missed" fill="#f87171" name="Missed" />
                     </BarChart>
                  </ResponsiveContainer>
               </div>
               <div className="mb-8">
                  <h2 className="text-lg font-semibold mb-2">Medication Completion % Per Day</h2>
                  <ResponsiveContainer width="100%" height={250}>
                     <LineChart data={adherenceData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
                        <Tooltip formatter={v => `${v}%`} />
                        <Legend />
                        <Line type="monotone" dataKey="completion" stroke="#34d399" name="Completion %" />
                     </LineChart>
                  </ResponsiveContainer>
               </div>
            </>
         )}
      </div>
   );
};

export default InsightsView;
