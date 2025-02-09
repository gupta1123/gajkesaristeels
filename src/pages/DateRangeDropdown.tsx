import React, { useState, useEffect } from 'react';
import { format, subDays, differenceInDays, parseISO } from 'date-fns';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface DateRangeDropdownProps {
    selectedOption: string;
    onDateRangeChange: (startDate: string, endDate: string, selectedOption: string) => void;
}

const DateRangeDropdown: React.FC<DateRangeDropdownProps> = ({ selectedOption, onDateRangeChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isCustomDateRangeOpen, setIsCustomDateRangeOpen] = useState(false);
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const options = [
        'Today',
        'Last 7 Days',
        'Last 15 Days',
        'Last 30 Days',
        'Custom Date Range',
    ];

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const handleOptionClick = (option: string) => {
        setIsOpen(false);

        if (option === 'Custom Date Range') {
            setIsCustomDateRangeOpen(true);
        } else {
            let start = '';
            let end = '';

            switch (option) {
                case 'Today':
                    start = format(new Date(), 'yyyy-MM-dd');
                    end = format(new Date(), 'yyyy-MM-dd');
                    break;
                case 'Last 7 Days':
                    start = format(subDays(new Date(), 7), 'yyyy-MM-dd');
                    end = format(new Date(), 'yyyy-MM-dd');
                    break;
                case 'Last 15 Days':
                    start = format(subDays(new Date(), 15), 'yyyy-MM-dd');
                    end = format(new Date(), 'yyyy-MM-dd');
                    break;
                case 'Last 30 Days':
                    start = format(subDays(new Date(), 30), 'yyyy-MM-dd');
                    end = format(new Date(), 'yyyy-MM-dd');
                    break;
                default:
                    break;
            }

            onDateRangeChange(start, end, option);
        }
    };

    const handleCustomDateRangeSubmit = () => {
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        const daysDifference = differenceInDays(end, start);

        if (daysDifference > 30) {
            setErrorMessage("You can't choose a Date Range more than 30 days");
        } else {
            setErrorMessage(null);
            onDateRangeChange(startDate, endDate, 'Custom Date Range');
            setIsCustomDateRangeOpen(false);
        }
    };

    useEffect(() => {
        setErrorMessage(null);
    }, [startDate, endDate]);

    return (
        <div className="relative inline-block text-left w-64">
            <div className="w-full">
                <button
                    type="button"
                    className="inline-flex justify-between w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    id="options-menu"
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                    onClick={toggleDropdown}
                >
                    <span className="truncate">{selectedOption}</span>
                    <ChevronDownIcon className="h-5 w-5 ml-2" aria-hidden="true" />
                </button>
            </div>

            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div
                        className="py-1"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="options-menu"
                    >
                        {options.map((option) => (
                            <a
                                key={option}
                                href="#"
                                className={`${option === selectedOption
                                    ? 'bg-gray-100 text-gray-900'
                                    : 'text-gray-700'
                                    } block px-4 py-2 text-sm`}
                                role="menuitem"
                                onClick={() => handleOptionClick(option)}
                            >
                                {option}
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {isCustomDateRangeOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-6 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-50">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div>
                                    <div className="mt-3 text-center sm:mt-0 sm:text-left">
                                        <h3 className="text-2xl leading-6 font-semibold text-gray-900 mb-4">Custom Date Range</h3>
                                        <div className="mt-4">
                                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                                                Start Date
                                            </label>
                                            <input
                                                type="date"
                                                name="startDate"
                                                id="startDate"
                                                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                            />
                                        </div>
                                        <div className="mt-4">
                                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                                                End Date
                                            </label>
                                            <input
                                                type="date"
                                                name="endDate"
                                                id="endDate"
                                                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                            />
                                        </div>
                                        {errorMessage && (
                                            <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-6 py-3 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={handleCustomDateRangeSubmit}
                                >
                                    Apply
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setIsCustomDateRangeOpen(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateRangeDropdown;