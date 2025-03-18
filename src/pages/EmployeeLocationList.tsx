import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type EmployeeLocation = {
    id: number;
    empId: number;
    empName: string;
    latitude: number;
    longitude: number;
    updatedAt: string;
    updatedTime: string;
};

type EmployeeLocationListProps = {
    employeeLocations: EmployeeLocation[];
    onEmployeeClick: (location: EmployeeLocation) => void;
};

const formatDateTime = (date: string, time: string) => {
    const dateTimeString = `${date}T${time}`;
    const dateTime = new Date(dateTimeString);

    const day = dateTime.getDate();
    const month = dateTime.toLocaleString('en-US', { month: 'short' });
    const year = dateTime.getFullYear().toString().slice(-2); // Get last two digits of the year
    const formattedDate = `${day} ${month}' ${year}`;

    const options: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
    };
    const formattedTime = dateTime.toLocaleString('en-US', options);

    return `${formattedDate} ${formattedTime}`;
};

const EmployeeLocationList: React.FC<EmployeeLocationListProps> = ({ employeeLocations, onEmployeeClick }) => {
    // Create a sorted copy of the locations array to ensure alphabetical order
    const sortedLocations = [...employeeLocations].sort((a, b) => 
        a.empName.localeCompare(b.empName)
    );

    return (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle className="text-2xl font-bold">Live Employee Locations</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedLocations.map((location) => (
                        <div
                            key={location.id}
                            className="flex items-center p-4 bg-white rounded-lg shadow-lg transform transition-transform hover:scale-105 cursor-pointer"
                            onClick={() => onEmployeeClick(location)}
                        >
                            <img src="/Address.gif" alt="Location" className="h-16 w-16 mr-4 rounded-full border-2 border-gray-300" />
                            <div>
                                <p className="text-lg font-semibold text-gray-900">{location.empName}</p>
                                <p className="text-sm text-gray-600 mt-1">Last updated: {formatDateTime(location.updatedAt, location.updatedTime)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default EmployeeLocationList;
