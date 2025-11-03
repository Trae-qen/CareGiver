import React, { useState } from 'react';
import AppIcon from '../common/AppIcon';
import AddItemModal from '../common/AddItemModal';
import { useCheckIn } from '../../context/CheckInContext';
import { useAuth } from '../../context/AuthContext';
import { mockCategories } from '../../data/mockData';
import { categoryIconColors, iconColors } from '../../utils/iconColors';
import { symptomAPI } from '../../services/api';

const CheckInView = () => {
    const { addCheckIn, recordMedicationTaken } = useCheckIn();
    const { user, selectedPatient } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showBanner, setShowBanner] = useState(true);

    const handleAddClick = (category) => {
        setSelectedCategory(category.name);
        setIsModalOpen(true);
    };

    const handleSave = async (data) => {
        try {
            if (selectedCategory === 'Symptoms') {
                const symptomType = data.symptom === 'Other' ? data.otherSymptom : data.symptom;
                const payload = {
                    user_id: user?.id,
                    patient_id: selectedPatient?.id,
                    symptom_type: symptomType,
                    start_time: new Date().toISOString(),
                    severity: Number(data.severity) || null,
                    notes: data.description || data.notes || ''
                };
                await symptomAPI.create(payload);

                const checkInData = {
                    symptom: symptomType,
                    severity: data.severity,
                    notes: data.description
                };
                await addCheckIn(selectedCategory, checkInData, user);
                console.log('Saved symptom log and created check-in');

            } else if (selectedCategory === 'Medications') {
                await recordMedicationTaken(data.medication_id, data.time, data.notes, user, selectedPatient);
                console.log('Recorded medication adherence for', data.name, 'by', user?.name, ':', data);
            } else {
                await addCheckIn(selectedCategory, data, user);
                console.log('Saved data for', selectedCategory, 'by', user?.name, ':', data);
            }
        } catch (error) {
            console.error(`Failed to save ${selectedCategory}:`, error);
            alert(`Failed to save ${selectedCategory}. Please try again.`);
        }
    };

    return (
        <div className="p-4 bg-gray-50 min-h-full">
            <header className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Check-In</h1>
            </header>

            {showBanner && (
                <div className="bg-blue-50 text-blue-800 p-3 rounded-xl mb-6 relative">
                    <p className="text-sm">Record your progress then tap the Post Check-in button. Check-in as many times as needed per day.</p>
                    <button 
                        onClick={() => setShowBanner(false)}
                        className="absolute top-2 right-2 text-blue-800 hover:text-blue-900"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}

            <div className="space-y-3">
                {mockCategories.map(category => {
                     const colors = categoryIconColors[category.name] || iconColors.slate;
                     return (
                        <div key={category.id} className="bg-white p-3 rounded-xl shadow-sm flex items-center justify-between">
                            <div className="flex items-center">
                                <div className={`w-10 h-10 flex items-center justify-center rounded-lg mr-4 ${colors.bg}` }>
                                    <AppIcon name={category.icon} className={`w-6 h-6 ${colors.text}` } />
                                </div>
                                <span className="font-medium text-gray-800">{category.name}</span>
                            </div>
                            <button 
                                onClick={() => handleAddClick(category)}
                                className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
                            >
                               <AppIcon name="add" className="w-5 h-5" />
                            </button>
                        </div>
                     );
                })}
            </div>

            <AddItemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                category={selectedCategory}
                onSave={handleSave}
            />
        </div>
    );
};

export default CheckInView;
