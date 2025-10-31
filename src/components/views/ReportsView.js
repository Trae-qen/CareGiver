import React, { useState } from 'react';
import AppIcon from '../common/AppIcon';
// import api from '../../services/api'; // Your API service

const ReportsView = () => {
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reportUrl, setReportUrl] = useState(null);

    const handleGenerateReport = async () => {
        setIsLoading(true);
        setError(null);
        setReportUrl(null);

        try {
            // TODO: Replace with real API call
            // const response = await api.post('/api/v1/reports/generate', { startDate, endDate }, { responseType: 'blob' });
            // const file = new Blob([response.data], { type: 'application/pdf' });
            // const fileURL = URL.createObjectURL(file);
            // setReportUrl(fileURL);
            
            // Mocking the API call
            await new Promise(res => setTimeout(res, 1500));
            setReportUrl('#mock-pdf-download-link'); // Use a mock URL
            
        } catch (err) {
            setError('Failed to generate report. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 bg-gray-50 min-h-full max-w-lg mx-auto">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Generate Report</h1>
                <p className="text-gray-600 mt-1">
                    Create a shareable PDF summary of your logs for your care team.
                </p>
            </header>

            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="startDate" className="text-sm font-medium text-gray-700 mb-1 block">Start Date</label>
                        <input
                            type="date"
                            id="startDate"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="text-sm font-medium text-gray-700 mb-1 block">End Date</label>
                        <input
                            type="date"
                            id="endDate"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                </div>
                
                <button
                    onClick={handleGenerateReport}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-150 disabled:opacity-50"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating...
                        </>
                    ) : (
                        'Generate Report'
                    )}
                </button>

                {error && (
                    <p className="text-sm text-red-600 text-center">{error}</p>
                )}
                
                {reportUrl && !isLoading && (
                    <a
                        href={reportUrl}
                        download="PD_Report.pdf"
                        className="w-full flex items-center justify-center bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition duration-150 mt-2"
                    >
                        <AppIcon name="download" className="w-5 h-5 mr-2" />
                        Download Report
                    </a>
                )}
            </div>
        </div>
    );
};

export default ReportsView;