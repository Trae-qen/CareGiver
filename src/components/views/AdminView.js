import React, { useState, useEffect } from 'react';
import { patientAPI, userAPI } from '../../services/api'; // You'll need to add userAPI to your api.js
import { useAuth } from '../../context/AuthContext';
import { useCarePlan } from '../../context/CarePlanContext';
import AppIcon from '../common/AppIcon';
import ManagePlanModal from '../common/ManagePlanModal'; // Import your existing modal
import ManageTeamModal from '../common/ManageTeamModal';

const AdminView = () => {
    const { selectPatient } = useAuth();
    const [patients, setPatients] = useState([]);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // State for managing the "Edit Patient" modal
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    
    // State for the "Add User" form
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'aide' });

    //State for new Patient
    const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
    const [newPatient, setNewPatient] = useState({
        name: '',
        age: '',
        allergies: '',
        emergencyContact: '',
        doctor: ''
    });

    //Manage Team modal
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [currentPatientForTeam, setCurrentPatientForTeam] = useState(null);

    //State for Edit User Modal
    const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
    const [currentUserToEdit, setCurrentUserToEdit] = useState(null);
    
    // Fetch all data on component load
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [patientsData, usersData] = await Promise.all([
                patientAPI.getAll(),
                userAPI.getAll() 
            ]);
            setPatients(patientsData);
            setUsers(usersData);
            return { patientsData, usersData }; // <-- ADD THIS RETURN
        } catch (error) {
            console.error("Failed to fetch admin data:", error);
            return { patientsData: [], usersData: [] }; // <-- ADD THIS RETURN
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenAddPatientModal = () => {
        // Reset the form every time it's opened
        setNewPatient({
            name: '',
            age: '',
            allergies: '',
            emergencyContact: '',
            doctor: ''
        });
        setIsAddPatientModalOpen(true);
    };

    const handleCloseAddPatientModal = () => {
        setIsAddPatientModalOpen(false);
    };

    const handleAddPatient = async (e) => {
        e.preventDefault();
        // Basic validation
        if (!newPatient.name || !newPatient.age) {
            alert('Please fill out at least name and age.');
            return;
        }
        try {
            // You'll need patientAPI.create in your api.js
            await patientAPI.create(newPatient); 
            handleCloseAddPatientModal();
            fetchData(); // Refresh the patient list
        } catch (error) {
            console.error("Failed to create patient:", error);
            alert("Failed to create patient.");
        }
    };


    // Function to open the patient editor
    const handleEditPatientPlan = (patient) => {
        selectPatient(patient); // Set the global patient
        setIsPlanModalOpen(true);    // Open the modal
    };

    // Function to close the patient editor
    const handleClosePlanModal = () => {
        setIsPlanModalOpen(false);
    };


    const handleEditPatientTeam = (patient) => {
        setCurrentPatientForTeam(patient);
        setIsTeamModalOpen(true);
    };

    const handleCloseTeamModal = () => {
        setIsTeamModalOpen(false);
        setCurrentPatientForTeam(null);
    };

    const handleTeamUpdate = async () => {
        // Wait for the new data
        const { patientsData } = await fetchData(); 
        
        if (currentPatientForTeam) {
            // Find the updated patient in the new list
            const updatedPatient = patientsData.find(p => p.id === currentPatientForTeam.id);
            
            if (updatedPatient) {
                // Set the state to the fresh patient object
                setCurrentPatientForTeam(updatedPatient);
            } else {
                // Failsafe: if patient not found, close modal
                handleCloseTeamModal();
            }
        }
    };

    // Functions for adding a new user
    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            await userAPI.create(newUser); // You'll need userAPI.create()
            setNewUser({ name: '', email: '', role: 'aide' }); // Reset form
            setIsUserModalOpen(false); // Close modal
            fetchData(); // Refresh the user list
        } catch (error) {
            console.error("Failed to create user:", error);
            alert("Failed to create user. Check console for details.");
        }
    };

    const handleOpenEditModal = (user) => {
        setCurrentUserToEdit(user);
        setIsEditUserModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setCurrentUserToEdit(null);
        setIsEditUserModalOpen(false);
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        if (!currentUserToEdit) return;

        try {
            // We only send the fields that can be changed: name and role
            const updateData = {
                name: currentUserToEdit.name,
                role: currentUserToEdit.role,
            };
            // You will need to add userAPI.update in your api.js
            await userAPI.update(currentUserToEdit.id, updateData);
            handleCloseEditModal();
            fetchData(); // Refresh the user list
        } catch (error) {
            console.error("Failed to update user:", error);
            alert("Failed to update user. Check console for details.");
        }
    };
    
    const handleDeleteUser = async (userId, userName) => {
        if (window.confirm(`Are you sure you want to delete ${userName}? This cannot be undone.`)) {
            try {
                // You will need to add userAPI.delete in your api.js
                await userAPI.delete(userId);
                fetchData(); // Refresh the user list
            } catch (error) {
                console.error("Failed to delete user:", error);
                alert("Failed to delete user. Check console for details.");
            }
        }
    };

    
    if (isLoading) {
        return <div className="p-4">Loading Admin Data...</div>;
    }

    return (
        <div className="p-4 bg-gray-50 min-h-full">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            </header>

            {/* Manage Patients Section */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Manage Patients</h2>
                    <button 
                        onClick={handleOpenAddPatientModal}
                        className="text-sm bg-blue-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-600"
                    >
                        Add Patient
                    </button>
                </div>
                <div className="space-y-3">
                    {patients.map(patient => (
                        <div key={patient.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-medium">{patient.name}</p>
                                <p className="text-sm text-gray-500">ID: {patient.id} • {patient.age} years old</p>
                            </div>
                            
                            {/* --- MODIFIED BUTTONS --- */}
                            <div className="flex space-x-2">
                                <button 
                                    onClick={() => handleEditPatientPlan(patient)}
                                    className="text-sm bg-gray-200 text-gray-700 py-1 px-3 rounded-lg font-medium hover:bg-gray-300"
                                >
                                    Edit Plan
                                </button>
                                <button 
                                    onClick={() => handleEditPatientTeam(patient)}
                                    className="text-sm bg-blue-100 text-blue-700 py-1 px-3 rounded-lg font-medium hover:bg-blue-200"
                                >
                                    Manage Team
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Manage Users Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Manage Users</h2>
                    <button 
                        onClick={() => setIsUserModalOpen(true)}
                        className="text-sm bg-green-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-600"
                    >
                        Add User
                    </button>
                </div>
                <div className="space-y-3">
                    {users.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{user.name}</p>
                                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                            </div>
                            <div className="flex items-center flex-shrink-0 ml-4">
                                <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-full mr-3">{user.role}</span>
                                <button
                                    onClick={() => handleOpenEditModal(user)}
                                    className="text-sm text-blue-600 hover:underline mr-3"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteUser(user.id, user.name)}
                                    className="text-sm text-red-600 hover:underline"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- RENDER BOTH MODALS --- */}
            
            {/* 1. The (simplified) Patient Plan Modal */}
            {isPlanModalOpen && (
                <ManagePlanModal
                    isOpen={isPlanModalOpen}
                    onClose={handleClosePlanModal}
                />
            )}

            {/* 2. The NEW Team Management Modal */}
            {isTeamModalOpen && (
                <ManageTeamModal
                    isOpen={isTeamModalOpen}
                    onClose={handleCloseTeamModal}
                    allUsers={users}
                    patient={currentPatientForTeam}
                    onTeamUpdate={handleTeamUpdate}
                />
            )}

            {/* Add User Modal (Unchanged) */}
            {isUserModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-4">Add New User</h3>
                            <form onSubmit={handleAddUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={newUser.name}
                                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <select
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="aide">Aide</option>
                                        <option value="Admin">Admin</option> 
                                        <option value="family">Family</option>
                                    </select>
                                </div>
                                <div className="flex space-x-3 pt-4">
                                    <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg">Cancel</button>
                                    <button type="submit" className="flex-1 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg">Add User</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal (Unchanged) */}
            {isEditUserModalOpen && currentUserToEdit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-4">Edit User</h3>
                            <form onSubmit={handleUpdateUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={currentUserToEdit.name}
                                        onChange={(e) => setCurrentUserToEdit({ ...currentUserToEdit, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email (cannot be changed)</label>
                                    <input
                                        type="email"
                                        value={currentUserToEdit.email}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                                        disabled
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <select
                                        value={currentUserToEdit.role}
                                        onChange={(e) => setCurrentUserToEdit({ ...currentUserToEdit, role: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="aide">Aide</option>
                                        <option value="Admin">Admin</option>
                                        <option value="family">Family</option>
                                    </select>
                                </div>
                                <div className="flex space-x-3 pt-4">
                                    <button type="button" onClick={handleCloseEditModal} className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg">Cancel</button>
                                    <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {/* Add Patient Modal */}
            {isAddPatientModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-4">Add New Patient</h3>
                            <form onSubmit={handleAddPatient} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                    <input
                                        type="text"
                                        value={newPatient.name}
                                        onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                                    <input
                                        type="number"
                                        value={newPatient.age}
                                        onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                                    <textarea
                                        value={newPatient.allergies}
                                        onChange={(e) => setNewPatient({ ...newPatient, allergies: e.target.value })}
                                        rows="2"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder="e.g., Penicillin, Peanuts"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                                    <input
                                        type="text"
                                        value={newPatient.emergencyContact}
                                        onChange={(e) => setNewPatient({ ...newPatient, emergencyContact: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder="e.g., Jane Doe (555-1234)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary Doctor</label>
                                    <input
                                        type="text"
                                        value={newPatient.doctor}
                                        onChange={(e) => setNewPatient({ ...newPatient, doctor: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder="e.g., Dr. Smith"
                                    />
                                </div>
                                <div className="flex space-x-3 pt-4">
                                    <button type="button" onClick={handleCloseAddPatientModal} className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                                    <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Add Patient</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminView;