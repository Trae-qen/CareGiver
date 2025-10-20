import React, { useState } from 'react';
import AppIcon from '../common/AppIcon';
import AddItemModal from '../common/AddItemModal';
import ManagePlanModal from '../common/ManagePlanModal';
import { useCheckIn } from '../../context/CheckInContext';
import { useAuth } from '../../context/AuthContext';
import { mockCategories } from '../../data/mockData';
import { categoryIconColors, iconColors } from '../../utils/iconColors';

const CheckInView = () => {
    const { addCheckIn } = useCheckIn();
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showBanner, setShowBanner] = useState(true);

    const handleAddClick = (category) => {
        setSelectedCategory(category.name);
        setIsModalOpen(true);
    };

    const handleSave = (data) => {
        addCheckIn(selectedCategory, data, user);
        console.log('Saved data for', selectedCategory, 'by', user.name, ':', data);
        // When you connect to FastAPI, replace addCheckIn with an API call:
        // await fetch('/api/checkins', { method: 'POST', body: JSON.stringify({ category: selectedCategory, data, userId: user.id }) })
    };

    return (
        <div className="p-4 bg-gray-50 min-h-full">
            <header className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Check-In</h1>
                <button 
                    onClick={() => setIsPlanModalOpen(true)}
                    className="flex items-center space-x-2 bg-white px-3 py-2 rounded-full shadow-sm text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M12 15.75h.008v.008H12v-.008z" /></svg>
                    <span>Manage Plan</span>
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                </button>
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

            <ManagePlanModal
                isOpen={isPlanModalOpen}
                onClose={() => setIsPlanModalOpen(false)}
            />
        </div>
    );
};

export default CheckInView;
