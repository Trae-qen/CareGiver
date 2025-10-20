import React, { useState, useEffect } from 'react';

const TopBar = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formattedTime = currentTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: false 
    });

    return (
        <div className="flex justify-between items-center px-4 pt-4 pb-2 bg-gray-50">
            {/* Show time/battery on mobile, hide on desktop */}
            <span className="font-semibold text-lg md:hidden">{formattedTime}</span>
            <span className="font-semibold text-lg hidden md:block text-gray-800">CareGiver</span>
            
            <div className="flex items-center space-x-2 md:hidden">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 2.172a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L15.586 8H13a5 5 0 100 10h2.586l-1.172-1.172a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L15.586 20H13a9 9 0 110-18h2.828z" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 11-12.728 0M12 3v9" />
                </svg>
                <span className="font-semibold text-sm">60</span>
            </div>

            {/* Desktop: Show current date/time */}
            <div className="hidden md:block text-sm text-gray-600">
                {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                })} • {currentTime.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                })}
            </div>
        </div>
    );
};

export default TopBar;
