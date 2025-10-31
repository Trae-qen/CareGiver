import React from 'react';
import { pushAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const MoreView = () => {
    const { user, logout } = useAuth();

    // --- PASTE YOUR VAPID PUBLIC KEY HERE ---
    // Get this from https://vapidkeys.com/
    //Update this so it a env file for production
    const VAPID_PUBLIC_KEY = 'BG7HqliTEQQO80k4pUjjRpu64MglVEoxJF3e4yM5v2WeLk3jmZfaFjV2D1t39IqLPGWmpQNCBapmFttVcAF_6Q4';

    // --- ADD THIS HELPER FUNCTION ---
    // This converts the VAPID key to the format the browser needs
    const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };
    // --- END HELPER FUNCTION ---

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
        }
    };

    const handleNotificationClick = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            alert('Push notifications are not supported by this browser.');
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                alert('You have not granted permission for notifications.');
                return;
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return;
        }

        console.log('Registering service worker...');
        let registration;
        try {
            registration = await navigator.serviceWorker.register('/service-worker.js');
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            return;
        }

        console.log('Getting push subscription...');
        try {
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            console.log('Push Subscription:', subscription);

            if (user && user.id) {
                const subscriptionJSON = subscription.toJSON();
                
                await pushAPI.subscribe(user.id, subscriptionJSON);
                alert("Notifications successfully enabled!");
            } else {
                alert("Could not subscribe: User not found.");
            }

        } catch (error) {
            if (error.name === 'NotAllowedError') {
                 alert("You have not granted permission for notifications.");
            } else {
                console.error('Push subscription failed:', error);
                alert('Failed to subscribe for notifications.');
            }
        }
    };

    return (
        <div className="p-4 bg-gray-50 min-h-full">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">More</h1>
            </header>

            {/* User Profile Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
                <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">{user?.name}</h2>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                        <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-600 text-xs font-semibold rounded">
                            {user?.role || 'Aide'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Settings Options */}
            <div className="space-y-3">
                <button className="w-full bg-white p-4 rounded-xl shadow-sm flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium text-gray-800">Profile Settings</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>

                <button 
                    onClick={handleNotificationClick}
                    className="w-full bg-white p-4 rounded-xl shadow-sm flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span className="font-medium text-gray-800">Notifications</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>

                <button className="w-full bg-white p-4 rounded-xl shadow-sm flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium text-gray-800">Help & Support</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>

                <button 
                    onClick={handleLogout}
                    className="w-full bg-red-50 p-4 rounded-xl shadow-sm flex items-center justify-between hover:bg-red-100 transition-colors"
                >
                    <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="font-medium text-red-600">Logout</span>
                    </div>
                </button>
            </div>

            {/* App Info */}
            <div className="mt-8 text-center text-xs text-gray-400">
                <p>CareGiver App v1.0.0</p>
                <p className="mt-1">© 2025 All rights reserved</p>
            </div>
        </div>
    );
};

export default MoreView;
