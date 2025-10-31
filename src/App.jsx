import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CheckInProvider, useCheckIn } from './context/CheckInContext';
import { CarePlanProvider } from './context/CarePlanContext';
import TopBar from './components/common/TopBar';
import AppIcon from './components/common/AppIcon';
import TodayView from './components/views/TodayView';
import CheckInView from './components/views/CheckInView';
import TimelineView from './components/views/TimelineView';
import InsightsView from './components/views/InsightsView';
import MoreView from './components/views/MoreView';
import AdminView from './components/views/AdminView';
import LoginView from './components/views/LoginView';
// Assuming this path is correct and you have this component
import { PatientSelectionView } from './views/PatientSelectionView.jsx'; 
import './App.css';

function AppContent() {
    // --- UPDATED ---
    // We now also get 'isPatientSelectionRequired' from our AuthContext
    const { isAuthenticated, isLoading, selectedPatient, user, isPatientSelectionRequired } = useAuth();
    const { adherences } = useCheckIn();
    const [activeView, setActiveView] = useState('Today');

    if (isLoading) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <LoginView />;
    }

    // --- UPDATED ---
    // We now check our new flag from the context.
    // This will *only* be true if the user has 2 or more patients and hasn't picked one.
    if (isPatientSelectionRequired) {
        return <PatientSelectionView />;
    }

    // If selection is NOT required, we proceed.
    // If user has 1 patient, `selectedPatient` will be set automatically.
    // If user has 0 patients, `selectedPatient` will be null, and the app
    // will (correctly) load with no patient selected.


    const renderView = () => {
        switch (activeView) {
            case 'Today':
                return <TodayView />;
            case 'Check-in':
                return <CheckInView />;
            case 'Timeline':
                return <TimelineView />;
            case 'Admin':
                return <AdminView />;
            case 'Insights':
                return <InsightsView showEmptyState={adherences.length === 0} />;
            case 'More':
                return <MoreView />;
            default:
                return <TodayView />;
        }
    };
    
    const baseNav = [
        { name: 'Today', icon: 'today' },
        { name: 'Timeline', icon: 'timeline' },
        { name: 'Check-in', icon: 'check-in' },
        { name: 'Insights', icon: 'insights' },
    ];

    const navItems = [...baseNav];
    if (user?.role.toLowerCase() === 'admin') {
        navItems.push({ name: 'Admin', icon: 'admin' });
    }
    navItems.push({ name: 'More', icon: 'more' });

    return (
        <div className="w-full h-screen md:max-w-md md:mx-auto bg-gray-50 font-sans leading-normal tracking-normal md:shadow-2xl md:rounded-3xl overflow-hidden md:border md:border-gray-200 md:my-4" style={{ maxHeight: '100vh' }}>
            <TopBar />
            <main className="flex-grow overflow-y-auto" style={{ height: 'calc(100vh - 60px - 70px)', maxHeight: 'calc(100vh - 60px - 70px)' }}>
                {renderView()}
            </main>
            <footer className="h-[70px] bg-white/80 backdrop-blur-sm border-t border-gray-200">
                <nav className="flex justify-around items-center h-full">
                    {navItems.map(item => (
                         <button
                            key={item.name}
                            onClick={() => setActiveView(item.name)}
                            className={`flex flex-col items-center justify-center w-full pt-1 transition-colors duration-200 ${activeView === item.name ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'}` }
                        >
                            <AppIcon name={item.icon} className="w-6 h-6 mb-1"/>
                            <span className={`text-xs font-bold ${activeView === item.name ? 'text-gray-800' : 'text-gray-500'}` }>{item.name}</span>
                        </button>
                    ))}
                </nav>
            </footer>
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <CarePlanProvider>
                <CheckInProvider>
                    <AppContent />
                </CheckInProvider>
            </CarePlanProvider>
        </AuthProvider>
    );
}
