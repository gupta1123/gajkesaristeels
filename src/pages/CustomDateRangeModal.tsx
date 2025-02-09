import { useState } from 'react';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface CustomDateRangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (startDate: string, endDate: string) => void;
}

const CustomDateRangeModal = ({ isOpen, onClose, onApply }: CustomDateRangeModalProps) => {
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    const handleApply = () => {
        if (startDate && endDate) {
            const formattedStartDate = format(startDate, 'yyyy-MM-dd');
            const formattedEndDate = format(endDate, 'yyyy-MM-dd');
            onApply(formattedStartDate, formattedEndDate);
            onClose();
        }
    };

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? '' : 'hidden'}`}>
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Custom Date Range</h2>
                <div className="mb-4">
                    <label className="block mb-2">Start Date</label>
                    <DatePicker
                        selected={startDate}
                        onChange={(date: Date | null) => setStartDate(date)}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        placeholderText="Select start date"
                        className="border border-gray-300 rounded px-3 py-2 w-full"
                    />
                </div>
                <div className="mb-4">
                    <label className="block mb-2">End Date</label>
                    <DatePicker
                        selected={endDate}
                        onChange={(date: Date | null) => setEndDate(date)}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate}
                        placeholderText="Select end date"
                        className="border border-gray-300 rounded px-3 py-2 w-full"
                    />
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded mr-2"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleApply}
                        className="px-4 py-2 bg-blue-500 text-white rounded"
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomDateRangeModal;