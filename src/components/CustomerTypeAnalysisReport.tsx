import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import Select from 'react-select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import axios from 'axios';
import { RootState } from '../store';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip, Sector } from 'recharts';
import './CustomerTypeAnalysisReport.css'

type Employee = {
    id: number;
    firstName: string;
    lastName: string;
    role: string;
};

type CustomerTypeData = {
    name: string;
    value: number;
};

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const RADIAN = Math.PI / 180;

const CustomerTypeAnalysisReport: React.FC = () => {
    const [employees, setEmployees] = useState<{ value: number; label: string }[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<{ value: number; label: string } | null>(null);
    const [customerTypeData, setCustomerTypeData] = useState<CustomerTypeData[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState('2024-05-01');
    const [endDate, setEndDate] = useState('2024-06-25');
    const [isLoading, setIsLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    const token = useSelector((state: RootState) => state.auth.token);

    useEffect(() => {
        if (token) {
            fetchEmployees();
        }
    }, [token]);

    useEffect(() => {
        if (selectedEmployee) {
            fetchCustomerTypeData();
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
            setError('Failed to fetch employees');
        }
    };

    const fetchCustomerTypeData = async () => {
        if (!selectedEmployee) return;
        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.get<Record<string, number>>('https://api.gajkesaristeels.in/report/getByStoreType', {
                params: {
                    employeeId: selectedEmployee.value,
                    startDate,
                    endDate
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            const total = Object.values(response.data).reduce((sum, value) => sum + value, 0);
            const formattedData: CustomerTypeData[] = Object.entries(response.data).map(([name, value]) => ({
                name,
                value: (value / total) * 100
            }));

            setCustomerTypeData(formattedData);
        } catch (error) {
            console.error('Error fetching customer type data:', error);
            setError('Failed to fetch customer type data');
            setCustomerTypeData([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmployeeSelect = (selected: { value: number; label: string } | null) => {
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

    const renderActiveShape = useCallback((props: any) => {
        const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
        const sin = Math.sin(-RADIAN * midAngle);
        const cos = Math.cos(-RADIAN * midAngle);
        const sx = cx + (outerRadius + 10) * cos;
        const sy = cy + (outerRadius + 10) * sin;
        const mx = cx + (outerRadius + 30) * cos;
        const my = cy + (outerRadius + 30) * sin;
        const ex = mx + (cos >= 0 ? 1 : -1) * 22;
        const ey = my;
        const textAnchor = cos >= 0 ? 'start' : 'end';

        return (
            <g>
                <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-xs md:text-sm">
                    {payload.name}
                </text>
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                />
                <Sector
                    cx={cx}
                    cy={cy}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    innerRadius={outerRadius + 6}
                    outerRadius={outerRadius + 10}
                    fill={fill}
                />
                <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
                <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
                <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" className="text-xs md:text-sm">{`${payload.name}`}</text>
                <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" className="text-xs md:text-sm">
                    {`${(percent * 100).toFixed(2)}%`}
                </text>
            </g>
        );
    }, []);

    const onPieEnter = useCallback((_: any, index: number) => {
        setActiveIndex(index);
    }, []);

    const CustomizedLegend: React.FC<{ payload?: any[] }> = useCallback(({ payload = [] }) => (
        <ul className="list-none pl-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
            {payload.map((entry, index) => (
                <li key={`item-${index}`} className="flex items-center">
                    <div className="w-3 h-3 mr-2" style={{ backgroundColor: entry.color }} />
                    <span>{entry.value}: {entry.payload.value.toFixed(1)}%</span>
                </li>
            ))}
        </ul>
    ), []);

    const renderChart = () => {
        if (isLoading) {
            return (
                <div className="w-full h-[300px] md:h-[500px] flex items-center justify-center">
                    <Skeleton className="w-[200px] h-[200px] md:w-[400px] md:h-[400px] rounded-full" />
                </div>
            );
        }

        if (customerTypeData.length === 0) {
            return <p className="text-center text-gray-500">No data available</p>;
        }

        return (
            <div className="w-full h-[300px] md:h-[500px]">
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            activeIndex={activeIndex}
                            activeShape={renderActiveShape}
                            data={customerTypeData}
                            cx="50%"
                            cy="50%"
                            innerRadius="30%"
                            outerRadius="60%"
                            fill="#8884d8"
                            dataKey="value"
                            onMouseEnter={onPieEnter}
                            label={false}
                        >
                            {customerTypeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                        <Legend content={<CustomizedLegend />} verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        );
    };

    return (
        <div className="container-customerType space-y-4 max-w-4xl mx-auto p-4">
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="text-xl md:text-2xl">Customer Type Analysis Report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="text-base md:text-lg font-semibold mb-2">Select Employee</h3>
                        <Select
                            options={employees}
                            value={selectedEmployee}
                            onChange={handleEmployeeSelect}
                            className="basic-single"
                            classNamePrefix="select"
                            placeholder="Select an employee..."
                        />
                    </div>
                    <div>
                        <h3 className="text-base md:text-lg font-semibold mb-2">Select Date Range</h3>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
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
                    </div>
                </CardContent>
            </Card>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg md:text-xl">Client Type Distribution</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    {renderChart()}
                </CardContent>
            </Card>
        </div>
    );
};

export default CustomerTypeAnalysisReport;