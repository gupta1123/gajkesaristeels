import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ScrollArea } from "@/components/ui/scroll-area";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faExclamationTriangle, faEye } from '@fortawesome/free-solid-svg-icons';
import {
    Pagination,
    PaginationContent,
    PaginationLink,
    PaginationItem,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis
} from '@/components/ui/pagination'

interface VisitDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    visitData: any[];
    selectedDate: string;
    employeeName: string;
}

const getOutcomeStatus = (visit: any): { emoji: React.ReactNode; status: string; color: string } => {
    if (visit.checkinDate && visit.checkinTime && visit.checkoutDate && visit.checkoutTime) {
        return { emoji: '✅', status: 'Completed', color: 'bg-purple-100 text-purple-800' };
    } else if (visit.checkoutDate && visit.checkoutTime) {
        return { emoji: '⏱️', status: 'Checked Out', color: 'bg-orange-100 text-orange-800' };
    } else if (visit.checkinDate && visit.checkinTime) {
        return { emoji: '🕰️', status: 'On Going', color: 'bg-green-100 text-green-800' };
    }
    return { emoji: '📅', status: 'Assigned', color: 'bg-blue-100 text-blue-800' };
};

const formatDateTime = (dateString: string, timeString: string) => {
    if (!dateString) return '';
    const date = new Date(`${dateString}T${timeString}`);
    const formattedDate = `${date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    })} '${date.getFullYear().toString().slice(-2)}`;
    const formattedTime = timeString ? ` ${date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    })}` : '';
    return formattedDate + formattedTime;
};

const VisitDetailsModal: React.FC<VisitDetailsModalProps> = ({ isOpen, onClose, visitData, selectedDate, employeeName }) => {
    const [selectedVisit, setSelectedVisit] = useState<any | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const visitsPerPage = 7;
    const router = useRouter();

    const handleViewDetails = (visitId: number) => {
        router.push(`/VisitDetailPage/${visitId}`);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const indexOfLastVisit = currentPage * visitsPerPage;
    const indexOfFirstVisit = indexOfLastVisit - visitsPerPage;
    const currentVisits = visitData.slice(indexOfFirstVisit, indexOfLastVisit);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center space-x-2">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-600" />
                        <span>
                            Visits for {employeeName} on {new Date(selectedDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                            })} &apos;{new Date(selectedDate).getFullYear().toString().slice(-2)}
                        </span>

                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
                    {currentVisits.length > 0 ? (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Customer Name</TableHead>
                                        <TableHead>Executive</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Purpose</TableHead>
                                        <TableHead>Visit Start</TableHead>
                                        <TableHead>Visit End</TableHead>
                                        <TableHead>Intent</TableHead>
                                        <TableHead>Last Updated</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentVisits.map((visit) => {
                                        const { emoji, status, color } = getOutcomeStatus(visit);
                                        return (
                                            <TableRow key={visit.id}>
                                                <TableCell>{visit.storeName || ''}</TableCell>
                                                <TableCell>{employeeName || ''}</TableCell>
                                                <TableCell>{new Date(selectedDate).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}</TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${color}`}>
                                                        {emoji} {status}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{visit.purpose || ''}</TableCell>
                                                <TableCell>{formatDateTime(visit.checkinDate, visit.checkinTime) || ''}</TableCell>
                                                <TableCell>{formatDateTime(visit.checkoutDate, visit.checkoutTime) || ''}</TableCell>
                                                <TableCell>{visit.intent || ''}</TableCell>
                                                <TableCell>{formatDateTime(visit.updatedAt, visit.updatedTime) || ''}</TableCell>
                                                <TableCell>
                                                    <Button size="sm" variant="outline" onClick={() => handleViewDetails(visit.id)}>
                                                        <FontAwesomeIcon icon={faEye} className="mr-2 h-4 w-4" />
                                                        View
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                            <Pagination className="mt-4">
                                <PaginationContent>
                                    <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} />
                                    {[...Array(Math.ceil(visitData.length / visitsPerPage)).keys()].map((page) => (
                                        <PaginationItem key={page}>
                                            <PaginationLink
                                                isActive={page + 1 === currentPage}
                                                onClick={() => handlePageChange(page + 1)}
                                            >
                                                {page + 1}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))}
                                    <PaginationNext onClick={() => handlePageChange(currentPage + 1)} />
                                </PaginationContent>
                            </Pagination>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-lg font-semibold text-red-600 flex items-center justify-center space-x-2">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600" />
                                <span>No visits on this day</span>
                            </p>
                        </div>
                    )}
                </ScrollArea>
                <DialogFooter>
                    <Button onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>

            {selectedVisit && (
                <Dialog open={!!selectedVisit} onOpenChange={() => setSelectedVisit(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Visit Details for {selectedVisit.storeName}</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="font-semibold">Customer Name:</p>
                                <p>{selectedVisit.storeName || ''}</p>
                            </div>
                            <div>
                                <p className="font-semibold">Executive:</p>
                                <p>{employeeName || ''}</p>
                            </div>
                            <div>
                                <p className="font-semibold">Date:</p>
                                <p>{formatDateTime(selectedVisit.visit_date, '') || ''}</p>
                            </div>
                            <div>
                                <p className="font-semibold">Status:</p>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${getOutcomeStatus(selectedVisit).color}`}>
                                    {getOutcomeStatus(selectedVisit).emoji} {getOutcomeStatus(selectedVisit).status}
                                </span>
                            </div>
                            <div>
                                <p className="font-semibold">Purpose:</p>
                                <p>{selectedVisit.purpose || ''}</p>
                            </div>
                            <div>
                                <p className="font-semibold">Visit Start:</p>
                                <p>{formatDateTime(selectedVisit.checkinDate, selectedVisit.checkinTime) || ''}</p>
                            </div>
                            <div>
                                <p className="font-semibold">Visit End:</p>
                                <p>{formatDateTime(selectedVisit.checkoutDate, selectedVisit.checkoutTime) || ''}</p>
                            </div>
                            <div>
                                <p className="font-semibold">Intent:</p>
                                <p>{selectedVisit.intent || ''}</p>
                            </div>
                            <div>
                                <p className="font-semibold">Last Updated:</p>
                                <p>{formatDateTime(selectedVisit.updatedAt, selectedVisit.updatedTime) || ''}</p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setSelectedVisit(null)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </Dialog>
    );
};

export default VisitDetailsModal;
