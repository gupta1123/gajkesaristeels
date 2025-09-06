"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { motion } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";


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

const SalaryCalculationTabs: React.FC = () => {
    const token = useSelector((state: RootState) => state.auth.token);
    const [dailyBreakdownData, setDailyBreakdownData] = useState<DailyBreakdownData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dailyLoading, setDailyLoading] = useState(false);
    const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'));
    const [selectedEmployee, setSelectedEmployee] = useState("all");


    const fetchDailyBreakdown = async () => {
        try {
            setDailyLoading(true);
            
            if (!startDate || !endDate) {
                throw new Error('Please select a valid date range');
            }
            const employeeId = selectedEmployee === 'all' ? '139' : selectedEmployee;

            const response = await axios.get(
                `https://api.gajkesaristeels.in//salary-calculation/daily-breakdown?employeeId=${employeeId}&startDate=${startDate}&endDate=${endDate}`,
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
        if (!token || !startDate || !endDate) return;
        
        await fetchDailyBreakdown();
    };

    useEffect(() => {
        if (token && startDate && endDate) {
            fetchAllData();
        }
    }, [token, startDate, endDate]);

    useEffect(() => {
        if (token && selectedEmployee !== 'all' && startDate && endDate) {
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

    // Get unique employee names for dropdown (we'll need to fetch this separately or use a different approach)
    const employeeOptions: { id: number; name: string }[] = [];

    // Get date range display name
    const getDateRangeDisplay = () => {
        if (!startDate || !endDate) {
            return 'Select Date Range';
        }
        return `${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')}`;
    };

    // Get selected employee display name
    const getSelectedEmployeeDisplay = () => {
        if (selectedEmployee === 'all') return 'All Employees';
        const selected = employeeOptions.find(e => e.id.toString() === selectedEmployee);
        return selected ? selected.name : 'Selected Employee';
    };

    return (
        <div className="w-full">
            {/* Filters Section */}
            <div className="mb-6 flex flex-wrap gap-4 items-center">
                <div className="flex-grow lg:flex-grow-0 lg:w-64 flex items-center gap-2">
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                        <SelectTrigger className="w-full">
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
                    <Button onClick={fetchAllData}>
                        Refresh Data
                    </Button>
                </div>
                <div className="hidden lg:flex flex-wrap gap-4 items-center">
                    <div className="flex items-center space-x-2">
                        <Label htmlFor="startDate">From:</Label>
                        <Input
                            type="date"
                            id="startDate"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-auto"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Label htmlFor="endDate">To:</Label>
                        <Input
                            type="date"
                            id="endDate"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-auto"
                        />
                    </div>
                </div>
            </div>

            {isLoading && <div className="flex justify-center py-8">Loading salary data...</div>}
            {error && <div className="text-red-500 text-center py-4">Error: {error}</div>}

            {!isLoading && !error && (
                <>
                    {/* Mobile view */}
                    <div className="md:hidden space-y-4">
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
                    </div>

                    {/* Desktop view */}
                    <div className="hidden md:block">
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
                    </div>
                </>
            )}
        </div>
    );
};

export default SalaryCalculationTabs;
