import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import Select from 'react-select';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { RootState } from '../store';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, BarController, LineController, ChartOptions } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import './VisitFrequencyReport.css';
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, BarController, LineController);

interface Employee {
    id: number;
    firstName: string;
    lastName: string;
    role: string;
}

interface StoreStats {
    storeId: number;
    storeName: string;
    visitFrequency: number;
    intentLogs: { newIntentLevel: number }[];
    monthlySaleLogs: { newMonthlySale: number }[];
    intentLevel?: number;
    monthlySales?: number;
}

interface EmployeeOption {
    value: number;
    label: string;
}

const VisitFrequencyReport: React.FC = () => {
    const [employees, setEmployees] = useState<EmployeeOption[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeOption | null>(null);
    const [storeStats, setStoreStats] = useState<StoreStats[]>([]);
    const [displayMode, setDisplayMode] = useState<'mostVisited' | 'leastVisited' | 'highestIntent' | 'lowestIntent' | 'highestSales' | 'lowestSales'>('mostVisited');
    const [startDate, setStartDate] = useState('2024-05-01');
    const [endDate, setEndDate] = useState('2024-06-30');

    const token = useSelector((state: RootState) => state.auth.token);

    useEffect(() => {
        if (token) {
            fetchEmployees();
        }
    }, [token]);

    useEffect(() => {
        if (selectedEmployee) {
            fetchStoreStats();
        }
    }, [selectedEmployee, startDate, endDate]);

    const fetchEmployees = async () => {
        try {
            const response = await axios.get<Employee[]>('https://api.gajkesaristeels.in/employee/getAll', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const fieldOfficers = response.data.filter(emp => emp.role === "Field Officer");
            const employeeOptions = fieldOfficers
                .map((emp: Employee) => ({
                    value: emp.id,
                    label: `${emp.firstName} ${emp.lastName}`
                }))
                .sort((a, b) => a.label.localeCompare(b.label));
            setEmployees(employeeOptions);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const fetchStoreStats = async () => {
        if (!selectedEmployee) return;
        try {
            const response = await axios.get<StoreStats[]>('https://api.gajkesaristeels.in/report/getStoreStats', {
                params: {
                    employeeId: selectedEmployee.value,
                    startDate,
                    endDate
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            setStoreStats(response.data);
        } catch (error) {
            console.error('Error fetching store stats:', error);
        }
    };

    const handleEmployeeSelect = (selected: EmployeeOption | null) => {
        setSelectedEmployee(selected);
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'startDate') {
            setStartDate(value);
        } else if (name === 'endDate') {
            setEndDate(value);
        }
    };

    const getAverageIntentLevel = (store: StoreStats) => {
        if (store.intentLogs && store.intentLogs.length > 0) {
            const sum = store.intentLogs.reduce((acc, log) => acc + log.newIntentLevel, 0);
            return sum / store.intentLogs.length;
        }
        return store.intentLevel || 0;
    };

    const getAverageMonthlySales = (store: StoreStats) => {
        if (store.monthlySaleLogs && store.monthlySaleLogs.length > 0) {
            const sum = store.monthlySaleLogs.reduce((acc, log) => acc + log.newMonthlySale, 0);
            return sum / store.monthlySaleLogs.length;
        }
        return store.monthlySales || 0;
    };

    const sortedStoreStats = useMemo(() => {
        const stats = [...storeStats];
        switch (displayMode) {
            case 'mostVisited':
                return stats.sort((a, b) => (b.visitFrequency || 0) - (a.visitFrequency || 0)).slice(0, 10);
            case 'leastVisited':
                return stats.sort((a, b) => (a.visitFrequency || 0) - (b.visitFrequency || 0)).slice(0, 10);
            case 'highestIntent':
                return stats.sort((a, b) => getAverageIntentLevel(b) - getAverageIntentLevel(a)).slice(0, 10);
            case 'lowestIntent':
                return stats.sort((a, b) => getAverageIntentLevel(a) - getAverageIntentLevel(b)).slice(0, 10);
            case 'highestSales':
                return stats.sort((a, b) => getAverageMonthlySales(b) - getAverageMonthlySales(a)).slice(0, 10);
            case 'lowestSales':
                return stats.sort((a, b) => getAverageMonthlySales(a) - getAverageMonthlySales(b)).slice(0, 10);
        }
    }, [storeStats, displayMode]);

    const chartData = useMemo(() => ({
        labels: sortedStoreStats.map(store => store.storeName || `Store ${store.storeId}`),
        datasets: [
            {
                type: 'bar' as const,
                label: 'Visit Frequency',
                data: sortedStoreStats.map(store => store.visitFrequency || 0),
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                yAxisID: 'y',
            },
            {
                type: 'bar' as const,
                label: 'Average Intent Level',
                data: sortedStoreStats.map(store => getAverageIntentLevel(store)),
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
                yAxisID: 'y',
            },
            {
                type: 'line' as const,
                label: 'Average Monthly Sales',
                data: sortedStoreStats.map(store => getAverageMonthlySales(store)),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                yAxisID: 'y1',
            },
        ],
    }), [sortedStoreStats]);

    const chartOptions: ChartOptions<'bar' | 'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    boxWidth: 10,
                    font: {
                        size: 10
                    }
                }
            },
            title: {
                display: true,
                text: 'Store Statistics',
                font: {
                    size: 14
                }
            },
        },
        scales: {
            x: {
                stacked: false,
                ticks: {
                    font: {
                        size: 8
                    }
                }
            },
            y: {
                type: 'linear' as const,
                display: true,
                position: 'left' as const,
                title: {
                    display: true,
                    text: 'Visit Frequency / Intent Level',
                    font: {
                        size: 10
                    }
                },
                ticks: {
                    font: {
                        size: 8
                    }
                }
            },
            y1: {
                type: 'linear' as const,
                display: true,
                position: 'right' as const,
                title: {
                    display: true,
                    text: 'Average Monthly Sales',
                    font: {
                        size: 10
                    }
                },
                grid: {
                    drawOnChartArea: false,
                },
                ticks: {
                    font: {
                        size: 8
                    }
                }
            },
        },
    };

    return (
        <div className="container-visitfrequency space-y-4 p-4">
            <Card className="shadow-md">
                <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-2">Select Employee</h3>
                    <Select
                        options={employees}
                        value={selectedEmployee}
                        onChange={handleEmployeeSelect}
                        className="basic-single"
                        classNamePrefix="select"
                    />
                </CardContent>
            </Card>

            <Card className="shadow-md">
                <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-2">Select Date Range</h3>
                    <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
                        <Input
                            type="date"
                            name="startDate"
                            value={startDate}
                            onChange={handleDateChange}
                            className="w-full sm:w-1/2"
                        />
                        <Input
                            type="date"
                            name="endDate"
                            value={endDate}
                            onChange={handleDateChange}
                            className="w-full sm:w-1/2"
                        />
                    </div>
                </CardContent>
            </Card>

            {selectedEmployee && (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <Button onClick={() => setDisplayMode('mostVisited')} className="text-xs sm:text-sm">Most Visited</Button>
                        <Button onClick={() => setDisplayMode('leastVisited')} className="text-xs sm:text-sm">Least Visited</Button>
                        <Button onClick={() => setDisplayMode('highestIntent')} className="text-xs sm:text-sm">Highest Intent</Button>
                        <Button onClick={() => setDisplayMode('lowestIntent')} className="text-xs sm:text-sm">Lowest Intent</Button>
                        <Button onClick={() => setDisplayMode('highestSales')} className="text-xs sm:text-sm">Highest Sales</Button>
                        <Button onClick={() => setDisplayMode('lowestSales')} className="text-xs sm:text-sm">Lowest Sales</Button>
                    </div>

                    <Card className="shadow-md">
                        <CardContent className="p-4">
                            <div className="h-[300px] sm:h-[400px]">
                                <Chart type="bar" options={chartOptions} data={chartData} />
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
};

export default VisitFrequencyReport;