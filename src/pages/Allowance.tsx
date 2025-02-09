import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
} from "@/components/ui/pagination";
import { notification } from 'antd';
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import { CurrencyDollarIcon, TruckIcon } from "@heroicons/react/24/outline";
import styles from './Allowance.module.css';

const Allowance: React.FC<{ authToken: string | null }> = ({ authToken }) => {
    const [employees, setEmployees] = useState<any[]>([]);
    const [editMode, setEditMode] = useState<{ [key: number]: boolean }>({});
    const [editedData, setEditedData] = useState<{ [key: number]: any }>({});
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [travelRates, setTravelRates] = useState<Array<{ id: number, employeeId: number, carRatePerKm: number, bikeRatePerKm: number }>>([]);
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const [expandedCards, setExpandedCards] = useState<{ [key: number]: boolean }>({});
    const rowsPerPage = 10;

    useEffect(() => {
        const checkIfMobile = () => setIsMobile(window.innerWidth < 768);
        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    const fetchEmployees = useCallback(async () => {
        try {
            const response = await fetch('https://api.gajkesaristeels.in/employee/getAll', {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            });
            const data = await response.json();
            const sortedData = data.sort((a: any, b: any) => a.firstName.localeCompare(b.firstName));
            setEmployees(sortedData);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    }, [authToken]);

    const fetchTravelRates = useCallback(async () => {
        try {
            const response = await fetch('https://api.gajkesaristeels.in/travel-rates/getAll', {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch travel rates');
            }
            const data = await response.json();
            setTravelRates(data);
        } catch (error) {
            console.error('Error fetching travel rates:', error);
        }
    }, [authToken]);

    useEffect(() => {
        fetchEmployees();
        fetchTravelRates();
    }, [fetchEmployees, fetchTravelRates]);

    const handleInputChange = (employeeId: number, field: string, value: string) => {
        setEditedData(prevData => ({
            ...prevData,
            [employeeId]: {
                ...prevData[employeeId],
                [field]: value
            }
        }));
    };

    const updateSalary = async (employeeId: number) => {
        const employee = editedData[employeeId];
        if (!employee) return;

        try {
            const salaryResponse = await fetch(`https://api.gajkesaristeels.in/employee/setSalary`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    travelAllowance: employee.travelAllowance,
                    dearnessAllowance: employee.dearnessAllowance,
                    fullMonthSalary: employee.fullMonthSalary,
                    employeeId: employeeId,
                }),
            });

            if (!salaryResponse.ok) {
                throw new Error('Failed to update salary');
            }

            const existingTravelRate = travelRates.find(rate => rate.employeeId === employeeId);
            const travelRateData = {
                employeeId: employeeId,
                carRatePerKm: parseFloat(employee.carRatePerKm) || 0,
                bikeRatePerKm: parseFloat(employee.bikeRatePerKm) || 0
            };

            let travelRateResponse;
            if (existingTravelRate) {
                travelRateResponse = await fetch(`https://api.gajkesaristeels.in/travel-rates/edit?id=${existingTravelRate.id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(travelRateData),
                });
            } else {
                travelRateResponse = await fetch(`https://api.gajkesaristeels.in/travel-rates/create`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(travelRateData),
                });
            }

            if (!travelRateResponse.ok) {
                throw new Error('Failed to update travel rates');
            }

            fetchEmployees();
            fetchTravelRates();
            setEditMode(prevMode => ({
                ...prevMode,
                [employeeId]: false
            }));
            notification.success({
                message: 'Success',
                description: 'Salary and travel rates updated successfully!',
            });
        } catch (error) {
            console.error('Error saving changes:', error);
            notification.error({
                message: 'Error',
                description: 'Error saving changes.',
            });
        }
    };

    const startEdit = (employeeId: number) => {
        const employee = employees.find(e => e.id === employeeId);
        const travelRate = travelRates.find(rate => rate.employeeId === employeeId);
        setEditMode(prevMode => ({
            ...prevMode,
            [employeeId]: true
        }));
        setEditedData(prevData => ({
            ...prevData,
            [employeeId]: {
                travelAllowance: employee?.travelAllowance || 0,
                dearnessAllowance: employee?.dearnessAllowance || 0,
                fullMonthSalary: employee?.fullMonthSalary || 0,
                carRatePerKm: travelRate?.carRatePerKm || 0,
                bikeRatePerKm: travelRate?.bikeRatePerKm || 0
            }
        }));
    };

    const cancelEdit = (employeeId: number) => {
        setEditMode(prevMode => ({
            ...prevMode,
            [employeeId]: false
        }));
        setEditedData(prevData => {
            const newData = { ...prevData };
            delete newData[employeeId];
            return newData;
        });
    };

    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = employees.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(employees.length / rowsPerPage);

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    const toggleCardExpansion = (employeeId: number) => {
        setExpandedCards(prev => ({
            ...prev,
            [employeeId]: !prev[employeeId]
        }));
    };

    return (
        <div className={styles.allowanceContainer}>
            <h2 className="text-2xl font-bold mb-4">Allowance Details</h2>
            {isMobile ? (
                <div className="space-y-4">
                    {currentRows.map((employee) => (
                        <Card key={employee.id} className="overflow-hidden">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <Avatar className="h-12 w-12 bg-blue-500">
                                            <AvatarFallback>{getInitials(employee.firstName, employee.lastName)}</AvatarFallback>
                                        </Avatar>
                                        <CardTitle>{`${employee.firstName} ${employee.lastName}`}</CardTitle>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleCardExpansion(employee.id)}
                                    >
                                        {expandedCards[employee.id] ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                                    </Button>
                                </div>
                            </CardHeader>
                            {expandedCards[employee.id] && (
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <CurrencyDollarIcon className="h-5 w-5 text-green-500" />
                                                <span className="font-medium">DA:</span>
                                            </div>
                                            {editMode[employee.id] ? (
                                                <Input
                                                    type="number"
                                                    value={editedData[employee.id]?.dearnessAllowance ?? employee.dearnessAllowance}
                                                    onChange={(e) => handleInputChange(employee.id, 'dearnessAllowance', e.target.value)}
                                                    className="w-24 text-right"
                                                />
                                            ) : (
                                                <span className="font-semibold">{employee.dearnessAllowance}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <CurrencyDollarIcon className="h-5 w-5 text-blue-500" />
                                                <span className="font-medium">Salary:</span>
                                            </div>
                                            {editMode[employee.id] ? (
                                                <Input
                                                    type="number"
                                                    value={editedData[employee.id]?.fullMonthSalary ?? employee.fullMonthSalary}
                                                    onChange={(e) => handleInputChange(employee.id, 'fullMonthSalary', e.target.value)}
                                                    className="w-24 text-right"
                                                />
                                            ) : (
                                                <span className="font-semibold">{employee.fullMonthSalary}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <TruckIcon className="h-5 w-5 text-yellow-500" />
                                                <span className="font-medium">Car Rate:</span>
                                            </div>
                                            {editMode[employee.id] ? (
                                                <Input
                                                    type="number"
                                                    value={editedData[employee.id]?.carRatePerKm ?? travelRates.find(rate => rate.employeeId === employee.id)?.carRatePerKm ?? 0}
                                                    onChange={(e) => handleInputChange(employee.id, 'carRatePerKm', e.target.value)}
                                                    className="w-24 text-right"
                                                />
                                            ) : (
                                                <span className="font-semibold">{travelRates.find(rate => rate.employeeId === employee.id)?.carRatePerKm ?? 0}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <TruckIcon className="h-5 w-5 text-purple-500" />
                                                <span className="font-medium">Bike Rate:</span>
                                            </div>
                                            {editMode[employee.id] ? (
                                                <Input
                                                    type="number"
                                                    value={editedData[employee.id]?.bikeRatePerKm ?? travelRates.find(rate => rate.employeeId === employee.id)?.bikeRatePerKm ?? 0}
                                                    onChange={(e) => handleInputChange(employee.id, 'bikeRatePerKm', e.target.value)}
                                                    className="w-24 text-right"
                                                />
                                            ) : (
                                                <span className="font-semibold">{travelRates.find(rate => rate.employeeId === employee.id)?.bikeRatePerKm ?? 0}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        {editMode[employee.id] ? (
                                            <div className="flex space-x-2">
                                                <Button onClick={() => updateSalary(employee.id)} className="flex-1">Save</Button>
                                                <Button onClick={() => cancelEdit(employee.id)} variant="outline" className="flex-1">Cancel</Button>
                                            </div>
                                        ) : (
                                            <Button onClick={() => startEdit(employee.id)} className="w-full">Edit</Button>
                                        )}
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>DA</TableHead>
                            <TableHead>Salary</TableHead>
                            <TableHead>Car Rate (per km)</TableHead>
                            <TableHead>Bike Rate (per km)</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentRows.map((employee) => (
                            <TableRow key={employee.id}>
                                <TableCell>{employee.firstName} {employee.lastName}</TableCell>
                                <TableCell>
                                    {editMode[employee.id] ? (
                                        <Input
                                            type="number"
                                            value={editedData[employee.id]?.dearnessAllowance ?? employee.dearnessAllowance}
                                            onChange={(e) => handleInputChange(employee.id, 'dearnessAllowance', e.target.value)}
                                            className="w-full"
                                        />
                                    ) : (
                                        employee.dearnessAllowance
                                    )}
                                </TableCell>
                                <TableCell>
                                    {editMode[employee.id] ? (
                                        <Input
                                            type="number"
                                            value={editedData[employee.id]?.fullMonthSalary ?? employee.fullMonthSalary}
                                            onChange={(e) => handleInputChange(employee.id, 'fullMonthSalary', e.target.value)}
                                            className="w-full"
                                        />
                                    ) : (
                                        employee.fullMonthSalary
                                    )}
                                </TableCell>
                                <TableCell>
                                    {editMode[employee.id] ? (
                                        <Input
                                            type="number"
                                            value={editedData[employee.id]?.carRatePerKm ?? travelRates.find(rate => rate.employeeId === employee.id)?.carRatePerKm ?? 0}
                                            onChange={(e) => handleInputChange(employee.id, 'carRatePerKm', e.target.value)}
                                            className="w-full"
                                        />
                                    ) : (
                                        travelRates.find(rate => rate.employeeId === employee.id)?.carRatePerKm ?? 0
                                    )}
                                </TableCell>
                                <TableCell>
                                    {editMode[employee.id] ? (
                                        <Input
                                            type="number"
                                            value={editedData[employee.id]?.bikeRatePerKm ?? travelRates.find(rate => rate.employeeId === employee.id)?.bikeRatePerKm ?? 0}
                                            onChange={(e) => handleInputChange(employee.id, 'bikeRatePerKm', e.target.value)}
                                            className="w-full"
                                        />
                                    ) : (
                                        travelRates.find(rate => rate.employeeId === employee.id)?.bikeRatePerKm ?? 0
                                    )}
                                </TableCell>
                                <TableCell>
                                    {editMode[employee.id] ? (
                                        <div className="flex space-x-2">
                                            <Button onClick={() => updateSalary(employee.id)} className="flex-1">Save</Button>
                                            <Button onClick={() => cancelEdit(employee.id)} variant="outline" className="flex-1">Cancel</Button>
                                        </div>
                                    ) : (
                                        <Button onClick={() => startEdit(employee.id)} className="w-full">Edit</Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
            <Pagination className="mt-4">
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
        </div>
    );
};

export default Allowance;