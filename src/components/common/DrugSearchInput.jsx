// src/components/common/DrugSearchInput.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';

// API Configuration
const FDA_API_BASE = 'https://api.fda.gov/drug/ndc.json';
const DEBOUNCE_DELAY = 300; // milliseconds

/**
 * Reusable component for FDA drug name autocomplete search.
 * @param {object} props
 * @param {string} props.value - The current medication name value (controlled by parent state).
 * @param {function} props.onSelect - Callback function when a drug is selected: (selectedName) => void.
 * @param {string} props.placeholder - Placeholder text for the input.
 */
const DrugSearchInput = ({ value, onSelect, placeholder = "Search medication name..." }) => {
    // --- STATE DEFINITIONS (MUST BE TOP LEVEL) ---
    const [searchTerm, setSearchTerm] = useState(value || '');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    // ✅ FIX: Moved isFocused state to the top level
    const [isFocused, setIsFocused] = useState(false); 

    // Ref to manage the debounce timer
    const debounceRef = useRef(null);
    // Ref for the result list container for managing focus/clicks
    const resultsContainerRef = useRef(null);

    // --- FDA API Fetch Logic ---
    const fetchDrugs = useCallback(async (query) => {
        if (query.length < 3) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        const encodedQuery = encodeURIComponent(query);
        // Using colon for partial matching search
        const searchPath = `search=brand_name:${encodedQuery}*+OR+generic_name:${encodedQuery}*&limit=10`;
        
        const url = `${FDA_API_BASE}?${searchPath}`;
        // ❌ Removed the erroneous 'useState' call from here

        try {
            const response = await fetch(url);
            if (!response.ok) {
                // Check for rate limiting or other specific HTTP errors
                throw new Error(`FDA API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data.results && data.results.length > 0) {
                const uniqueNames = new Set();
                const processedResults = [];

                data.results.forEach(drug => {
                    const name = drug.brand_name || drug.generic_name;
                    if (name && !uniqueNames.has(name.toLowerCase())) {
                        uniqueNames.add(name.toLowerCase());
                        processedResults.push({
                            name: name,
                            context: drug.brand_name ? 'Brand Name' : 'Generic Name'
                        });
                    }
                });

                setResults(processedResults.slice(0, 10));
            } else {
                setResults([]);
                setError("No matching drugs found.");
            }
        } catch (err) {
            console.error("FDA API fetch failed:", err);
            setError("Failed to fetch drug data. Please try again later.");
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // --- Debounce Effect ---
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (searchTerm.length >= 3) {
            setIsLoading(true);
            debounceRef.current = setTimeout(() => {
                fetchDrugs(searchTerm);
            }, DEBOUNCE_DELAY);
        } else {
            setResults([]);
            setError(null);
            setIsLoading(false);
        }

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [searchTerm, fetchDrugs]);

    // --- Selection and Input Handling ---
    const handleInputChange = (e) => {
        const newSearchTerm = e.target.value;
        setSearchTerm(newSearchTerm);
        onSelect(newSearchTerm, true); 
    };

    const handleSelect = (selectedName) => {
        setSearchTerm(selectedName);
        
        // Clear results and set focus state to hide the dropdown instantly
        setResults([]);
        setError(null);
        // ✅ FIX: setIsFocused is now defined
        setIsFocused(false); 
        
        onSelect(selectedName, false);
    };
    
    // --- Render ---
    return (
        <div className="relative" ref={resultsContainerRef}>
            <input
                type="text"
                value={searchTerm}
                onChange={handleInputChange}
                // ✅ FIX: Added onFocus and onBlur handlers
                onFocus={() => setIsFocused(true)} 
                // Delay blur to allow click on dropdown result to register
                onBlur={() => setTimeout(() => setIsFocused(false), 200)} 
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            
            {/* ✅ FIX: isFocused is now defined and controls visibility */}
            {(isFocused && (isLoading || error || results.length > 0)) && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {isLoading && (
                        <div className="p-3 text-sm text-gray-500 flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-violet-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Searching FDA database...
                        </div>
                    )}
                    {error && !isLoading && (
                        <div className="p-3 text-sm text-red-600">
                            Error: {error}
                        </div>
                    )}
                    {results.map((result, index) => (
                        <div
                            key={index}
                            onClick={() => handleSelect(result.name)}
                            className="p-3 cursor-pointer hover:bg-gray-100 flex justify-between items-center transition-colors"
                        >
                            <span className="font-medium text-gray-800">{result.name}</span>
                            <span className="text-xs text-gray-500 ml-2 bg-gray-100 px-2 py-0.5 rounded">{result.context}</span>
                        </div>
                    ))}
                    {!isLoading && !error && searchTerm.length >= 3 && results.length === 0 && (
                         <div className="p-3 text-sm text-gray-500">No results found for "{searchTerm}".</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DrugSearchInput;