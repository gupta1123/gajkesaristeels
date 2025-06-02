import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store'; 
import './FieldOfficerVisitReport.css';
import { ClipLoader } from 'react-spinners'; 
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button'; 
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from '@radix-ui/react-icons'; 
import { cn } from "@/lib/utils";
import dayjs from 'dayjs'; 
import Link from 'next/link'; 
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'; 
import { Input } from "@/components/ui/input"


interface AttendanceStats {
    absences: number;
    halfDays: number;
    fullDays: number;
}

interface VisitsByCustomerType {
    [key: string]: number; 
}

interface FieldOfficerStatsResponse {
    totalVisits: number;
    attendanceStats: AttendanceStats;
    completedVisits: number;
    visitsByCustomerType: VisitsByCustomerType;
}

interface EmployeeUserDto {
    username: string;
    password?: string | null;
    roles?: string[] | null;
    employeeId?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    plainPassword?: string;
}

interface Employee {
    id: number;
    firstName: string;
    lastName: string;
    employeeId: string;
    primaryContact: number;
    secondaryContact?: number;
    departmentName: string;
    email: string;
    role: string; 
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country: string;
    pincode: number;
    dateOfJoining: string;
    createdAt: string;
    updatedAt: string;
    userDto?: EmployeeUserDto;
    teamId?: string | null;
    isOfficeManager?: boolean;
    assignedCity?: string[];
    travelAllowance?: number | null;
    dearnessAllowance?: number | null;
    createdTime?: string;
    updatedTime?: string;
    companyId?: string | null;
    companyName?: string | null;
    fullMonthSalary?: number | null;
    status?: string | null; 
}


interface VisitDetail {
    avgIntentLevel: number;
    avgMonthlySales: number;
    visitCount: number;
    lastVisited: string; 
    city: string;
    taluka: string;
    state: string;
    customerName: string;
    customerType: string; 
    storeId: number; 
}

const formatSalesNumber = (num: number): string => {
    if (num >= 10000000) { // Crores
        const val = num / 10000000;
        return (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + 'Cr';
    }
    if (num >= 100000) { // Lakhs
        const val = num / 100000;
        return (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + 'L';
    }
    if (num >= 1000) { // Thousands
        const val = num / 1000;
        return (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + 'K';
    }
    return num.toString();
};

const FieldOfficerVisitReport: React.FC = () => {
    const token = useSelector((state: RootState) => state.auth.token);

    const [fieldOfficers, setFieldOfficers] = useState<Employee[]>([]);
    const [employeesLoading, setEmployeesLoading] = useState<boolean>(true);
    const [employeesError, setEmployeesError] = useState<string | null>(null);

    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [rangeSelect, setRangeSelect] = useState<string>('');
    
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const [isStartDatePopoverOpen, setIsStartDatePopoverOpen] = useState(false);
    const [isEndDatePopoverOpen, setIsEndDatePopoverOpen] = useState(false);

    const [reportLoading, setReportLoading] = useState<boolean>(false);
    const [reportError, setReportError] = useState<string | null>(null);

    const [showReport, setShowReport] = useState<boolean>(false);
    const [summaryHeader, setSummaryHeader] = useState<React.ReactNode>(null);
    const [summaryRow, setSummaryRow] = useState<React.ReactNode>(null);

    const [visitDetails, setVisitDetails] = useState<VisitDetail[] | null>(null);
    const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
    const [detailsError, setDetailsError] = useState<string | null>(null);
    const [selectedCustomerTypeForDetails, setSelectedCustomerTypeForDetails] = useState<string | null>(null);
    const [employeeSearchTerm, setEmployeeSearchTerm] = useState<string>(""); // New state for search
    const searchInputRef = React.useRef<HTMLInputElement>(null); // Added ref for search input
    const [dateRangeError, setDateRangeError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllEmployeeData = async () => {
            setEmployeesLoading(true);
            setEmployeesError(null);
            try {
                const [allEmployeesResponse, inactiveEmployeesResponse] = await Promise.all([
                    fetch('https://api.gajkesaristeels.in/employee/getAll', {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch('https://api.gajkesaristeels.in/employee/getAllInactive', {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);
                if (!allEmployeesResponse.ok) throw new Error(`Failed to fetch all employees: ${allEmployeesResponse.statusText}`);
                if (!inactiveEmployeesResponse.ok) throw new Error(`Failed to fetch inactive employees: ${inactiveEmployeesResponse.statusText}`);
                const allEmployees: Employee[] = await allEmployeesResponse.json();
                const inactiveEmployees: Employee[] = await inactiveEmployeesResponse.json();
                const inactiveEmployeeIds = new Set(inactiveEmployees.map(emp => emp.id));
                const activeFieldOfficers = allEmployees
                    .filter(emp => emp.role === 'Field Officer' && !inactiveEmployeeIds.has(emp.id))
                    .sort((a, b) => {
                        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
                        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
                        if (nameA < nameB) return -1;
                        if (nameA > nameB) return 1;
                        return 0;
                    });
                setFieldOfficers(activeFieldOfficers);
                if (activeFieldOfficers.length > 0 && !selectedEmployeeId) {
                    setSelectedEmployeeId(activeFieldOfficers[0].id.toString());
                }
            } catch (err: any) {
                setEmployeesError(err.message || 'Could not fetch employee data.');
                setFieldOfficers([]);
            } finally {
                setEmployeesLoading(false);
            }
        };
        if (token) fetchAllEmployeeData();
    }, [token]);

    useEffect(() => {
        const now = new Date();
        let startDt: Date | undefined, endDt: Date | undefined;
        switch (rangeSelect) {
            case 'last-7-days': endDt = new Date(now); startDt = new Date(now); startDt.setDate(now.getDate() - 6); break;
            case 'last-15-days': endDt = new Date(now); startDt = new Date(now); startDt.setDate(now.getDate() - 14); break;
            case 'last-30-days': endDt = new Date(now); startDt = new Date(now); startDt.setDate(now.getDate() - 29); break;
            case 'last-week': { const day = now.getDay(); startDt = new Date(now); startDt.setDate(now.getDate() - (day + 6)); endDt = new Date(startDt); endDt.setDate(startDt.getDate() + 6); break; }
            case 'last-month': { const y = now.getFullYear(), m = now.getMonth(); startDt = new Date(y, m - 1, 1); endDt = new Date(y, m, 0); break; }
            default: return;
        }
        setStartDate(dayjs(startDt).format('YYYY-MM-DD'));
        setEndDate(dayjs(endDt).format('YYYY-MM-DD'));
    }, [rangeSelect]);

    const displayCategoryToApiTypeMap: { [displayCategory: string]: string } = {
        "Shop": "shop",
        "Site Visit": "site visit",
        "Architect": "architect",
        "Engineer": "engineer",
        "Builder": "builder",
        "Others": "others"
    };

    const fetchCustomerTypeDetails = async (displayCategory: string) => {
        if (!selectedEmployeeId || !startDate || !endDate) {
            setDetailsError("Please generate the main report first.");
            return;
        }
        setDetailsLoading(true);
        setDetailsError(null);
        setVisitDetails(null); 
        setSelectedCustomerTypeForDetails(displayCategory);

        const apiCustomerType = displayCategoryToApiTypeMap[displayCategory] || displayCategory.toLowerCase();

        try {
            const url = `https://api.gajkesaristeels.in/visit/customer-visit-details?employeeId=${selectedEmployeeId}&startDate=${startDate}&endDate=${endDate}&customerType=${apiCustomerType}`;
            const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (!response.ok) {
                const errTxt = await response.text();
                throw new Error(`API Error ${response.status} for ${displayCategory} details: ${errTxt || response.statusText}`);
            }
            const data: VisitDetail[] = await response.json();
            setVisitDetails(data);
        } catch (err: any) {
            setDetailsError(err.message || `Failed to fetch details for ${displayCategory}.`);
            setVisitDetails(null);
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleGenerateReport = async () => {
        if (!rangeSelect) {
            setDateRangeError('Please select a Date Range.');
            return;
        }
        if (!selectedEmployeeId || !startDate || !endDate) {
            setDateRangeError(null);
            alert('Select an officer and both dates.');
            return;
        }
        setDateRangeError(null);
        setReportLoading(true); setReportError(null); setShowReport(false);
        try {
            const url = `https://api.gajkesaristeels.in/visit/field-officer-stats?employeeId=${selectedEmployeeId}&startDate=${startDate}&endDate=${endDate}`;
            const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (!response.ok) { const errTxt = await response.text(); throw new Error(`API Error ${response.status}: ${errTxt || response.statusText}`); }
            const data: FieldOfficerStatsResponse = await response.json();

            const displayCategories = ["Shop", "Site Visit", "Architect", "Engineer", "Builder", "Others"];
            const apiTypeToDisplayCategoryMap: { [apiTypeLowercase: string]: string } = {
                "shop": "Shop",
                "site visit": "Site Visit",
                "architect": "Architect", 
                "engineer": "Engineer",
                "builder": "Builder"
            };

            const categorizedVisits: { [key: string]: number } = {};
            displayCategories.forEach(cat => categorizedVisits[cat] = 0); 

            for (const apiType in data.visitsByCustomerType) {
                const count = data.visitsByCustomerType[apiType];
                const targetDisplayCategory = apiTypeToDisplayCategoryMap[apiType.toLowerCase()];

                if (targetDisplayCategory) {
                    categorizedVisits[targetDisplayCategory] += count;
                } else {
                    categorizedVisits["Others"] += count;
                }
            }

            setSummaryHeader(
                <>
                    <tr>
                        <th rowSpan={2}>Total Visits</th><th rowSpan={2}>Completed Visits</th>
                        <th colSpan={3}>Attendance</th><th colSpan={displayCategories.length}>Visits by Customer Type</th>
                    </tr>
                    <tr>
                        <th>Full Days</th><th>Half Days</th><th>Absences</th>
                        {displayCategories.map(displayCat => (
                            <th key={displayCat}>
                                <button
                                    onClick={() => fetchCustomerTypeDetails(displayCat)}
                                    className="fo-customer-type-link"
                                    disabled={reportLoading || detailsLoading}
                                >
                                    {displayCat}
                                </button>
                            </th>
                        ))}
                    </tr>
                </>
            );
            setSummaryRow(
                <>
                    <td>{data.totalVisits}</td><td>{data.completedVisits}</td>
                    <td>{data.attendanceStats.fullDays}</td><td>{data.attendanceStats.halfDays}</td><td>{data.attendanceStats.absences}</td>
                    {displayCategories.map(type => (<td key={type}>{categorizedVisits[type]}</td>))}
                </>
            );
            setShowReport(true);
            setVisitDetails(null);
            setDetailsError(null);
            setSelectedCustomerTypeForDetails(null);
        } catch (err: any) {
            setReportError(err.message || 'Failed to fetch report data.');
            setShowReport(false);
        } finally {
            setReportLoading(false);
        }
    };

    const handleStartDateSelect = (date: Date | undefined) => {
        if (date) {
            setStartDate(dayjs(date).format('YYYY-MM-DD'));
            if (endDate && dayjs(date).isAfter(dayjs(endDate))) {
                setEndDate('');
            }
        }
        setIsStartDatePopoverOpen(false);
    };

    const handleEndDateSelect = (date: Date | undefined) => {
        if (date) {
            setEndDate(dayjs(date).format('YYYY-MM-DD'));
        }
        setIsEndDatePopoverOpen(false);
    };
    
    const selectedEmployeeName = fieldOfficers.find(emp => emp.id.toString() === selectedEmployeeId)?.firstName + ' ' + fieldOfficers.find(emp => emp.id.toString() === selectedEmployeeId)?.lastName || "Select Field Officer";

    const filteredFieldOfficers = fieldOfficers.filter(officer => 
        `${officer.firstName} ${officer.lastName}`.toLowerCase().includes(employeeSearchTerm.toLowerCase())
    );

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-3xl font-bold text-black text-center">Field Officer Visit Report</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="controls bg-gray-100 p-4 rounded-lg mb-6 flex flex-wrap items-center gap-4 justify-center">
                <div>
                    <label htmlFor="employeeSelectTrigger" className="block text-sm font-medium text-gray-700 mb-1">Field Officer:</label>
                    {employeesLoading ? <div className="flex items-center justify-center min-w-[200px] h-[42px]"><ClipLoader size={24} color="#4A90E2"/></div>
                        : employeesError ? <div className="text-red-500 text-sm min-w-[200px]">Error loading.</div>
                        : <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" id="employeeSelectTrigger" className="min-w-[200px] h-[42px] justify-between text-sm">
                                    {selectedEmployeeId && fieldOfficers.find(emp => emp.id.toString() === selectedEmployeeId) ? `${fieldOfficers.find(emp => emp.id.toString() === selectedEmployeeId)?.firstName} ${fieldOfficers.find(emp => emp.id.toString() === selectedEmployeeId)?.lastName}` : "Select Field Officer"}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="min-w-[200px]">
                                <div className="p-2">
                                    <Input 
                                        ref={searchInputRef}
                                        placeholder="Search officer..."
                                        value={employeeSearchTerm}
                                        onChange={(e) => {
                                            const newValue = e.target.value;
                                            setEmployeeSearchTerm(newValue);
                                            setTimeout(() => {
                                                if (searchInputRef.current && document.activeElement !== searchInputRef.current) {
                                                     searchInputRef.current.focus();
                                                }
                                            }, 0);
                                        }}
                                        className="w-full mb-2 h-8"
                                    />
                                </div>
                                <DropdownMenuRadioGroup value={selectedEmployeeId} onValueChange={(value) => {
                                    setSelectedEmployeeId(value);
                                    setEmployeeSearchTerm(""); // Clear search on selection
                                }}>
                                    {filteredFieldOfficers.length === 0 ? (
                                        <DropdownMenuRadioItem value="" disabled>
                                            No matching officers
                                        </DropdownMenuRadioItem>
                                    ) : filteredFieldOfficers.map(officer => (
                                        <DropdownMenuRadioItem key={officer.id} value={officer.id.toString()}>
                                            {`${officer.firstName} ${officer.lastName}`}
                                        </DropdownMenuRadioItem>
                                    ))}
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>}
                </div>

                <div>
                    <label htmlFor="rangeSelectTrigger" className="block text-sm font-medium text-gray-700 mb-1">Date Range:</label>
                    <Select value={rangeSelect} onValueChange={(value) => { 
                        setRangeSelect(value); 
                        setDateRangeError(null); // Clear error on change
                        if (value === 'custom') {
                            setStartDate('');
                            setEndDate('');
                        }
                    }}>
                        <SelectTrigger id="rangeSelectTrigger" className="min-w-[180px] h-[42px] text-sm">
                            <SelectValue placeholder="Select Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="custom">Custom</SelectItem>
                            <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                            <SelectItem value="last-15-days">Last 15 Days</SelectItem>
                            <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                            <SelectItem value="last-week">Last Week</SelectItem>
                            <SelectItem value="last-month">Last Month</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label htmlFor="startDateTrigger" className="block text-sm font-medium text-gray-700 mb-1">From:</label>
                    <Popover open={isStartDatePopoverOpen} onOpenChange={setIsStartDatePopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                id="startDateTrigger"
                                variant={"outline"}
                                className={cn("min-w-[180px] h-[42px] justify-start text-left font-normal text-sm", !startDate && "text-muted-foreground", rangeSelect !== 'custom' && rangeSelect !== '' && "bg-gray-200 cursor-not-allowed")}
                                disabled={rangeSelect !== 'custom' && rangeSelect !== ''}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? dayjs(startDate).format('MMM D, YYYY') : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={startDate ? dayjs(startDate).toDate() : undefined}
                                onSelect={handleStartDateSelect}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <div>
                    <label htmlFor="endDateTrigger" className="block text-sm font-medium text-gray-700 mb-1">To:</label>
                    <Popover open={isEndDatePopoverOpen} onOpenChange={setIsEndDatePopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                id="endDateTrigger"
                                variant={"outline"}
                                className={cn("min-w-[180px] h-[42px] justify-start text-left font-normal text-sm", !endDate && "text-muted-foreground", rangeSelect !== 'custom' && rangeSelect !== '' && "bg-gray-200 cursor-not-allowed")}
                                disabled={rangeSelect !== 'custom' && rangeSelect !== ''}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? dayjs(endDate).format('MMM D, YYYY') : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={endDate ? dayjs(endDate).toDate() : undefined}
                                onSelect={handleEndDateSelect}
                                disabled={startDate ? { before: dayjs(startDate).toDate() } : undefined}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <button
                    id="filterBtn"
                    onClick={handleGenerateReport}
                    className="fo-button self-end h-[42px] whitespace-nowrap"
                    disabled={reportLoading || fieldOfficers.length === 0 || !selectedEmployeeId || !startDate || !endDate}
                >
                    {reportLoading ? 'Generating...' : 'Generate Report'}
                </button>
            </div>

            {dateRangeError && (
                <div className="text-center p-2 my-2 text-red-700 bg-red-100 border border-red-400 rounded">
                    {dateRangeError}
                </div>
            )}

            {reportLoading && <div className="flex justify-center items-center p-10"><ClipLoader color="#4A90E2" size={50} /></div>}
            {reportError && <div className="text-center p-4 my-4 text-red-700 bg-red-100 border border-red-400 rounded"><p><strong>Error:</strong> {reportError}</p></div>}
            {showReport && !reportLoading && !reportError && (
                    <div id="reportSection" className="mt-6">
                    <table id="summaryTable" className="fo-table w-full">
                        <thead id="summaryHead">{summaryHeader}</thead>
                        <tbody><tr id="summaryRow">{summaryRow}</tr></tbody>
                    </table>
                </div>
            )}

            {selectedCustomerTypeForDetails && (
                     <div id="visitDetailsSection" className="mt-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">
                        Visit Details for {selectedCustomerTypeForDetails}
                        {selectedEmployeeName !== "Select Field Officer" && ` (Officer: ${selectedEmployeeName}, Dates: ${dayjs(startDate).format('MMM D, YYYY')} - ${dayjs(endDate).format('MMM D, YYYY')})`}
                    </h2>
                    {detailsLoading && <div className="flex justify-center items-center p-10"><ClipLoader color="#4A90E2" size={40} /></div>}
                    {detailsError && <div className="text-center p-4 my-4 text-red-600 bg-red-50 border border-red-300 rounded"><p><strong>Error:</strong> {detailsError}</p></div>}
                    {!detailsLoading && !detailsError && visitDetails && (
                        visitDetails.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="fo-table w-full text-sm">
                                    <thead>
                                        <tr>
                                            <th>Customer Name</th>
                                            <th>City</th>
                                            <th>Taluka</th>
                                            <th>State</th>
                                            <th>Last Visited</th>
                                            <th>Visit Count</th>
                                            <th>Avg Monthly Sales</th>
                                            <th>Avg Intent Level</th>
                                            <th>Customer Type</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visitDetails
                                            .slice() // copy to avoid mutating state
                                            .sort((a, b) => {
                                                const stateA = a.state?.toLowerCase() || '';
                                                const stateB = b.state?.toLowerCase() || '';
                                                if (stateA < stateB) return -1;
                                                if (stateA > stateB) return 1;
                                                const cityA = a.city?.toLowerCase() || '';
                                                const cityB = b.city?.toLowerCase() || '';
                                                if (cityA < cityB) return -1;
                                                if (cityA > cityB) return 1;
                                                const talukaA = a.taluka?.toLowerCase() || '';
                                                const talukaB = b.taluka?.toLowerCase() || '';
                                                if (talukaA < talukaB) return -1;
                                                if (talukaA > talukaB) return 1;
                                                const nameA = a.customerName?.toLowerCase() || '';
                                                const nameB = b.customerName?.toLowerCase() || '';
                                                if (nameA < nameB) return -1;
                                                if (nameA > nameB) return 1;
                                                return 0;
                                            })
                                            .map((detail, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <Link href={`/CustomerDetailPage/${detail.storeId}`} legacyBehavior>
                                                            <a className="text-blue-600 hover:text-blue-800 hover:underline">
                                                                {detail.customerName}
                                                            </a>
                                                        </Link>
                                                    </td>
                                                    <td>{detail.city}</td>
                                                    <td>{detail.taluka}</td>
                                                    <td>{detail.state}</td>
                                                    <td>{dayjs(detail.lastVisited).format('MMM D, YYYY')}</td>
                                                    <td>{detail.visitCount}</td>
                                                    <td>{formatSalesNumber(detail.avgMonthlySales)}</td>
                                                    <td>{Number.isInteger(detail.avgIntentLevel) ? detail.avgIntentLevel : detail.avgIntentLevel.toFixed(1)}</td>
                                                    <td>{detail.customerType}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-center text-gray-600 py-4">No visit details found for {selectedCustomerTypeForDetails}.</p>
                        )
                    )}
                </div>
            )}
            </CardContent>
        </Card>
    );
};

export default FieldOfficerVisitReport; 