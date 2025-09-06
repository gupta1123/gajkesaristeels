"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { motion } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import './Employeelist.css';

interface SummaryData {
    employeeName: string;
    fullDayThreshold: number;
    endDate: string;
    includeSundays: boolean;
    presentDays: number;
    fullDays: number;
    baseSalary: number;
    carDistanceKm: number;
    employeeId: number;
    absentDays: number;
    travelAllowance: number;
    halfDayThreshold: number;
    totalSalary: number;
    halfDays: number;
    bikeDistanceKm: number;
    approvedExpenses: number;
    startDate: string;
    dearnessAllowance: number;
}

interface DailyBreakdownData {
    date: string;
    employeeName: string;
    daEarned: number;
    carDistanceKm: number;
    employeeId: number;
    dailyDearnessAllowance: number;
    travelAllowance: number;
    totalDailySalary: number;
    dayType: string;
    completedVisits: number;
    dayOfWeek: string;
    hasAttendance: boolean;
    isSunday: boolean;
    bikeDistanceKm: number;
    dailyBaseSalary: number;
    baseEarned: number;
    approvedExpenses: number;
}

const SalaryCalculation: React.FC = () => {
    const token = useSelector((state: RootState) => state.auth.token);
    const [summaryData, setSummaryData] = useState<SummaryData[]>([]);
    const [dailyBreakdownData, setDailyBreakdownData] = useState<DailyBreakdownData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [dailyLoading, setDailyLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
        to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0) // Last day of current month
    });
    const [selectedEmployee, setSelectedEmployee] = useState("all");

    const fetchSummaryData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            setSummaryLoading(true);
            
            if (!dateRange?.from || !dateRange?.to) {
                throw new Error('Please select a valid date range');
            }
            
            const startDate = format(dateRange.from, 'yyyy-MM-dd');
            const endDate = format(dateRange.to, 'yyyy-MM-dd');

            const response = await axios.get(
                `http://ec2-3-88-111-83.compute-1.amazonaws.com:8081/salary-calculation/manual-summary-range?startDate=${startDate}&endDate=${endDate}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!response.data) {
                throw new Error('No summary data received');
            }

            setSummaryData(response.data);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An unknown error occurred');
        } finally {
            setSummaryLoading(false);
            setIsLoading(false);
        }
    };

    const fetchDailyBreakdown = async () => {
        try {
            setDailyLoading(true);
            
            if (!dateRange?.from || !dateRange?.to) {
                throw new Error('Please select a valid date range');
            }
            
            const startDate = format(dateRange.from, 'yyyy-MM-dd');
            const endDate = format(dateRange.to, 'yyyy-MM-dd');
            const employeeId = selectedEmployee === 'all' ? '139' : selectedEmployee;

            const response = await axios.get(
                `http://ec2-3-88-111-83.compute-1.amazonaws.com:8081/salary-calculation/daily-breakdown?employeeId=${employeeId}&startDate=${startDate}&endDate=${endDate}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!response.data) {
                throw new Error('No daily breakdown data received');
            }

            setDailyBreakdownData(response.data);
        } catch (error) {
            console.error('Error fetching daily breakdown:', error);
        } finally {
            setDailyLoading(false);
        }
    };

    const fetchAllData = async () => {
        if (!token || !dateRange?.from || !dateRange?.to) return;
        
        // Call both APIs simultaneously with the same date range
        await Promise.all([
            fetchSummaryData(),
            fetchDailyBreakdown()
        ]);
    };

    useEffect(() => {
        if (token && dateRange?.from && dateRange?.to) {
            fetchAllData();
        }
    }, [token, dateRange]);

    useEffect(() => {
        if (token && selectedEmployee !== 'all' && dateRange?.from && dateRange?.to) {
            fetchDailyBreakdown();
        }
    }, [selectedEmployee]);

    const getDayTypeColor = (dayType: string) => {
        switch (dayType.toLowerCase()) {
            case 'full day': return 'bg-green-100 text-green-800';
            case 'half day': return 'bg-yellow-100 text-yellow-800';
            case 'present': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    // Filter summary data based on search query
    const filteredSummaryData = summaryData.filter(employee =>
        employee.employeeName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Get unique employee names for dropdown
    const employeeOptions = Array.from(new Set(summaryData.map(emp => ({
        id: emp.employeeId,
        name: emp.employeeName
    })))).sort((a, b) => a.name.localeCompare(b.name));

    // Get date range display name
    const getDateRangeDisplay = () => {
        if (!dateRange?.from || !dateRange?.to) {
            return 'Select Date Range';
        }
        return `${format(dateRange.from, 'MMM dd, yyyy')} - ${format(dateRange.to, 'MMM dd, yyyy')}`;
    };

    // Get selected employee display name
    const getSelectedEmployeeDisplay = () => {
        if (selectedEmployee === 'all') return 'All Employees';
        const selected = employeeOptions.find(e => e.id.toString() === selectedEmployee);
        return selected ? selected.name : 'Selected Employee';
    };

    return (
        <div className="container-employee mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mobile-display flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">
                    Salary Calculation
                </h1>
                <br/>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">Global Filters:</span>
                        {(dateRange?.from || dateRange?.to || selectedEmployee !== "all" || searchQuery) && (
                            <Badge variant="secondary" className="text-xs">
                                Active
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                        <span className="text-sm font-medium text-blue-800">📅 Date Range:</span>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-64 justify-start text-left font-normal border-blue-300 bg-white"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {getDateRangeDisplay()}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <Input
                        type="text"
                        placeholder="Search employees..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full max-w-md"
                    />
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select Employee" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Employees</SelectItem>
                            {employeeOptions.map((employee) => (
                                <SelectItem key={employee.id} value={employee.id.toString()}>
                                    {employee.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        onClick={fetchAllData}
                    >
                        Refresh Data
                    </Button>
                </div>
            </div>

            {isLoading && <div className="flex justify-center py-8">Loading salary data...</div>}
            {error && <div className="text-red-500 text-center py-4">Error: {error}</div>}

            {!isLoading && !error && (
                <>
                    {/* Mobile view */}
                    <div className="md:hidden space-y-4">
                        <Tabs defaultValue="summary" className="w-full" onValueChange={(value) => {
                            if (value === 'daily' && dailyBreakdownData.length === 0 && dateRange?.from && dateRange?.to) {
                                fetchDailyBreakdown();
                            }
                        }}>
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="summary">Summary</TabsTrigger>
                                <TabsTrigger value="daily">Daily</TabsTrigger>
                            </TabsList>

                            <TabsContent value="summary" className="mt-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Employee Salary Summary ({getDateRangeDisplay()})</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {summaryLoading ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="h-8 w-8 animate-spin" />
                                                <span className="ml-2">Loading summary...</span>
                                            </div>
                                        ) : summaryData.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                No summary data available
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {filteredSummaryData.map((employee) => (
                                                    <motion.div
                                                        key={employee.employeeId}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                    >
                                                        <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                                                            <CardHeader className="pb-2">
                                                                <div className="flex items-center justify-between">
                                                                    <CardTitle className="text-lg">{employee.employeeName}</CardTitle>
                                                                    <Badge variant="outline" className="font-bold">
                                                                        {formatCurrency(employee.totalSalary)}
                                                                    </Badge>
                                                                </div>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                                    <div className="space-y-2">
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted-foreground">Present Days:</span>
                                                                            <span className="font-medium">{employee.presentDays}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted-foreground">Full Days:</span>
                                                                            <span className="font-medium">{employee.fullDays}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted-foreground">Half Days:</span>
                                                                            <span className="font-medium">{employee.halfDays}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted-foreground">Base Salary:</span>
                                                                            <span className="font-medium">{formatCurrency(employee.baseSalary)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted-foreground">Travel:</span>
                                                                            <span className="font-medium">{formatCurrency(employee.travelAllowance)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted-foreground">DA:</span>
                                                                            <span className="font-medium">{formatCurrency(employee.dearnessAllowance)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="daily" className="mt-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Daily Breakdown - {getSelectedEmployeeDisplay()} ({getDateRangeDisplay()})</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {dailyLoading ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="h-8 w-8 animate-spin" />
                                                <span className="ml-2">Loading daily data...</span>
                                            </div>
                                        ) : dailyBreakdownData.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                No daily breakdown data available
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {dailyBreakdownData.map((day, index) => (
                                                    <motion.div
                                                        key={index}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                                    >
                                                        <Card className="overflow-hidden shadow-sm">
                                                            <CardContent className="pt-4">
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <div>
                                                                        <div className="font-medium text-lg">{day.employeeName}</div>
                                                                        <div className="text-sm">
                                                                            {new Date(day.date).toLocaleDateString('en-IN', {
                                                                                weekday: 'long',
                                                                                year: 'numeric',
                                                                                month: 'short',
                                                                                day: 'numeric'
                                                                            })}
                                                                        </div>
                                                                        <div className="text-sm text-muted-foreground">{day.dayOfWeek}</div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <Badge className={`${getDayTypeColor(day.dayType)} mb-1`}>
                                                                            {day.dayType}
                                                                        </Badge>
                                                                        <div className="font-bold text-lg">{formatCurrency(day.totalDailySalary)}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                                    <div className="space-y-1">
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted-foreground">Visits:</span>
                                                                            <span className="font-medium">{day.completedVisits}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted-foreground">Base:</span>
                                                                            <span className="font-medium">{formatCurrency(day.baseEarned)}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted-foreground">Travel:</span>
                                                                            <span className="font-medium">{formatCurrency(day.travelAllowance)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted-foreground">DA:</span>
                                                                            <span className="font-medium">{formatCurrency(day.daEarned)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Desktop view */}
                    <div className="hidden md:block">
                        <Tabs defaultValue="summary" className="w-full" onValueChange={(value) => {
                            if (value === 'daily' && dailyBreakdownData.length === 0 && dateRange?.from && dateRange?.to) {
                                fetchDailyBreakdown();
                            }
                        }}>
                            <TabsList className="grid w-full grid-cols-2 mb-6">
                                <TabsTrigger value="summary">Employee Summary</TabsTrigger>
                                <TabsTrigger value="daily">Daily Breakdown</TabsTrigger>
                            </TabsList>

                            <TabsContent value="summary" className="mt-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Employee Salary Summary ({getDateRangeDisplay()})</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {summaryLoading ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="h-8 w-8 animate-spin" />
                                                <span className="ml-2">Loading summary data...</span>
                                            </div>
                                        ) : filteredSummaryData.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                {summaryData.length === 0 ? 'No summary data available' : 'No employees found matching your search'}
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Employee Name</TableHead>
                                                            <TableHead>Present Days</TableHead>
                                                            <TableHead>Full Days</TableHead>
                                                            <TableHead>Half Days</TableHead>
                                                            <TableHead>Base Salary</TableHead>
                                                            <TableHead>Travel Allowance</TableHead>
                                                            <TableHead>Dearness Allowance</TableHead>
                                                            <TableHead>Expenses</TableHead>
                                                            <TableHead>Total Salary</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {filteredSummaryData.map((employee) => (
                                                            <TableRow key={employee.employeeId}>
                                                                <TableCell className="font-medium">{employee.employeeName}</TableCell>
                                                                <TableCell>{employee.presentDays}</TableCell>
                                                                <TableCell>{employee.fullDays}</TableCell>
                                                                <TableCell>{employee.halfDays}</TableCell>
                                                                <TableCell>{formatCurrency(employee.baseSalary)}</TableCell>
                                                                <TableCell>{formatCurrency(employee.travelAllowance)}</TableCell>
                                                                <TableCell>{formatCurrency(employee.dearnessAllowance)}</TableCell>
                                                                <TableCell>{formatCurrency(employee.approvedExpenses)}</TableCell>
                                                                <TableCell className="font-bold">{formatCurrency(employee.totalSalary)}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="daily" className="mt-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Daily Breakdown - {getSelectedEmployeeDisplay()} ({getDateRangeDisplay()})</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {dailyLoading ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="h-8 w-8 animate-spin" />
                                                <span className="ml-2">Loading daily breakdown...</span>
                                            </div>
                                        ) : dailyBreakdownData.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                No daily breakdown data available
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Employee Name</TableHead>
                                                            <TableHead>Date</TableHead>
                                                            <TableHead>Day</TableHead>
                                                            <TableHead>Day Type</TableHead>
                                                            <TableHead>Completed Visits</TableHead>
                                                            <TableHead>Base Earned</TableHead>
                                                            <TableHead>Travel Allowance</TableHead>
                                                            <TableHead>DA Earned</TableHead>
                                                            <TableHead>Total Daily</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {dailyBreakdownData.map((day, index) => (
                                                            <TableRow key={index}>
                                                                <TableCell className="font-medium">{day.employeeName}</TableCell>
                                                                <TableCell>{new Date(day.date).toLocaleDateString('en-IN')}</TableCell>
                                                                <TableCell>{day.dayOfWeek}</TableCell>
                                                                <TableCell>
                                                                    <Badge className={getDayTypeColor(day.dayType)}>
                                                                        {day.dayType}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>{day.completedVisits}</TableCell>
                                                                <TableCell>{formatCurrency(day.baseEarned)}</TableCell>
                                                                <TableCell>{formatCurrency(day.travelAllowance)}</TableCell>
                                                                <TableCell>{formatCurrency(day.daEarned)}</TableCell>
                                                                <TableCell className="font-bold">{formatCurrency(day.totalDailySalary)}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </>
            )}
        </div>
    );
};

export default SalaryCalculation;
