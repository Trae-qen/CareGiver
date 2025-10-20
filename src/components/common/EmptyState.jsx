import React from 'react';
import AppIcon from './AppIcon';

const EmptyState = ({ icon, title, message, actionText, onAction }) => (
    <div className="flex flex-col items-center justify-center text-center h-full pt-16 text-gray-500">
        <div className="w-16 h-16 mb-4 text-gray-400">
             <AppIcon name={icon} className="w-full h-full" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
        {message && <p className="max-w-xs">{message}</p>}
        {actionText && (
            <button
                onClick={onAction}
                className="mt-6 px-4 py-2 bg-gray-800 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75"
            >
                {actionText}
            </button>
        )}
    </div>
);

export default EmptyState;
