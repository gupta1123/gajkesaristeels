import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useRouter } from 'next/router';
import { Visit } from './types';
import { Calendar, Clock, User, Store, FileText, ArrowRight, RefreshCw, Target, ChevronDown, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VisitsTableProps {
    visits: Visit[];
    selectedColumns: string[];
    sortColumn: string | null;
    sortDirection: 'asc' | 'desc';
    itemsPerPage: number;
    currentPage: number;
    onSort: (column: string) => void;
    onBulkAction: (action: string) => void;
}

const formatDate = (date: string | null | undefined) => {
    if (date) {
        return format(new Date(date), "d MMM ''yy");
    }
    return '';
};

const formatTime = (date: string | null | undefined, time: string | null | undefined) => {
    if (date && time) {
        const [hours, minutes] = time.split(':');
        return format(new Date(`${date}T${hours}:${minutes}`), "h:mm a");
    }
    return '';
};

const columnMapping = {
    'Customer Name': 'storeName',
    'Executive': 'employeeName',
    'Date': 'visit_date',
    'Status': 'outcome',
    'Purpose': 'purpose',
    'Visit Start': 'checkinDate',
    'Visit End': 'checkoutDate',
    'Intent': 'intent',
    'Last Updated': 'updatedAt',
};

const nonSortableColumns = ['outcome', 'visitStart', 'visitEnd', 'updatedAt'];

const VisitsTable: React.FC<VisitsTableProps> = ({
    visits,
    selectedColumns,
    sortColumn,
    sortDirection,
    itemsPerPage,
    currentPage,
    onSort,
    onBulkAction,
}) => {
    const router = useRouter();
    const [expandedVisit, setExpandedVisit] = React.useState<number | null>(null);

    const viewDetails = (visitId: string) => {
        router.push(`/VisitDetailPage/${visitId}`);
    };

    const getOutcomeStatus = (visit: Visit): { icon: React.ReactNode; status: string; color: string } => {
        if (visit.checkinDate && visit.checkinTime && visit.checkoutDate && visit.checkoutTime) {
            return { icon: <CheckCircle className="w-4 h-4" />, status: 'Completed', color: 'bg-green-100 text-green-800' };
        } else if (visit.checkoutDate && visit.checkoutTime) {
            return { icon: <Clock className="w-4 h-4" />, status: 'Checked Out', color: 'bg-orange-100 text-orange-800' };
        } else if (visit.checkinDate && visit.checkinTime) {
            return { icon: <RefreshCw className="w-4 h-4 animate-spin" />, status: 'On Going', color: 'bg-blue-100 text-blue-800' };
        }
        return { icon: <Calendar className="w-4 h-4" />, status: 'Assigned', color: 'bg-purple-100 text-purple-800' };
    };

    return (
        <div className="p-2 sm:p-4 lg:p-6">
            {/* Desktop view */}
            <div className="hidden md:block">
                <table className="w-full text-left table-auto text-sm font-poppins">
                    <thead>
                        <tr className="bg-gray-100">
                            {selectedColumns.includes('storeName') && (
                                <th className="px-2 py-2 cursor-pointer" onClick={() => onSort('storeName')}>
                                    Customer Name {sortColumn === 'storeName' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                            )}
                            {selectedColumns.includes('employeeName') && (
                                <th className="px-2 py-2 cursor-pointer" onClick={() => onSort('employeeName')}>
                                    Executive {sortColumn === 'employeeName' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                            )}
                            {selectedColumns.includes('visit_date') && (
                                <th className="px-2 py-2 cursor-pointer" onClick={() => onSort('visit_date')}>
                                    Date {sortColumn === 'visit_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                            )}
                            {selectedColumns.includes('outcome') && (
                                <th className="px-2 py-2">
                                    Status
                                </th>
                            )}
                            {selectedColumns.includes('purpose') && (
                                <th className="px-2 py-2 cursor-pointer" onClick={() => onSort('purpose')}>
                                    Purpose {sortColumn === 'purpose' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                            )}
                            {selectedColumns.includes('visitStart') && (
                                <th className="px-2 py-2">
                                    Visit Start
                                </th>
                            )}
                            {selectedColumns.includes('visitEnd') && (
                                <th className="px-2 py-2">
                                    Visit End
                                </th>
                            )}
                            {selectedColumns.includes('intent') && (
                                <th className="px-2 py-2 cursor-pointer" onClick={() => onSort('intent')}>
                                    Intent {sortColumn === 'intent' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                            )}
                            <th className="px-2 py-2">
                                Last Updated
                            </th>
                            <th className="px-2 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visits.map((visit) => {
                            const { icon, status, color } = getOutcomeStatus(visit);

                            return (
                                <tr key={visit.id} className="border-b">
                                    {selectedColumns.includes('storeName') && (
                                        <td className="px-2 py-2">{visit.storeName}</td>
                                    )}
                                    {selectedColumns.includes('employeeName') && (
                                        <td className="px-2 py-2">{visit.employeeName}</td>
                                    )}
                                    {selectedColumns.includes('visit_date') && (
                                        <td className="px-2 py-2 whitespace-nowrap">
                                            {formatDate(visit.visit_date)}
                                        </td>
                                    )}
                                    {selectedColumns.includes('outcome') && (
                                        <td className="px-2 py-2">
                                            <Badge className={`${color} px-3 py-1 rounded-full font-semibold`}>
                                                {icon} {status}
                                            </Badge>
                                        </td>
                                    )}
                                    {selectedColumns.includes('purpose') && (
                                        <td className="px-2 py-2 relative">
                                            <div className="group cursor-pointer">
                                                {visit.purpose ? (
                                                    visit.purpose.length > 20 ? `${visit.purpose.slice(0, 20)}...` : visit.purpose
                                                ) : (
                                                    '-'
                                                )}
                                                {visit.purpose && visit.purpose.length > 20 && (
                                                    <div className="absolute left-0 mt-2 p-4 bg-white border border-gray-300 rounded-lg shadow-lg hidden group-hover:block z-10 w-80">
                                                        <p className="text-sm text-gray-800">{visit.purpose}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                    {selectedColumns.includes('visitStart') && (
                                        <td className="px-2 py-2 whitespace-nowrap">
                                            <div>{formatDate(visit.checkinDate)}</div>
                                            <div>{formatTime(visit.checkinDate, visit.checkinTime)}</div>
                                        </td>
                                    )}
                                    {selectedColumns.includes('visitEnd') && (
                                        <td className="px-2 py-2 whitespace-nowrap">
                                            <div>{formatDate(visit.checkoutDate)}</div>
                                            <div>{formatTime(visit.checkoutDate, visit.checkoutTime)}</div>
                                        </td>
                                    )}
                                    {selectedColumns.includes('intent') && (
                                        <td className="px-2 py-2">{visit.intent}</td>
                                    )}
                                    <td className="px-2 py-2 whitespace-nowrap">
                                        <div>{formatDate(visit.updatedAt)}</div>
                                        <div>{formatTime(visit.updatedAt, visit.updatedTime)}</div>
                                    </td>
                                    <td className="px-2 py-2">
                                        <Button
                                            variant="outline"
                                            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                                            onClick={() => viewDetails(visit.id.toString())}
                                        >
                                            View Details
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile view */}
            <div className="md:hidden space-y-4">
                {visits.map((visit, index) => {
                    const { icon, status, color } = getOutcomeStatus(visit);
                    const isExpanded = expandedVisit === visit.id;

                    return (
                        <motion.div
                            key={visit.id}
                            className="bg-white shadow-lg rounded-lg overflow-hidden"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                            <motion.div
                                className="p-4 cursor-pointer"
                                onClick={() => setExpandedVisit(isExpanded ? null : visit.id)}
                                whileHover={{ backgroundColor: "#f3f4f6" }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <Badge className={`${color} px-3 py-1 rounded-full font-semibold flex items-center space-x-1`}>
                                        {icon} <span>{status}</span>
                                    </Badge>
                                    <span className="text-sm text-gray-500">{formatDate(visit.visit_date)}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Store className="w-5 h-5 text-blue-500" />
                                        <span className="font-semibold text-lg">{visit.storeName}</span>
                                    </div>
                                    <motion.div
                                        animate={{ rotate: isExpanded ? 180 : 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <ChevronDown className="w-5 h-5 text-gray-500" />
                                    </motion.div>
                                </div>
                            </motion.div>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="px-4 pb-4 space-y-3"
                                    >
                                        {selectedColumns.includes('employeeName') && (
                                            <div className="flex items-center space-x-2">
                                                <User className="w-4 h-4 text-indigo-500" />
                                                <span className="font-semibold">Executive:</span> {visit.employeeName}
                                            </div>
                                        )}
                                        {selectedColumns.includes('purpose') && (
                                            <div className="flex items-center space-x-2">
                                                <FileText className="w-4 h-4 text-green-500" />
                                                <span className="font-semibold">Purpose:</span> {visit.purpose || '-'}
                                            </div>
                                        )}
                                        {selectedColumns.includes('intent') && (
                                            <div className="flex items-center space-x-2">
                                                <Target className="w-4 h-4 text-purple-500" />
                                                <span className="font-semibold">Intent:</span> {visit.intent}
                                            </div>
                                        )}
                                        <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <Button
                                                variant="outline"
                                                className="w-full mt-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-all duration-300"
                                                onClick={() => viewDetails(visit.id.toString())}
                                            >
                                                <span>View Details</span>
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default VisitsTable;