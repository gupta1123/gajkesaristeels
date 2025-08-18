"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
} from "@/components/ui/pagination";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import axios from 'axios';
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { CalendarIcon, CurrencyDollarIcon, TruckIcon, CalculatorIcon } from "@heroicons/react/24/outline";
import styles from './Salary.module.css';

const OLA_CLIENT_ID = '7ba2810b-f481-4e31-a0c6-d436b0c7c1eb';
const OLA_CLIENT_SECRET = 'klymi04gaquWCnpa57hBEpMXR7YPhkLD';

// Environment-based API configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.gajkesaristeels.in' 
  : 'https://api.gajkesaristeels.in';

// EC2 endpoint for salary calculation (as required by backend)
const EC2_API_URL = 'http://ec2-3-88-111-83.compute-1.amazonaws.com:8081';

const Salary: React.FC<{ authToken: string | null }> = ({ authToken }) => {
    const currentYear = new Date().getFullYear();
    const currentDate = new Date();
    const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');

    const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
    const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
    const [selectedFieldOfficer, setSelectedFieldOfficer] = useState<string>("All Field Officers");
    const [data, setData] = useState<any[]>([]);
    const [isDataAvailable, setIsDataAvailable] = useState<boolean>(true);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [travelAllowanceData, setTravelAllowanceData] = useState<{ [key: number]: any }>({});
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isCalculating, setIsCalculating] = useState<{ [key: number]: boolean }>({});
    const [employeeData, setEmployeeData] = useState<{ [key: number]: any }>({});
    const [isDesktop, setIsDesktop] = useState<boolean>(true);
    const rowsPerPage = 10;

    const months = [
        { value: '01', label: 'January' },
        { value: '02', label: 'February' },
        { value: '03', label: 'March' },
        { value: '04', label: 'April' },
        { value: '05', label: 'May' },
        { value: '06', label: 'June' },
        { value: '07', label: 'July' },
        { value: '08', label: 'August' },
        { value: '09', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' },
    ];

    const years = Array.from({ length: 5 }, (_, index) => {
        const year = currentYear - 2 + index;
        return { value: year.toString(), label: year.toString() };
    });

    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchEmployeeData = useCallback(async () => {
        try {
            const response = await axios.get(`${EC2_API_URL}/employee/getAll`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            const employeeMap = response.data.reduce((acc: any, emp: any) => {
                acc[emp.id] = emp;
                return acc;
            }, {});
            setEmployeeData(employeeMap);
        } catch (error) {
            console.error('Error fetching employee data:', error);
        }
    }, [authToken]);

    const fetchData = useCallback(async () => {
        try {
            if (selectedYear && selectedMonth) {
                // Set loading state and clear old data
                setIsLoading(true);
                setData([]);
                setIsDataAvailable(false);
                
                const now = new Date();
                const isCurrentMonth = Number(selectedYear) === now.getFullYear() && Number(selectedMonth) === now.getMonth() + 1;
                const endDay = isCurrentMonth ? now.getDate() - 1 : getDaysInMonth(Number(selectedYear), Number(selectedMonth));

                const startDate = `${selectedYear}-${selectedMonth}-01`;
                const endDate = `${selectedYear}-${selectedMonth}-${endDay.toString().padStart(2, '0')}`;
                const url = `${EC2_API_URL}/salary-calculation/summary-range?startDate=${startDate}&endDate=${endDate}`;
                
                console.log('Fetching salary data for:', { selectedYear, selectedMonth, startDate, endDate, url });
                
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                    },
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('API Error Response:', {
                        status: response.status,
                        statusText: response.statusText,
                        errorText,
                        url
                    });
                    throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
                }
                
                const data = await response.json();
                console.log('Salary data received:', { month: selectedMonth, year: selectedYear, dataLength: data.length });
                setData(data);
                setIsDataAvailable(data.length > 0);
            }
        } catch (error) {
            console.error('Error fetching salary data:', {
                error,
                selectedYear,
                selectedMonth,
                errorMessage: error instanceof Error ? error.message : 'Unknown error'
            });
            setData([]);
            setIsDataAvailable(false);
        } finally {
            setIsLoading(false);
        }
    }, [selectedYear, selectedMonth, authToken]);

    const fetchTravelAllowanceData = useCallback(async (employeeId: number) => {
        try {
            const response = await fetch(`${API_BASE_URL}/travel-allowance/getForEmployeeAndDate?employeeId=${employeeId}&start=${selectedYear}-${selectedMonth}-01&end=${selectedYear}-${selectedMonth}-${getDaysInMonth(Number(selectedYear), Number(selectedMonth)).toString().padStart(2, '0')}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            });
            const data = await response.json();
            setTravelAllowanceData(prevData => ({ ...prevData, [employeeId]: data }));
        } catch (error) {
            console.error('Error fetching travel allowance data:', error);
        }
    }, [selectedYear, selectedMonth, authToken]);

    useEffect(() => {
        fetchEmployeeData();
    }, [fetchEmployeeData]);

    useEffect(() => {
        if (selectedYear && selectedMonth) {
            fetchData();
        }
    }, [selectedYear, selectedMonth, fetchData]);

    useEffect(() => {
        data.forEach(row => {
            fetchTravelAllowanceData(row.employeeId);
        });
    }, [data, fetchTravelAllowanceData]);

    useEffect(() => {
        getAccessToken();
    }, []);

    const getAccessToken = async () => {
        try {
            const response = await axios.post(
                'https://account.olamaps.io/realms/olamaps/protocol/openid-connect/token',
                new URLSearchParams({
                    grant_type: 'client_credentials',
                    scope: 'openid',
                    client_id: OLA_CLIENT_ID,
                    client_secret: OLA_CLIENT_SECRET
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );
            setAccessToken(response.data.access_token);
        } catch (error) {
            console.error('Error getting access token:', error);
        }
    };

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month, 0).getDate();
    };

    const calculateBaseSalary = (fullMonthSalary: number, totalDaysWorked: number, totalDaysInMonth: number) => {
        const perDaySalary = fullMonthSalary / totalDaysInMonth;
        const baseSalary = Math.round(perDaySalary * totalDaysWorked);
        return baseSalary;
    };

    const calculateTravelAllowance = (carDistance: number, bikeDistance: number, carRate: number, bikeRate: number) => {
        const carAllowance = Math.round(carDistance * carRate);
        const bikeAllowance = Math.round(bikeDistance * bikeRate);
        return carAllowance + bikeAllowance;
    };

    const calculateTotalSalary = (row: any, year: number, month: number) => {
        // The new API already provides the calculated total salary
        return Math.round(row.totalSalary || 0);
    };

    const getAnomalyCount = (employeeId: number) => {
        const employeeData = travelAllowanceData[employeeId];
        if (!employeeData) return 0;
        return employeeData.dateDetails.filter((detail: any) =>
            detail.checkoutCount > 0 && detail.totalDistanceTravelled === 0
        ).length;
    };

    const calculateDistances = async (employeeId: number) => {
        if (!accessToken) {
            console.error('Access token not available');
            return;
        }

        setIsCalculating(prev => ({ ...prev, [employeeId]: true }));

        try {
            const employeeData = travelAllowanceData[employeeId];
            if (!employeeData) return;

            const datesWithMissingDistance = employeeData.dateDetails.filter(
                (detail: any) => detail.checkoutCount > 0 && detail.totalDistanceTravelled === 0
            );

            if (datesWithMissingDistance.length === 0) return;

            const updatedDateDetails = await Promise.all(employeeData.dateDetails.map(async (detail: any) => {
                if (detail.checkoutCount > 0 && detail.totalDistanceTravelled === 0) {
                    let dailyCarDistance = 0;
                    let dailyBikeDistance = 0;
                    for (let i = 0; i < detail.visitDetails.length - 1; i++) {
                        const currentVisit = detail.visitDetails[i];
                        const nextVisit = detail.visitDetails[i + 1];
                        if (currentVisit.checkinLatitude && currentVisit.checkinLongitude &&
                            nextVisit.checkinLatitude && nextVisit.checkinLongitude) {
                            const distance = await calculateDistance(
                                currentVisit.checkinLatitude,
                                currentVisit.checkinLongitude,
                                nextVisit.checkinLatitude,
                                nextVisit.checkinLongitude
                            );
                            const vehicleType = currentVisit.vehicleType || 'Bike';
                            if (vehicleType === 'Car') {
                                dailyCarDistance += distance;
                            } else {
                                dailyBikeDistance += distance;
                            }
                        }
                    }

                    await axios.post(
                        
                        `${API_BASE_URL}/travel-allowance/create`,
                        {
                            employeeId: employeeId,
                            date: detail.date,
                            distanceTravelledByCar: dailyCarDistance,
                            distanceTravelledByBike: dailyBikeDistance
                        },
                        {
                            headers: {
                                'Authorization': `Bearer ${authToken}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    return { ...detail, totalDistanceTravelled: dailyCarDistance + dailyBikeDistance };
                }
                return detail;
            }));

            setTravelAllowanceData(prevData => ({
                ...prevData,
                [employeeId]: { ...employeeData, dateDetails: updatedDateDetails }
            }));

            await fetchTravelAllowanceData(employeeId);

        } catch (error) {
            console.error('Error calculating distances:', error);
        } finally {
            setIsCalculating(prev => ({ ...prev, [employeeId]: false }));
        }
    };

    const calculateDistance = async (lat1: number, lon1: number, lat2: number, lon2: number): Promise<number> => {
        try {
            const response = await axios.post(
                'https://api.olamaps.io/routing/v1/directions',
                null,
                {
                    params: {
                        origin: `${lat1},${lon1}`,
                        destination: `${lat2},${lon2}`,
                        alternatives: false,
                        steps: false,
                        overview: 'full',
                        language: 'en',
                        traffic_metadata: false,
                    },
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'X-Request-Id': crypto.randomUUID(),
                        'X-Correlation-Id': crypto.randomUUID(),
                    }
                }
            );
            return response.data.routes[0].legs[0].distance / 1000;
        } catch (error) {
            console.error('Error calculating distance:', error);
            return 0;
        }
    };

    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const sortedData = data.sort((a, b) => {
        const nameA = a.employeeName.toLowerCase();
        const nameB = b.employeeName.toLowerCase();
        return nameA.localeCompare(nameB);
    });
    const currentRows = sortedData
        .filter(row => selectedFieldOfficer === "All Field Officers" || row.employeeName === selectedFieldOfficer).slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(data.length / rowsPerPage);

    const uniqueFieldOfficers = ["All Field Officers", ...Array.from(new Set(data.map(row => row.employeeName)))];

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    const getInitialsFromFullName = (fullName: string) => {
        if (!fullName) return '';
        const names = fullName.trim().split(' ');
        if (names.length >= 2) {
            return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
        }
        return fullName.charAt(0).toUpperCase();
    };

    const renderDesktopView = () => (
        <div className={styles.desktopContainer}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Employee Name</th>
                        <th>Full Days</th>
                        <th>Half Days</th>
                        <th>Base Salary</th>
                        <th>TA</th>
                        <th>DA</th>
                        <th>Expense</th>
                        <th>Total Salary</th>
                    </tr>
                </thead>
                <tbody>
                    {currentRows.map((row, index) => (
                        <tr key={index}>
                            <td>{row.employeeName}</td>
                            <td>{row.fullDays}</td>
                            <td>{row.halfDays}</td>
                            <td>₹{Math.round(row.baseSalary || 0)}</td>
                            <td>₹{Math.round(row.travelAllowance || 0)}</td>
                            <td>₹{Math.round(row.dearnessAllowance || 0)}</td>
                            <td>₹{Math.round(row.approvedExpenses || 0)}</td>
                            <td>₹{Math.round(row.totalSalary || 0)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderMobileView = () => (
        <div className={styles.mobileContainer}>
            {currentRows.map((row, index) => (
                <Collapsible key={index} className={styles.card}>
                    <CollapsibleTrigger className={styles.cardHeader}>
                        <div className={styles.employeeInfo}>
                            <Avatar className={styles.avatar}>
                                <AvatarFallback>{getInitialsFromFullName(row.employeeName)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className={styles.employeeName}>{row.employeeName}</CardTitle>
                                <p className={styles.employeeRole}>Field Officer</p>
                            </div>
                        </div>
                        <div className={styles.totalSalary}>
                            ₹{Math.round(row.totalSalary || 0)}
                        </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className={styles.cardContent}>
                        <div className={styles.salaryDetails}>
                            <div className={styles.detailItem}>
                                <CalendarIcon className={styles.icon} />
                                <div>
                                    <span className={styles.label}>Full Days:</span>
                                    <span className={styles.value}>{row.fullDays}</span>
                                </div>
                            </div>
                            <div className={styles.detailItem}>
                                <CalendarIcon className={styles.icon} />
                                <div>
                                    <span className={styles.label}>Half Days:</span>
                                    <span className={styles.value}>{row.halfDays}</span>
                                </div>
                            </div>
                            <div className={styles.detailItem}>
                                <CurrencyDollarIcon className={styles.icon} />
                                <div>
                                    <span className={styles.label}>Base Salary:</span>
                                    <span className={styles.value}>₹{Math.round(row.baseSalary || 0)}</span>
                                </div>
                            </div>
                            <div className={styles.detailItem}>
                                <TruckIcon className={styles.icon} />
                                <div>
                                    <span className={styles.label}>TA:</span>
                                    <span className={styles.value}>₹{Math.round(row.travelAllowance || 0)}</span>
                                </div>
                            </div>
                            <div className={styles.detailItem}>
                                <CalculatorIcon className={styles.icon} />
                                <div>
                                    <span className={styles.label}>DA:</span>
                                    <span className={styles.value}>₹{Math.round(row.dearnessAllowance || 0)}</span>
                                </div>
                            </div>
                            <div className={styles.detailItem}>
                                <CurrencyDollarIcon className={styles.icon} />
                                <div>
                                    <span className={styles.label}>Expense:</span>
                                    <span className={styles.value}>₹{Math.round(row.approvedExpenses || 0)}</span>
                                </div>
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            ))}
        </div>
    );

    return (
        <div className={styles.salaryContainer}>
            <h2 className={styles.pageTitle}>Salary Details</h2>
            <div className={styles.filterContainer}>
                <div className={styles.selectContainer}>
                    <Select onValueChange={(value) => {
                        setSelectedYear(value);
                        setCurrentPage(1); // Reset to first page when changing year
                        setIsLoading(true); // Show loading immediately
                    }} defaultValue={selectedYear}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(year => (
                                <SelectItem key={year.value} value={year.value}>
                                    {year.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className={styles.selectContainer}>
                    <Select onValueChange={(value) => {
                        setSelectedMonth(value);
                        setCurrentPage(1); // Reset to first page when changing month
                        setIsLoading(true); // Show loading immediately
                    }} defaultValue={selectedMonth}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Month" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map(month => (
                                <SelectItem key={month.value} value={month.value}>
                                    {month.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className={styles.selectContainer}>
                    <Select onValueChange={(value) => {
                        setSelectedFieldOfficer(value);
                        setCurrentPage(1); // Reset to first page when changing field officer
                        // Brief loading state for filter change
                        setIsLoading(true);
                        setTimeout(() => setIsLoading(false), 300);
                    }} defaultValue={selectedFieldOfficer}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Field Officer" />
                        </SelectTrigger>
                        <SelectContent>
                            {uniqueFieldOfficers.map((officer, index) => (
                                <SelectItem key={index} value={officer}>
                                    {officer}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            {isLoading ? (
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner}></div>
                    <p className={styles.loadingText}>Loading salary data...</p>
                </div>
            ) : isDataAvailable ? (
                <>
                    {isMobileView ? (
                        <div className={styles.cardView}>
                            {renderMobileView()}
                        </div>
                    ) : (
                        <div className={styles.tableView}>
                            {renderDesktopView()}
                        </div>
                    )}
                    <Pagination className={styles.pagination}>
                        <PaginationContent>
                            {currentPage > 1 && (
                                <PaginationItem>
                                    <PaginationPrevious onClick={() => setCurrentPage(currentPage - 1)} />
                                </PaginationItem>
                            )}
                            {[...Array(totalPages)].map((_, i) => (
                                <PaginationItem key={i}>
                                    <PaginationLink
                                        isActive={currentPage === i + 1}
                                        onClick={() => setCurrentPage(i + 1)}
                                    >
                                        {i + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            {currentPage < totalPages && (
                                <PaginationItem>
                                    <PaginationNext onClick={() => setCurrentPage(currentPage + 1)} />
                                </PaginationItem>
                            )}
                        </PaginationContent>
                    </Pagination>
                </>
            ) : (
                <p className={styles.noDataMessage}>No data available for the selected month and year. Please choose a different month or year.</p>
            )}
        </div>
    );
};

export default Salary;