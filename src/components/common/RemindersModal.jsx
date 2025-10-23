import React from 'react';
import AppIcon from './AppIcon';

const RemindersModal = ({ isOpen, onClose, reminders, onToggleDone = () => {} }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <h2 className="text-lg font-bold">Reminders</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {Object.entries(reminders).map(([group, items]) => (
                        <div key={group}>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-gray-700">{group}</h3>
                                <span className="text-xs text-gray-400">{items.length} items</span>
                            </div>
                            <div className="space-y-3">
                                {items.map(rem => (
                                    <div key={rem.id} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border mr-3">
                                                <AppIcon name={rem.icon || 'check-in'} className="w-5 h-5 text-gray-600" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-800">{rem.title}</div>
                                                <div className="text-xs text-gray-500">{rem.time}</div>
                                            </div>
                                        </div>
                                        <button onClick={() => onToggleDone(rem.id)} className={`px-3 py-1 rounded text-sm ${rem.done ? 'bg-green-500 text-white' : 'bg-white border'}`}>
                                            {rem.done ? 'Done' : 'Mark'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RemindersModal;
