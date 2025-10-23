import React from 'react';
import { useAuth } from '../../context/AuthContext';

const AdminView = () => {
    const { users = [], patients = [], loadPatients } = useAuth();

    return (
        <div className="p-4 bg-gray-50 min-h-full">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Admin</h1>
            </header>

            <div className="grid grid-cols-1 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm">
                    <h2 className="font-semibold mb-2">Manage Patients</h2>
                    <p className="text-sm text-gray-500">View and edit patient list. (Needs backend wiring)</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm">
                    <h2 className="font-semibold mb-2">Manage Users</h2>
                    <p className="text-sm text-gray-500">Invite/remove users and assign roles. (Needs backend wiring)</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm">
                    <h2 className="font-semibold mb-2">Family / Contacts</h2>
                    <p className="text-sm text-gray-500">Manage family members and emergency contacts for patients.</p>
                </div>
            </div>
        </div>
    );
};

export default AdminView;
