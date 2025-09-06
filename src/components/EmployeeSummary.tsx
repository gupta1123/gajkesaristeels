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
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

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

const EmployeeSummary: React.FC = () => {
    const token = useSelector((state: RootState) => state.auth.token);
    const [summaryData, setSummaryData] = useState<SummaryData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'));

    const fetchSummaryData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            setSummaryLoading(true);
            
            if (!startDate || !endDate) {
                throw new Error('Please select a valid date range');
            }

            const response = await axios.get(
                `https://api.gajkesaristeels.in/salary-calculation/manual-summary-range?startDate=${startDate}&endDate=${endDate}`,
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

    useEffect(() => {
        if (token && startDate && endDate) {
            fetchSummaryData();
        }
    }, [token, startDate, endDate]);

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

    // Get date range display name
    const getDateRangeDisplay = () => {
        if (!startDate || !endDate) {
            return 'Select Date Range';
        }
        return `${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')}`;
    };

    return (
        <div className="w-full">
            {/* Filters Section */}
            <div className="mb-6 flex flex-wrap gap-4 items-center">
                <div className="flex-grow lg:flex-grow-0 lg:w-64 flex items-center gap-2">
                    <Input
                        placeholder="Search employees..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                    />
                    <Button onClick={fetchSummaryData}>
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
                    </div>

                    {/* Desktop view */}
                    <div className="hidden md:block">
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
                    </div>
                </>
            )}
        </div>
    );
};

export default EmployeeSummary;
