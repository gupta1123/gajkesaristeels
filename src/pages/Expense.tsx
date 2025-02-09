import * as React from "react";
import { useState, useEffect, useCallback } from 'react';

import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Card, CardTitle, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckIcon, XMarkIcon, InformationCircleIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectValue,
    SelectItem
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import {
    Pagination,
    PaginationContent,
    PaginationLink,
    PaginationItem,
    PaginationPrevious,
    PaginationNext
} from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";
import './Expense.css';

interface Expense {
    id: string;
    employeeName: string;
    expenseDate: string;
    type: string;
    amount: number | null;
    description: string;
    approvalStatus: string;
}

const ExpensePage = () => {
    const [expenseData, setExpenseData] = useState<Expense[]>([]);
    const [updateTrigger, setUpdateTrigger] = useState(false);
    const [selectedExpenseCategories, setSelectedExpenseCategories] = useState<string[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedFieldOfficer, setSelectedFieldOfficer] = useState<string>('all');
    const [selectedExpenseCategory, setSelectedExpenseCategory] = useState<string>('all');
    const [fieldOfficers, setFieldOfficers] = useState<string[]>([]);
    const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
    const token = useSelector((state: RootState) => state.auth.token);
    const role = useSelector((state: RootState) => state.auth.role);
    const teamId = useSelector((state: RootState) => state.auth.teamId);
    const [expandedCard, setExpandedCard] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
    const [sortColumn, setSortColumn] = useState<string>('employeeName');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
    const [lastClickedColumn, setLastClickedColumn] = useState<string | null>(null);
    const itemsPerPageCard = 5;
    const itemsPerPageTable = 10;



    const fetchExpenseData = useCallback(async () => {
        try {
            let response;
            if (role === 'MANAGER' && teamId) {
                response = await fetch(`https://api.gajkesaristeels.in/expense/getForTeam?id=${teamId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
            } else {
                const start = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];
                const end = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0];
                response = await fetch(`https://api.gajkesaristeels.in/expense/getByDateRange?start=${start}&end=${end}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
            }

            if (!response.ok) {
                const errorDetails = await response.json();
                throw new Error(`Error fetching expense data: ${errorDetails.message}`);
            }

            const data = await response.json();
            setExpenseData(data);

            const officers = Array.from(new Set(data.map((expense: Expense) => expense.employeeName))) as string[];
            setFieldOfficers(officers);

            const categories = Array.from(new Set(data.map((expense: Expense) => expense.type))) as string[];
            setExpenseCategories(categories);
        } catch (error) {
            console.error('Error fetching expense data:', error);
        }
    }, [role, teamId, token, selectedYear, selectedMonth]);

    useEffect(() => {
        fetchExpenseData();
    }, [selectedEmployee, selectedYear, selectedMonth, selectedStatus, selectedFieldOfficer, selectedExpenseCategory, updateTrigger, fetchExpenseData]);


    const handleApprove = async (employeeName: string, expenseId: string) => {
        try {
            const response = await fetch(`https://api.gajkesaristeels.in/expense/updateApproval?id=${expenseId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    approvalStatus: 'Approved',
                    approvalDate: new Date().toISOString().split('T')[0],
                    reimbursedDate: '2023-03-23',
                    reimbursementAmount: 200,
                    paymentMethod: 'cash',
                }),
            });

            if (response.ok) {
                setExpenseData((prevExpenseData) =>
                    prevExpenseData.map((expense) =>
                        expense.id === expenseId && expense.employeeName === employeeName
                            ? { ...expense, approvalStatus: 'Approved' }
                            : expense
                    )
                );
                setUpdateTrigger((prev) => !prev);
                console.log('Expense approved successfully');
            } else {
                console.error('Error approving expense');
            }
        } catch (error) {
            console.error('Error approving expense:', error);
        }
    };

    const handleReject = async (employeeName: string, expenseId: string) => {
        try {
            const response = await fetch(`https://api.gajkesaristeels.in/expense/reject?id=${expenseId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    approvalStatus: 'Rejected',
                    approvalDate: new Date().toISOString().split('T')[0],
                    rejectionReason: 'Reason',
                }),
            });

            if (response.ok) {
                setExpenseData((prevExpenseData) =>
                    prevExpenseData.map((expense) =>
                        expense.id === expenseId && expense.employeeName === employeeName
                            ? { ...expense, approvalStatus: 'Rejected' }
                            : expense
                    )
                );
                setUpdateTrigger((prev) => !prev);
                console.log('Expense rejected successfully');
            } else {
                console.error('Error rejecting expense');
            }
        } catch (error) {
            console.error('Error rejecting expense:', error);
        }
    };

    const handleApproveAll = async () => {
        const selectedExpenses = expenseData.filter((expense) => selectedExpenseIds.includes(expense.id));

        const approveExpenses = selectedExpenses.map((expense) => ({
            id: expense.id,
            approvalStatus: "Approved",
            approvalDate: new Date().toISOString().split('T')[0],
            reimbursedDate: '2023-03-23',
            reimbursementAmount: expense.amount || 0,
            paymentMethod: 'cash',
        }));

        try {
            const response = await fetch('https://api.gajkesaristeels.in/expense/approveMultiple', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(approveExpenses),
            });

            if (response.ok) {
                setExpenseData((prevExpenseData) =>
                    prevExpenseData.map((expense) =>
                        selectedExpenseIds.includes(expense.id)
                            ? { ...expense, approvalStatus: 'Approved' }
                            : expense
                    )
                );
                setSelectedExpenseIds([]);
                console.log('Selected expenses approved successfully');
            } else {
                console.error('Error approving expenses');
            }
        } catch (error) {
            console.error('Error approving expenses:', error);
        }
    };

    const handleRejectAll = async () => {
        const selectedExpenses = expenseData.filter((expense) => selectedExpenseIds.includes(expense.id));

        const rejectExpenses = selectedExpenses.map((expense) => ({
            id: expense.id,
            approvalStatus: 'Rejected',
            approvalDate: new Date().toISOString().split('T')[0],
            rejectionReason: 'Reason',
        }));

        try {
            const response = await fetch('https://api.gajkesaristeels.in/expense/rejectMultiple', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(rejectExpenses),
            });

            if (response.ok) {
                setExpenseData((prevExpenseData) =>
                    prevExpenseData.map((expense) =>
                        selectedExpenseIds.includes(expense.id)
                            ? { ...expense, approvalStatus: 'Rejected' }
                            : expense
                    )
                );
                setSelectedExpenseIds([]);
                console.log('Selected expenses rejected successfully');
            } else {
                console.error('Error rejecting expenses');
            }
        } catch (error) {
            console.error('Error rejecting expenses:', error);
        }
    };

    const handleShowDetails = (employeeName: string) => {
        setExpandedCard((prev) => (prev === employeeName ? null : employeeName));
        setCurrentPage(1);
    };

    const groupedExpenseData = expenseData.reduce((result, expense) => {
        if (!result[expense.employeeName]) {
            result[expense.employeeName] = [];
        }
        result[expense.employeeName].push(expense);
        return result;
    }, {} as Record<string, Expense[]>);

    const renderExpenseIcon = (type: string) => {
        switch (type) {
            case 'Travel - Car':
                return <div className="h-5 w-5 bg-blue-500 rounded-full"></div>;
            case 'Food':
                return <div className="h-5 w-5 bg-gray-500 rounded-full"></div>;
            case 'Accommodation':
                return <div className="h-5 w-5 bg-gray-500 rounded-full"></div>;
            default:
                return null;
        }
    };

    const handleClearEmployeeFilter = () => {
        setSelectedEmployee(null);
    };

    const years = Array.from({ length: 27 }, (_, index) => 2024 + index);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
        setLastClickedColumn(column);
        setCurrentPage(1);  // Reset to the first page on sort change

        setTimeout(() => {
            setLastClickedColumn(null);
        }, 20000);  // Hide the icon after 20 seconds
    };

    const handleStatusChange = (value: string) => {
        setSelectedStatus(value);
    };

    const handleFieldOfficerChange = (value: string) => {
        setSelectedFieldOfficer(value);
    };

    const handleExpenseCategoryChange = (value: string) => {
        setSelectedExpenseCategory(value);
    };

    const filteredExpenseData = expenseData.filter((expense) => {
        if (selectedStatus && selectedStatus !== 'all' && expense.approvalStatus !== selectedStatus) {
            return false;
        }
        if (selectedFieldOfficer && selectedFieldOfficer !== 'all' && expense.employeeName !== selectedFieldOfficer) {
            return false;
        }
        if (selectedExpenseCategory && selectedExpenseCategory !== 'all' && expense.type !== selectedExpenseCategory) {
            return false;
        }
        if (selectedEmployee && !expense.employeeName.toLowerCase().includes(selectedEmployee.toLowerCase())) {
            return false;
        }
        return true;
    });

    const sortedExpenseData = filteredExpenseData.sort((a, b) => {
        if (sortColumn) {
            const aValue = a[sortColumn as keyof Expense];
            const bValue = b[sortColumn as keyof Expense];

            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
            if (bValue == null) return sortDirection === 'asc' ? 1 : -1;

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            } else {
                return sortDirection === 'asc' ?
                    (aValue < bValue ? -1 : aValue > bValue ? 1 : 0) :
                    (bValue < aValue ? -1 : bValue > aValue ? 1 : 0);
            }
        } else {
            const aDate = new Date(a.expenseDate);
            const bDate = new Date(b.expenseDate);
            return bDate.getTime() - aDate.getTime();
        }
    });

    const paginate = (array: Expense[], page: number, itemsPerPage: number) => {
        return array.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    };

    const paginatedExpenseDataCard = paginate(sortedExpenseData, currentPage, itemsPerPageCard);
    const totalPagesCard = Math.ceil(sortedExpenseData.length / itemsPerPageCard);
    const paginatedExpenseDataTable = paginate(sortedExpenseData, currentPage, itemsPerPageTable);
    const totalPagesTable = Math.ceil(sortedExpenseData.length / itemsPerPageTable);

    useEffect(() => {
        if (filteredExpenseData.length && (currentPage > totalPagesCard)) {
            setCurrentPage(totalPagesCard);
        }
    }, [filteredExpenseData, currentPage, totalPagesCard]);

    const getPaginationGroup = (totalPages: number) => {
        const start = Math.floor((currentPage - 1) / itemsPerPageCard) * itemsPerPageCard;
        return new Array(itemsPerPageCard)
            .fill(0)
            .map((_, idx) => start + idx + 1)
            .filter((page) => page <= totalPages && page <= totalPagesCard);
    };

    const renderNoDataMessage = () => {
        if (filteredExpenseData.length === 0) {
            return (
                <div className="text-red-500 text-center mt-4">
                    No data available for the selected month and year. Please choose a different month or year.
                </div>
            );
        }
        return null;
    };

    return (
        <div className="container-expense mx-auto py-4 px-2 sm:px-4 md:px-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center">Expense Management</h1>
        
        {/* Mobile-friendly filter options */}
        <div className="flex flex-col sm:flex-row justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 items-start sm:items-center">
                    <Input
                        type="text"
                        placeholder="Search for Employee"
                        value={selectedEmployee || ""}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                        className="w-[200px]"
                    />
                    <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Select Month" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map((month, index) => (
                                <SelectItem key={month} value={index.toString()}>
                                    {month}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {viewMode === 'table' && (
                        <>
                            <Select onValueChange={handleStatusChange} value={selectedStatus}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Approved">Approved</SelectItem>
                                    <SelectItem value="Rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select onValueChange={handleExpenseCategoryChange} value={selectedExpenseCategory}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by Expense Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Expense Categories</SelectItem>
                                    {expenseCategories.map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="ml-4">Actions</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onSelect={handleApproveAll}>
                                        Approve All
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={handleRejectAll}>
                                        Reject All
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    )}
                </div>
                <div className="hidden sm:flex items-center ml-4">
    <label htmlFor="toggleSwitch" className="flex items-center cursor-pointer">
        <div className="relative">
            <input
                type="checkbox"
                id="toggleSwitch"
                className="sr-only"
                checked={viewMode === "table"}
                onChange={(e) => setViewMode(e.target.checked ? "table" : "card")}
            />
            <div className="block bg-gray-300 w-14 h-8 rounded-full"></div>
            <div
                className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${viewMode === "table" ? "transform translate-x-full" : ""}`}
            ></div>
        </div>
        <div className="ml-3 text-gray-700 font-medium">
            {viewMode === "table" ? "Table View" : "Card View"}
        </div>
    </label>
</div>
            </div>

            {viewMode === 'card' ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Object.entries(groupedExpenseData)
                            .filter(([employeeName]) => !selectedEmployee || employeeName.toLowerCase().includes(selectedEmployee.toLowerCase()))
                            .map(([employeeName, expenses]) => {
                                const total = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
                                const approved = expenses.filter((expense) => expense.approvalStatus === 'Approved').reduce((sum, expense) => sum + (expense.amount || 0), 0);
                                const rejected = expenses.filter((expense) => expense.approvalStatus === 'Rejected').reduce((sum, expense) => sum + (expense.amount || 0), 0);
                                const pending = expenses.filter((expense) => expense.approvalStatus === 'Pending').reduce((sum, expense) => sum + (expense.amount || 0), 0);

                                const isExpanded = expandedCard === employeeName;
                                const paginatedExpenses = isExpanded ? paginate(expenses, currentPage, itemsPerPageCard) : [];

                                // Calculate total pages for this employee's expenses
                                const totalPagesForEmployee = Math.ceil(expenses.length / itemsPerPageCard);

                                return (
                                    <div key={employeeName} className={`col-span-1 ${isExpanded ? 'row-span-2' : ''}`}>
                                        <Card className="p-3 bg-white shadow-md rounded-lg h-full">
                                            <CardTitle className="text-lg font-bold mb-2 text-center">{employeeName}</CardTitle>
                                            <div className="flex justify-between mb-3">
                                                <div className="bg-gray-100 p-1 rounded-lg shadow-sm text-center flex-1 mx-1">
                                                    <p className="text-xs text-gray-800">Approved</p>
                                                    <p className="text-sm text-gray-800">₹{approved.toFixed(2)}</p>
                                                </div>
                                                <div className="bg-gray-100 p-1 rounded-lg shadow-sm text-center flex-1 mx-1">
                                                    <p className="text-xs text-gray-800">Rejected</p>
                                                    <p className="text-sm text-gray-800">₹{rejected.toFixed(2)}</p>
                                                </div>
                                                <div className="bg-gray-100 p-1 rounded-lg shadow-sm text-center flex-1 mx-1">
                                                    <p className="text-xs text-gray-800">Pending</p>
                                                    <p className="text-sm text-gray-800">₹{pending.toFixed(2)}</p>
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-md font-semibold mb-2">Recent Expenses</h3>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleShowDetails(employeeName)}
                                                        className="text-sm font-medium text-gray-500 hover:text-gray-700"
                                                    >
                                                        {isExpanded ? 'Hide Details' : 'Show All Expenses'}
                                                    </Button>
                                                </div>
                                                {paginatedExpenses.map((expense) => (
                                                    <div key={expense.id} className="flex items-center justify-between mb-2 bg-gray-50 p-2 rounded-md shadow-sm">
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                checked={selectedExpenseIds.includes(expense.id)}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        setSelectedExpenseIds((prevIds) => [...prevIds, expense.id]);
                                                                    } else {
                                                                        setSelectedExpenseIds((prevIds) => prevIds.filter((id) => id !== expense.id));
                                                                    }
                                                                }}
                                                            />
                                                            {renderExpenseIcon(expense.type)}
                                                            <div>
                                                                <p className="font-semibold text-sm">{expense.type} <InformationCircleIcon className="h-4 w-4 text-gray-400 inline-block" /></p>
                                                                <p className="text-xs text-gray-500">{expense.expenseDate}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <div className="text-right">
                                                                <span
                                                                    className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${expense.approvalStatus === 'Approved'
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : expense.approvalStatus === 'Rejected'
                                                                            ? 'bg-red-100 text-red-800'
                                                                            : 'bg-yellow-100 text-yellow-800'
                                                                        }`}
                                                                >
                                                                    {expense.approvalStatus}
                                                                </span>
                                                                <p className="text-sm mt-1">₹{expense.amount ? expense.amount.toFixed(2) : '0.00'}</p>
                                                            </div>
                                                            <Button variant="ghost" size="sm" onClick={() => handleApprove(employeeName, expense.id)}>
                                                                <CheckIcon className="h-4 w-4 text-green-500" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" onClick={() => handleReject(employeeName, expense.id)}>
                                                                <XMarkIcon className="h-4 w-4 text-red-500" />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                ))}
                                                {isExpanded && totalPagesForEmployee > 1 && (
                                                    <Pagination className="flex justify-center items-center mt-4">
                                                        <PaginationPrevious
                                                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                                        />
                                                        <PaginationContent>
                                                            {getPaginationGroup(totalPagesForEmployee).map((page, index) => (
                                                                <PaginationItem key={index}>
                                                                    <PaginationLink
                                                                        isActive={page === currentPage}
                                                                        onClick={() => setCurrentPage(page)}
                                                                    >
                                                                        {page}
                                                                    </PaginationLink>
                                                                </PaginationItem>
                                                            ))}
                                                        </PaginationContent>
                                                        <PaginationNext
                                                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPagesForEmployee))}
                                                        />
                                                    </Pagination>
                                                )}
                                            </div>
                                            {isExpanded && (
                                                <div className="flex justify-center space-x-2">
                                                    <Button variant="outline" size="sm" onClick={handleApproveAll}>
                                                        Approve All
                                                    </Button>
                                                    <Button variant="destructive" size="sm" onClick={handleRejectAll}>
                                                        Reject All
                                                    </Button>
                                                </div>
                                            )}
                                        </Card>
                                    </div>
                                );
                            })}
                    </div>
                    {renderNoDataMessage()}
                </>
            ) : (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold">
                                Expense Table
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>
                                            <Checkbox />
                                        </TableHead>
                                        <TableHead onClick={() => handleSort('employeeName')} className="cursor-pointer">
                                            Field Officer Name
                                            {lastClickedColumn === 'employeeName' && (sortDirection === 'asc' ? <ArrowUpIcon className="h-4 w-4 inline-block" /> : <ArrowDownIcon className="h-4 w-4 inline-block" />)}
                                        </TableHead>
                                        <TableHead onClick={() => handleSort('expenseDate')} className="cursor-pointer">
                                            Date
                                            {lastClickedColumn === 'expenseDate' && (sortDirection === 'asc' ? <ArrowUpIcon className="h-4 w-4 inline-block" /> : <ArrowDownIcon className="h-4 w-4 inline-block" />)}
                                        </TableHead>
                                        <TableHead onClick={() => handleSort('type')} className="cursor-pointer">
                                            Expense Category
                                            {lastClickedColumn === 'type' && (sortDirection === 'asc' ? <ArrowUpIcon className="h-4 w-4 inline-block" /> : <ArrowDownIcon className="h-4 w-4 inline-block" />)}
                                        </TableHead>
                                        <TableHead onClick={() => handleSort('amount')} className="cursor-pointer">
                                            Amount
                                            {lastClickedColumn === 'amount' && (sortDirection === 'asc' ? <ArrowUpIcon className="h-4 w-4 inline-block" /> : <ArrowDownIcon className="h-4 w-4 inline-block" />)}
                                        </TableHead>
                                        <TableHead onClick={() => handleSort('description')} className="cursor-pointer">
                                            Description
                                            {lastClickedColumn === 'description' && (sortDirection === 'asc' ? <ArrowUpIcon className="h-4 w-4 inline-block" /> : <ArrowDownIcon className="h-4 w-4 inline-block" />)}
                                        </TableHead>
                                        <TableHead onClick={() => handleSort('approvalStatus')} className="cursor-pointer">
                                            Status
                                            {lastClickedColumn === 'approvalStatus' && (sortDirection === 'asc' ? <ArrowUpIcon className="h-4 w-4 inline-block" /> : <ArrowDownIcon className="h-4 w-4 inline-block" />)}
                                        </TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedExpenseDataTable.map((expense) => (
                                        <TableRow key={expense.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedExpenseIds.includes(expense.id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedExpenseIds((prevIds) => [...prevIds, expense.id]);
                                                        } else {
                                                            setSelectedExpenseIds((prevIds) => prevIds.filter((id) => id !== expense.id));
                                                        }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>{expense.employeeName}</TableCell>
                                            <TableCell>{expense.expenseDate}</TableCell>
                                            <TableCell>{expense.type}</TableCell>
                                            <TableCell>{expense.amount}</TableCell>
                                            <TableCell>{expense.description}</TableCell>
                                            <TableCell>
                                                <span
                                                    className={`px-2 py-1 rounded-full font-semibold ${expense.approvalStatus === 'Approved'
                                                        ? 'bg-green-100 text-green-800'
                                                        : expense.approvalStatus === 'Rejected'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                        }`}
                                                >
                                                    {expense.approvalStatus}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline">Actions</Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuItem onSelect={() => handleApprove(expense.employeeName, expense.id)}>
                                                            Approve
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => handleReject(expense.employeeName, expense.id)}>
                                                            Reject
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    {renderNoDataMessage()}
                    <div className="flex justify-center items-center overflow-x-auto mt-4">
                        <Pagination className="flex justify-center items-center">
                            <PaginationPrevious
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            />
                            <PaginationContent>
                                {getPaginationGroup(totalPagesTable).map((page, index) => (
                                    <PaginationItem key={index}>
                                        <PaginationLink
                                            isActive={page === currentPage}
                                            onClick={() => setCurrentPage(page)}
                                        >
                                            {page}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}
                            </PaginationContent>
                            <PaginationNext
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPagesTable))}
                            />
                        </Pagination>
                    </div>
                </>
            )}
        </div>
    );
};

export default ExpensePage;
