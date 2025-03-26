import React, { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    CartesianGrid
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { ClipLoader } from 'react-spinners';
import DateRangeDropdown from './DateRangeDropdown';
import { useRouter } from 'next/router';
import { Visit } from '@/types/visit';
import './Dashboard.css';
interface KPICardProps {
    title: string;
    value: number;
}

const KPICard = ({ title, value }: KPICardProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-4xl font-bold">{value}</p>
            </CardContent>
        </Card>
    );
};

interface VisitsByPurposeChartProps {
    data: { purpose: string; visits: number }[];
}

const VisitsByPurposeChart = ({ data }: VisitsByPurposeChartProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Visits by Purpose</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="purpose" />
                        <YAxis />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none' }} />
                        <Legend />
                        <Bar dataKey="visits" fill="#1a202c" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

interface VisitsTableProps {
    visits: Visit[];
    onViewDetails: (visitId: number) => void;
    currentPage: number;
    onPageChange: (page: number) => void;
}

const VisitsTable = ({ visits, onViewDetails, currentPage, onPageChange }: VisitsTableProps) => {
    const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
    const [sortColumn, setSortColumn] = React.useState<keyof Visit>('visit_date');
    const [lastClickedColumn, setLastClickedColumn] = React.useState<keyof Visit | null>(null);

    const getOutcomeStatus = (visit: Visit): { emoji: React.ReactNode; status: string; color: string } => {
        if (visit.checkinTime && visit.checkoutTime) {
            return { emoji: '✅', status: 'Completed', color: 'bg-purple-100 text-purple-800' };
        } else if (visit.checkoutTime) {
            return { emoji: '⏱️', status: 'Checked Out', color: 'bg-orange-100 text-orange-800' };
        } else if (visit.checkinTime) {
            return { emoji: '🕰️', status: 'On Going', color: 'bg-green-100 text-green-800' };
        }
        return { emoji: '📅', status: 'Assigned', color: 'bg-blue-100 text-blue-800' };
    };

    const handleSort = (column: keyof Visit) => {
        if (column === sortColumn) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortOrder('desc');
        }
        setLastClickedColumn(column);
    };

    const rowsPerPage = 10;
    const totalPages = Math.ceil(visits.length / rowsPerPage);

    const sortedVisits = [...visits].sort((a, b) => {
        const valueA = a[sortColumn];
        const valueB = b[sortColumn];

        if (valueA === null || valueA === undefined) {
            return 1;
        }
        if (valueB === null || valueB === undefined) {
            return -1;
        }

        if (typeof valueA === 'string' && typeof valueB === 'string') {
            return sortOrder === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
        }

        if (valueA < valueB) {
            return sortOrder === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
            return sortOrder === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const visitsToDisplay = sortedVisits.slice(startIndex, endIndex);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Completed Visits</CardTitle>
            </CardHeader>
            <CardContent>
                <table className="w-full">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('storeName')}>
                                Store
                                {lastClickedColumn === 'storeName' && (
                                    sortOrder === 'asc' ? (
                                        <ChevronUpIcon className="w-4 h-4 inline-block ml-1" />
                                    ) : (
                                        <ChevronDownIcon className="w-4 h-4 inline-block ml-1" />
                                    )
                                )}
                            </th>
                            <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('employeeName')}>
                                Employee
                                {lastClickedColumn === 'employeeName' && (
                                    sortOrder === 'asc' ? (
                                        <ChevronUpIcon className="w-4 h-4 inline-block ml-1" />
                                    ) : (
                                        <ChevronDownIcon className="w-4 h-4 inline-block ml-1" />
                                    )
                                )}
                            </th>
                            <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('visit_date')}>
                                Date
                                {lastClickedColumn === 'visit_date' && (
                                    sortOrder === 'asc' ? (
                                        <ChevronUpIcon className="w-4 h-4 inline-block ml-1" />
                                    ) : (
                                        <ChevronDownIcon className="w-4 h-4 inline-block ml-1" />
                                    )
                                )}
                            </th>
                            <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('purpose')}>
                                Purpose
                                {lastClickedColumn === 'purpose' && (
                                    sortOrder === 'asc' ? (
                                        <ChevronUpIcon className="w-4 h-4 inline-block ml-1" />
                                    ) : (
                                        <ChevronDownIcon className="w-4 h-4 inline-block ml-1" />
                                    )
                                )}
                            </th>
                            <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('employeeState')}>
                                City
                                {lastClickedColumn === 'employeeState' && (
                                    sortOrder === 'asc' ? (
                                        <ChevronUpIcon className="w-4 h-4 inline-block ml-1" />
                                    ) : (
                                        <ChevronDownIcon className="w-4 h-4 inline-block ml-1" />
                                    )
                                )}
                            </th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visitsToDisplay.map((visit) => {
                            const { emoji, status, color } = getOutcomeStatus(visit);
                            if (status !== 'Completed') return null; // Filter out non-completed visits
                            return (
                                <tr key={visit.id}>
                                    <td className="px-4 py-2">{visit.storeName}</td>
                                    <td className="px-4 py-2 capitalize">{visit.employeeName}</td>
                                    <td className="px-4 py-2">{format(parseISO(visit.visit_date), "dd MMM ''yy")}</td>
                                    <td className="px-4 py-2">{visit.purpose}</td>
                                    <td className="px-4 py-2 capitalize">{visit.employeeState}</td>
                                    <td className={`px-4 py-2 ${color}`}>{emoji} {status}</td>
                                    <td className="px-4 py-2">
                                        <button
                                            className="text-blue-500 hover:text-blue-700"
                                            onClick={() => onViewDetails(visit.id)}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {visitsToDisplay.length === 0 && (
                            <tr>
                                <td className="px-4 py-2 text-center" colSpan={7}>No visits available</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </CardContent>
            {totalPages > 1 && visitsToDisplay.length > 0 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationLink
                                onClick={() => onPageChange(currentPage - 1)}
                                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                            >
                                Previous
                            </PaginationLink>
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, index) => (
                            <PaginationItem key={index}>
                                <PaginationLink
                                    onClick={() => onPageChange(index + 1)}
                                    className={currentPage === index + 1 ? 'bg-gray-300' : ''}
                                >
                                    {index + 1}
                                </PaginationLink>
                            </PaginationItem>
                        ))}
                        <PaginationItem>
                            <PaginationLink
                                onClick={() => onPageChange(currentPage + 1)}
                                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                            >
                                Next
                            </PaginationLink>
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </Card>
    );
};

interface EmployeeDetailsProps {
    employeeDetails: {
        statsDto: { completedVisitCount: number; fullDays: number; halfDays: number; absences: number } | null;
        visitDto: Visit[] | null;
    };
    selectedEmployee: string;
    setSelectedEmployee: (employee: string | null) => void;
    handleDateRangeChange: (start: string, end: string, option: string) => void;
    selectedOption: string;
    handleViewDetails: (visitId: number) => void;
    currentPage: number;
    setCurrentPage: (page: number) => void;
    isLoading: boolean;
    onBackClick: () => void;
}

const EmployeeDetails: React.FC<EmployeeDetailsProps> = ({
    employeeDetails,
    selectedEmployee,
    setSelectedEmployee,
    handleDateRangeChange,
    selectedOption,
    handleViewDetails,
    currentPage,
    setCurrentPage,
    isLoading,
    onBackClick,
}) => {
    const router = useRouter();

    const visitsByPurposeChartData = useMemo(() => {
        if (!employeeDetails || !employeeDetails.visitDto) return [];

        const completedVisits = employeeDetails.visitDto.filter((visit) =>
            visit.checkinTime && visit.checkoutTime
        );

        const visitsByPurpose = completedVisits.reduce((acc: { [key: string]: number }, visit) => {
            const purpose = visit.purpose ? visit.purpose.trim().toLowerCase() : 'unknown';
            if (!acc[purpose]) {
                acc[purpose] = 0;
            }
            acc[purpose]++;
            return acc;
        }, {});

        return Object.entries(visitsByPurpose).map(([purpose, visits]) => ({
            purpose: purpose.charAt(0).toUpperCase() + purpose.slice(1),
            visits: Number(visits),
        }));
    }, [employeeDetails]);

    const handleViewDetailsWithRouter = (visitId: number) => {
        const params = {
            visitId,
            returnTo: 'employeeDetails',
            employeeId: selectedEmployee,
            startDate: selectedOption.split(',')[0],
            endDate: selectedOption.split(',')[1],
            currentPage: currentPage.toString()
        };
        
        console.log('Navigating to VisitDetail with params:', params);
        
        // Store the current state in sessionStorage as a backup
        const dashboardState = {
            view: 'employeeDetails',
            employee: selectedEmployee,
            startDate: selectedOption.split(',')[0],
            endDate: selectedOption.split(',')[1],
            selectedOption: selectedOption,
            currentPage: currentPage.toString()
        };
        
        sessionStorage.setItem('dashboardState', JSON.stringify(dashboardState));
        console.log('Stored state in sessionStorage:', dashboardState);
        
        router.push({
            pathname: `/VisitDetailPage/${visitId}`,
            query: params
        });
    };

    return (
        <>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold capitalize">{selectedEmployee}</h1>
                <Button variant="ghost" size="lg" onClick={onBackClick}>
                    Back
                </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <KPICard title="Total Completed Visits" value={employeeDetails.statsDto ? employeeDetails.statsDto.completedVisitCount : 0} />
                <KPICard title="Full Days" value={employeeDetails.statsDto ? employeeDetails.statsDto.fullDays : 0} />
                <KPICard title="Half Days" value={employeeDetails.statsDto ? employeeDetails.statsDto.halfDays : 0} />
                <KPICard title="Absences" value={employeeDetails.statsDto ? employeeDetails.statsDto.absences : 0} />
            </div>
            <div className="flex justify-end mb-4">
                <DateRangeDropdown selectedOption={selectedOption} onDateRangeChange={handleDateRangeChange} />
            </div>
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <ClipLoader color="#4A90E2" size={50} />
                </div>
            ) : (
                <>
                    <VisitsTable
                        visits={employeeDetails.visitDto || []}
                        onViewDetails={handleViewDetailsWithRouter}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                    />
                    <div className="mt-8">
                        <VisitsByPurposeChart data={visitsByPurposeChartData} />
                    </div>
                </>
            )}
        </>
    );
};

export default EmployeeDetails;