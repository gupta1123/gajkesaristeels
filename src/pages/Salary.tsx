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

const Salary: React.FC<{ authToken: string | null }> = ({ authToken }) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');

    const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
    const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
    const [selectedFieldOfficer, setSelectedFieldOfficer] = useState<string>("All Field Officers");
    const [data, setData] = useState<any[]>([]);
    const [isDataAvailable, setIsDataAvailable] = useState<boolean>(true);
    const [currentPage, setCurrentPage] = useState<number>(1);
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
            const response = await axios.get('https://api.gajkesaristeels.in/employee/getAll', {
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
                const now = new Date();
                const isCurrentMonth = Number(selectedYear) === now.getFullYear() && Number(selectedMonth) === now.getMonth() + 1;
                const endDay = isCurrentMonth ? now.getDate() - 1 : getDaysInMonth(Number(selectedYear), Number(selectedMonth));

                const response = await fetch(`https://api.gajkesaristeels.in/attendance-log/getForRange?start=${selectedYear}-${selectedMonth}-01&end=${selectedYear}-${selectedMonth}-${endDay.toString().padStart(2, '0')}`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                    },
                });
                const data = await response.json();
                setData(data);
                setIsDataAvailable(data.length > 0);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setIsDataAvailable(false);
        }
    }, [selectedYear, selectedMonth, authToken]);

    const fetchTravelAllowanceData = useCallback(async (employeeId: number) => {
        try {
            const response = await fetch(`https://api.gajkesaristeels.in/travel-allowance/getForEmployeeAndDate?employeeId=${employeeId}&start=${selectedYear}-${selectedMonth}-01&end=${selectedYear}-${selectedMonth}-${getDaysInMonth(Number(selectedYear), Number(selectedMonth)).toString().padStart(2, '0')}`, {
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
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;
        const currentDate = today.getDate();

        const isCurrentMonth = year === currentYear && month === currentMonth;
        const lastDayToConsider = isCurrentMonth ? currentDate - 1 : getDaysInMonth(year, month);

        const totalDaysInMonth = getDaysInMonth(year, month);
        const totalDaysWorked = Math.min(row.fullDays + row.halfDays * 0.5, lastDayToConsider);

        const baseSalary = calculateBaseSalary(row.salary || 0, totalDaysWorked, totalDaysInMonth);

        const travelAllowance = calculateTravelAllowance(
            row.distanceTravelledByCar || 0,
            row.distanceTravelledByBike || 0,
            row.pricePerKmCar || 0,
            row.pricePerKmBike || 0
        );

        const employeeInfo = employeeData[row.employeeId] || {};
        const dailyDA = employeeInfo.dearnessAllowance || 0;
        const daForFullDays = dailyDA * row.fullDays;
        const daForHalfDays = (dailyDA / 2) * row.halfDays;
        const totalDA = Math.min(daForFullDays + daForHalfDays, dailyDA * lastDayToConsider);

        const totalSalary = baseSalary + travelAllowance + totalDA + (row.statsDto?.approvedExpense || 0);
        return Math.round(totalSalary);
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
                        'https://api.gajkesaristeels.in/travel-allowance/create',
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
        const nameA = `${a.employeeFirstName} ${a.employeeLastName}`.toLowerCase();
        const nameB = `${b.employeeFirstName} ${b.employeeLastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
    });
    const currentRows = sortedData
        .filter(row => selectedFieldOfficer === "All Field Officers" || `${row.employeeFirstName} ${row.employeeLastName}` === selectedFieldOfficer).slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(data.length / rowsPerPage);

    const uniqueFieldOfficers = ["All Field Officers", ...Array.from(new Set(data.map(row => `${row.employeeFirstName} ${row.employeeLastName}`)))];

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
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
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {currentRows.map((row, index) => (
                        <tr key={index}>
                            <td>{`${row.employeeFirstName} ${row.employeeLastName}`}</td>
                            <td>{row.fullDays}</td>
                            <td>{row.halfDays}</td>
                            <td>₹{Math.round(calculateBaseSalary(row.salary || 0, (row.fullDays + row.halfDays * 0.5), getDaysInMonth(Number(selectedYear), Number(selectedMonth))))}</td>
                            <td>₹{Math.round(calculateTravelAllowance(row.distanceTravelledByCar || 0, row.distanceTravelledByBike || 0, row.pricePerKmCar || 0, row.pricePerKmBike || 0))}</td>
                            <td>₹{Math.round(((employeeData[row.employeeId]?.dearnessAllowance || 0) * row.fullDays) + ((employeeData[row.employeeId]?.dearnessAllowance || 0) / 2 * row.halfDays))}</td>
                            <td>₹{Math.round(row.statsDto?.approvedExpense || 0)}</td>
                            <td>₹{calculateTotalSalary(row, Number(selectedYear), Number(selectedMonth))}</td>
                            <td>
                                {getAnomalyCount(row.employeeId) > 0 && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => calculateDistances(row.employeeId)}
                                                    disabled={isCalculating[row.employeeId]}
                                                    className={styles.tooltipButton}
                                                >
                                                    <ExclamationTriangleIcon className={`mr-2 h-4 w-4 ${styles.warningIcon}`} />
                                                    {isCalculating[row.employeeId] ? 'Calculating...' : `Calculate (${getAnomalyCount(row.employeeId)})`}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent className={styles.customTooltip}>
                                                <p>{getAnomalyCount(row.employeeId)} day(s) with checkout but no distance traveled</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </td>
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
                                <AvatarFallback>{getInitials(row.employeeFirstName, row.employeeLastName)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className={styles.employeeName}>{`${row.employeeFirstName} ${row.employeeLastName}`}</CardTitle>
                                <p className={styles.employeeRole}>Field Officer</p>
                            </div>
                        </div>
                        <div className={styles.totalSalary}>
                            ₹{calculateTotalSalary(row, Number(selectedYear), Number(selectedMonth))}
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
                                    <span className={styles.value}>₹{Math.round(calculateBaseSalary(row.salary || 0, (row.fullDays + row.halfDays * 0.5), getDaysInMonth(Number(selectedYear), Number(selectedMonth))))}</span>
                                </div>
                            </div>
                            <div className={styles.detailItem}>
                                <TruckIcon className={styles.icon} />
                                <div>
                                    <span className={styles.label}>TA:</span>
                                    <span className={styles.value}>₹{Math.round(calculateTravelAllowance(row.distanceTravelledByCar || 0, row.distanceTravelledByBike || 0, row.pricePerKmCar || 0, row.pricePerKmBike || 0))}</span>
                                </div>
                            </div>
                            <div className={styles.detailItem}>
                                <CalculatorIcon className={styles.icon} />
                                <div>
                                    <span className={styles.label}>DA:</span>
                                    <span className={styles.value}>₹{Math.round(((employeeData[row.employeeId]?.dearnessAllowance || 0) * row.fullDays) + ((employeeData[row.employeeId]?.dearnessAllowance || 0) / 2 * row.halfDays))}</span>
                                </div>
                            </div>
                            <div className={styles.detailItem}>
                                <CurrencyDollarIcon className={styles.icon} />
                                <div>
                                    <span className={styles.label}>Expense:</span>
                                    <span className={styles.value}>₹{Math.round(row.statsDto?.approvedExpense || 0)}</span>
                                </div>
                            </div>
                        </div>
                        {getAnomalyCount(row.employeeId) > 0 && (
                            <div className={styles.anomalyWarning}>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => calculateDistances(row.employeeId)}
                                                disabled={isCalculating[row.employeeId]}
                                                className={styles.anomalyButton}
                                            >
                                                {isCalculating[row.employeeId] ? (
                                                    "Calculating..."
                                                ) : (
                                                    <>
                                                        <ExclamationTriangleIcon className={styles.warningIcon} />
                                                        {getAnomalyCount(row.employeeId)} anomalies detected
                                                    </>
                                                )}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Click to recalculate distances for days with anomalies</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        )}
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
                    <Select onValueChange={setSelectedYear} defaultValue={selectedYear}>
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
                    <Select onValueChange={setSelectedMonth} defaultValue={selectedMonth}>
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
                    <Select onValueChange={setSelectedFieldOfficer} defaultValue={selectedFieldOfficer}>
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
            {isDataAvailable ? (
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