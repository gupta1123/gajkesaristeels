import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Check, Target as TargetIcon, AlertCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from 'use-debounce';

interface Employee {
    id: number;
    firstName: string;
    lastName: string;
    city: string
    role: string;
    contribution?: number;
    employeeTargetId?: number;
}

interface CityTarget {
    id: number;
    city: string;
    month: string;
    year: number;
    targetValue: number;
    totalAchievements: number;
}

interface EmployeeTarget {
    id: number;
    employeeId: number;
    employeeName: string;
    achievedValue: number;
}

interface CityData {
    id: number;
    target: number;
    achievement: number;
    employees: Employee[];
}

interface MonthData {
    [city: string]: CityData;
}

const TargetComponent: React.FC = () => {
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState<string>(currentDate.toLocaleString('default', { month: 'long' }));
    const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
    const [selectedCity, setSelectedCity] = useState<string>("all");
    const [monthData, setMonthData] = useState<MonthData>({});
    const authToken = useSelector((state: RootState) => state.auth.token);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [targetInputs, setTargetInputs] = useState<{ [city: string]: number }>({});
    const [debouncedTargetInputs] = useDebounce(targetInputs, 1000);
    const [contributionInputs, setContributionInputs] = useState<{ [key: string]: number }>({});
    const [debouncedContributionInputs] = useDebounce(contributionInputs, 1000);

    useEffect(() => {
        fetchTargets();
    }, [authToken, selectedMonth, selectedYear]);

    useEffect(() => {
        Object.entries(debouncedTargetInputs).forEach(([city, value]) => {
            handleTargetChange(city, value);
        });
    }, [debouncedTargetInputs]);

    useEffect(() => {
        Object.entries(debouncedContributionInputs).forEach(([key, value]) => {
            const [city, employeeId] = key.split('|');
            handleContributionChange(city, Number(employeeId), value);
        });
    }, [debouncedContributionInputs]);

    const fetchTargets = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`https://api.gajkesaristeels.in/target/getByMonthYear?month=${selectedMonth}&year=${selectedYear}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch targets');
            }
            const data: CityTarget[] = await response.json();
            await organizeDataByCity(data);
        } catch (error) {
            console.error('Error fetching targets:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEmployeesByTargetId = async (cityTargetId: number): Promise<EmployeeTarget[]> => {
        try {
            const response = await fetch(`https://api.gajkesaristeels.in/target/employees?cityTargetId=${cityTargetId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch employees by target ID');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching employees by target ID:', error);
            return [];
        }
    };

    const organizeDataByCity = async (targetData: CityTarget[]) => {
        const cityData: MonthData = {};

        for (const target of targetData) {
            const cityName = target.city.trim() || 'Unassigned';
            const employeeTargets = await fetchEmployeesByTargetId(target.id);

            const cityEmployees = employeeTargets.map(empTarget => ({
                id: empTarget.employeeId,
                firstName: empTarget.employeeName.split(' ')[0],
                lastName: empTarget.employeeName.split(' ')[1] || '',
                city: cityName,
                role: 'Field Officer',
                contribution: empTarget.achievedValue,
                employeeTargetId: empTarget.id
            }));

            cityData[cityName] = {
                id: target.id,
                target: target.targetValue,
                achievement: target.totalAchievements,
                employees: cityEmployees
            };
        }

        setMonthData(cityData);
    };

    const handleMonthChange = (value: string) => {
        setSelectedMonth(value);
        setSelectedCity("all");
    };

    const handleYearChange = (value: string) => {
        setSelectedYear(Number(value));
        setSelectedCity("all");
    };

    const handleCityChange = (value: string) => {
        setSelectedCity(value);
    };

    const handleTargetInputChange = (city: string, value: number) => {
        setTargetInputs(prev => ({ ...prev, [city]: value }));
    };

    const handleTargetChange = async (city: string, newValue: number) => {
        try {
            const cityTargetId = monthData[city]?.id;
            if (!cityTargetId) return;

            const response = await fetch('https://api.gajkesaristeels.in/target/edit', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    id: cityTargetId,
                    targetValue: newValue
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update target');
            }

            setMonthData(prevData => ({
                ...prevData,
                [city]: {
                    ...prevData[city],
                    target: newValue
                }
            }));
        } catch (error) {
            console.error('Error updating target:', error);
        }
    };

    const handleContributionInputChange = (city: string, employeeId: number, value: number) => {
        setContributionInputs(prev => ({ ...prev, [`${city}|${employeeId}`]: value }));
    };

    const handleContributionChange = async (city: string, employeeId: number, newValue: number) => {
        try {
            const employee = monthData[city].employees.find(emp => emp.id === employeeId);
            if (!employee || !employee.employeeTargetId) return;

            const response = await fetch(`https://api.gajkesaristeels.in/target/updateAchievement?employeeTargetId=${employee.employeeTargetId}&achievedValue=${newValue}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to update achievement');
            }

            setMonthData(prevData => {
                const updatedCityData = { ...prevData[city] };
                updatedCityData.employees = updatedCityData.employees.map(emp =>
                    emp.id === employeeId ? { ...emp, contribution: newValue } : emp
                );
                updatedCityData.achievement = updatedCityData.employees.reduce((acc, emp) => acc + (emp.contribution || 0), 0);

                return {
                    ...prevData,
                    [city]: updatedCityData
                };
            });
        } catch (error) {
            console.error('Error updating achievement:', error);
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const getRandomColor = () => {
        const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500', 'bg-pink-500'];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    return (
        <div className="max-w-7xl mx-auto p-4">
            <h2 className="text-2xl font-semibold mb-4">Monthly Target and Achievement</h2>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-4 md:space-y-0 md:space-x-4">
                <div className="w-full md:w-64">
                    <label htmlFor="month-select" className="block text-sm font-medium mb-1">Select Month</label>
                    <Select onValueChange={handleMonthChange} value={selectedMonth}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a month" />
                        </SelectTrigger>
                        <SelectContent>
                            {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month) => (
                                <SelectItem key={month} value={month}>{month}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-full md:w-64">
                    <label htmlFor="year-select" className="block text-sm font-medium mb-1">Select Year</label>
                    <Select onValueChange={handleYearChange} value={selectedYear.toString()}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a year" />
                        </SelectTrigger>
                        <SelectContent>
                            {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map((year) => (
                                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-full md:w-64">
                    <label htmlFor="city-filter" className="block text-sm font-medium mb-1">Filter by City</label>
                    <Select onValueChange={handleCityChange} value={selectedCity}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a city" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Cities</SelectItem>
                            {Object.keys(monthData).sort().map((city) => (
                                <SelectItem key={city} value={city}>{city}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div id="months-container">
                {isLoading ? (
                    <Card className="mb-4">
                        <CardContent className="p-4">
                            <Skeleton className="h-6 w-1/4 mb-4" />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {[...Array(3)].map((_, index) => (
                                    <Skeleton key={index} className="h-24 w-full" />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(monthData).sort(([a], [b]) => a.localeCompare(b)).map(([city, details]) => (
                            (selectedCity === 'all' || selectedCity === city) && (
                                <Card key={city} className="mb-4">
                                    <CardContent className="p-4">
                                        <div className="flex flex-col justify-between items-start mb-3">
                                            <h3 className="text-lg font-semibold mb-2">{city}</h3>
                                            <div className="flex flex-col space-y-2">
                                                <span className="flex items-center">
                                                    <TargetIcon className="w-4 h-4 mr-1 text-blue-500" />
                                                    Target:
                                                    <Input
                                                        type="number"
                                                        value={targetInputs[city] ?? details.target}
                                                        onChange={(e) => handleTargetInputChange(city, Number(e.target.value))}
                                                        onBlur={() => handleTargetChange(city, targetInputs[city] ?? details.target)}
                                                        className="w-20 ml-1 p-1 text-sm"
                                                    />
                                                </span>
                                                <span className="flex items-center">
                                                    <Check className="w-4 h-4 mr-1 text-green-500" />
                                                    Achievement: {details.achievement}
                                                </span>
                                                <span className="flex items-center">
                                                    <AlertCircle className="w-4 h-4 mr-1 text-yellow-500" />
                                                    Pending: {details.target - details.achievement}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {details.employees.map((employee) => (
                                                <div key={employee.id} className="bg-gray-50 p-3 rounded-md shadow-sm flex flex-col">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <div className="flex items-center">
                                                            <div className={`avatar ${getRandomColor()} mr-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                                                                {getInitials(`${employee.firstName} ${employee.lastName}`)}
                                                            </div>
                                                            <span className="font-medium text-sm">{`${employee.firstName} ${employee.lastName}`}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="text-xs text-gray-500 mr-2">Contribution:</span>
                                                        <Input
                                                            type="number"
                                                            value={contributionInputs[`${city}|${employee.id}`] ?? employee.contribution}
                                                            onChange={(e) => handleContributionInputChange(city, employee.id, Number(e.target.value))}
                                                            onBlur={() => handleContributionChange(city, employee.id, contributionInputs[`${city}|${employee.id}`] ?? employee.contribution ?? 0)}
                                                            className="w-full text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TargetComponent;