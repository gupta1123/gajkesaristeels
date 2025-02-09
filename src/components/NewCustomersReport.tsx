import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import Select from 'react-select';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { format, parse, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { RootState } from '../store';
import { MultiValue, ActionMeta } from 'react-select';
import './NewCustomersReport.css'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type Employee = {
    id: number;
    firstName: string;
    lastName: string;
    role: string;
};

type ReportData = {
    employeeName: string;
    newStoreCount: number;
};

type EmployeeOption = { value: number; label: string };

const NewCustomersReport = () => {
    const [employees, setEmployees] = useState<EmployeeOption[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<EmployeeOption[]>([]);
    const [excludedEmployees, setExcludedEmployees] = useState<EmployeeOption[]>([]);
    const [reportData, setReportData] = useState<Record<string, ReportData[]>>({});
    const [startDate, setStartDate] = useState('2024-05-18');
    const [endDate, setEndDate] = useState('2024-07-18');
    const [showTopPerformers, setShowTopPerformers] = useState(true);
    const [isAutoSelect, setIsAutoSelect] = useState(true);

    const token = useSelector((state: RootState) => state.auth.token);

    useEffect(() => {
        if (token) {
            fetchEmployees();
        }
    }, [token]);

    useEffect(() => {
        if (token && startDate && endDate) {
            fetchReportData();
        }
    }, [token, startDate, endDate]);

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

    const fetchReportData = async () => {
        const start = parse(startDate, 'yyyy-MM-dd', new Date());
        const end = parse(endDate, 'yyyy-MM-dd', new Date());
        const months = eachMonthOfInterval({ start, end });

        const fetchPromises = months.map(async (month) => {
            const monthStart = format(startOfMonth(month), 'yyyy-MM-dd');
            const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd');

            try {
                const response = await axios.get<ReportData[]>('https://api.gajkesaristeels.in/report/getForEmployee', {
                    params: { startDate: monthStart, endDate: monthEnd },
                    headers: { Authorization: `Bearer ${token}` }
                });
                return { month: format(month, 'MMMM yyyy'), data: response.data };
            } catch (error) {
                console.error(`Error fetching report data for ${format(month, 'MMMM yyyy')}:`, error);
                return { month: format(month, 'MMMM yyyy'), data: [] };
            }
        });

        const results = await Promise.all(fetchPromises);
        const newReportData = Object.fromEntries(results.map(({ month, data }) => [month, data]));
        setReportData(newReportData);
    };

    const filteredReportData = useMemo(() => {
        const excludedEmployeeNames = excludedEmployees.map(emp => emp.label);
        return Object.fromEntries(
            Object.entries(reportData).map(([month, data]) => [
                month,
                data.filter(item => !excludedEmployeeNames.includes(item.employeeName))
            ])
        );
    }, [reportData, excludedEmployees]);

    const calculatedPerformers = useMemo(() => {
        const aggregatedData = Object.values(filteredReportData).flat().reduce((acc: Record<string, number>, curr) => {
            if (!acc[curr.employeeName]) {
                acc[curr.employeeName] = 0;
            }
            acc[curr.employeeName] += curr.newStoreCount;
            return acc;
        }, {});

        const sortedPerformers = Object.entries(aggregatedData)
            .sort(([, a], [, b]) => b - a)
            .map(([name, count]) => ({ name, count }));

        return {
            topPerformers: sortedPerformers.slice(0, 5),
            bottomPerformers: sortedPerformers.slice(-5).reverse(),
            allPerformers: sortedPerformers
        };
    }, [filteredReportData]);

    const updateSelectedEmployees = useCallback(() => {
        if (!isAutoSelect) return;

        const performersToShow = showTopPerformers ? calculatedPerformers.topPerformers : calculatedPerformers.bottomPerformers;
        let newSelectedEmployees = performersToShow
            .map(performer => employees.find(emp => emp.label.includes(performer.name)))
            .filter((emp): emp is EmployeeOption => emp !== undefined);

        const sortedEmployees = employees
            .filter(emp => !excludedEmployees.some(excluded => excluded.value === emp.value))
            .sort((a, b) => {
                const aCount = calculatedPerformers.topPerformers.find(p => p.name.includes(a.label))?.count || 0;
                const bCount = calculatedPerformers.topPerformers.find(p => p.name.includes(b.label))?.count || 0;
                return showTopPerformers ? bCount - aCount : aCount - bCount;
            });

        while (newSelectedEmployees.length < 5 && newSelectedEmployees.length < sortedEmployees.length) {
            const nextEmployee = sortedEmployees.find(emp => !newSelectedEmployees.some(selected => selected.value === emp.value));
            if (nextEmployee) {
                newSelectedEmployees.push(nextEmployee);
            } else {
                break;
            }
        }

        setSelectedEmployees(newSelectedEmployees);
    }, [employees, excludedEmployees, calculatedPerformers, showTopPerformers, isAutoSelect]);

    useEffect(() => {
        updateSelectedEmployees();
    }, [updateSelectedEmployees]);

    const handleExcludedEmployeeSelect = (newValue: MultiValue<EmployeeOption>, actionMeta: ActionMeta<EmployeeOption>) => {
        setExcludedEmployees(newValue as EmployeeOption[]);
        if (isAutoSelect) {
            updateSelectedEmployees();
        } else {
            setSelectedEmployees(prev => prev.filter(emp => !(newValue as EmployeeOption[]).some(excluded => excluded.value === emp.value)));
        }
    };

    const handleEmployeeSelect = (newValue: MultiValue<EmployeeOption>, actionMeta: ActionMeta<EmployeeOption>) => {
        setSelectedEmployees(newValue as EmployeeOption[]);
        setIsAutoSelect(false);
    };

    const handleShowTopPerformers = () => {
        setShowTopPerformers(true);
        setIsAutoSelect(true);
    };

    const handleShowBottomPerformers = () => {
        setShowTopPerformers(false);
        setIsAutoSelect(true);
    };

    const chartData = useMemo(() => {
        const months = Object.keys(filteredReportData);
        const datasets = selectedEmployees.map(employee => ({
            label: employee.label,
            data: months.map(month => {
                const employeeData = filteredReportData[month].find(data => data.employeeName === employee.label);
                return employeeData ? employeeData.newStoreCount : 0;
            }),
            borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
            tension: 0.1
        }));

        return {
            labels: months,
            datasets: datasets
        };
    }, [filteredReportData, selectedEmployees]);

    const getTotalNewCustomers = useCallback((employeeName: string) => {
        return Object.values(filteredReportData).reduce((total, monthData) => {
            const employeeData = monthData.find(data => data.employeeName === employeeName);
            return total + (employeeData ? employeeData.newStoreCount : 0);
        }, 0);
    }, [filteredReportData]);

    const chartOptions = {
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
                text: 'New Customers Acquired',
                font: {
                    size: 16
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Number of New Customers',
                    font: {
                        size: 12
                    }
                },
                ticks: {
                    font: {
                        size: 10
                    }
                }
            },
            x: {
                ticks: {
                    font: {
                        size: 10
                    }
                }
            }
        }
    };

    return (
        <div className="container-newCustomersReport mx-auto px-4 py-6 space-y-6">
            <Card className="shadow-md">
                <CardContent className="p-4 space-y-4">
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-medium mb-2">Date Range</h3>
                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full"
                                />
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium mb-2">Select Employees</h3>
                            <Select
                                isMulti
                                name="employees"
                                options={employees.filter(emp => !excludedEmployees.some(excluded => excluded.value === emp.value))}
                                className="basic-multi-select"
                                classNamePrefix="select"
                                onChange={handleEmployeeSelect}
                                value={selectedEmployees}
                            />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium mb-2">Exclude Employees</h3>
                            <Select
                                isMulti
                                name="excludedEmployees"
                                options={employees}
                                className="basic-multi-select"
                                classNamePrefix="select"
                                onChange={handleExcludedEmployeeSelect}
                                value={excludedEmployees}
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-center sm:justify-end space-x-2 space-y-2 sm:space-y-0">
                        <Button onClick={handleShowTopPerformers} size="sm" variant={showTopPerformers && isAutoSelect ? "default" : "outline"}>Top 5 Performers</Button>
                        <Button onClick={handleShowBottomPerformers} size="sm" variant={!showTopPerformers && isAutoSelect ? "default" : "outline"}>Bottom 5 Performers</Button>
                        <Button onClick={fetchReportData} size="sm">Refresh Data</Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-md">
                <CardContent className="p-4">
                    <div style={{ height: '300px' }}>
                        <Line data={chartData} options={chartOptions} />
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-md">
                <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-2">Selected Employees Performance</h3>
                    <ul className="space-y-2">
                        {selectedEmployees.map((employee, index) => {
                            const totalNewCustomers = getTotalNewCustomers(employee.label);
                            return (
                                <li key={index} className="flex justify-between items-center">
                                    <span className="text-sm">{employee.label}</span>
                                    <span className="font-medium">{totalNewCustomers} new customers</span>
                                </li>
                            );
                        })}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
};

export default NewCustomersReport;