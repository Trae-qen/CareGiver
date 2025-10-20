import React from 'react';
import AppIcon from '../common/AppIcon';
import EmptyState from '../common/EmptyState';

const InsightsView = ({ showEmptyState }) => {
     if (showEmptyState) {
        return (
            <div className="p-4 bg-gray-50 min-h-full">
                 <header className="flex items-center justify-between mb-6 text-gray-800">
                    <AppIcon name="info" className="w-6 h-6"/>
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
    // Render actual charts here when showEmptyState is false
    return (
         <div className="p-4 bg-gray-50 min-h-full">
                 <header className="flex items-center justify-between mb-6 text-gray-800">
                    <AppIcon name="info" className="w-6 h-6"/>
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
};

export default InsightsView;
