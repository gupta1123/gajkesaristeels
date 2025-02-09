'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format, subDays, differenceInDays } from 'date-fns';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState } from '../store';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationLink, PaginationItem, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CalendarIcon, MoreHorizontal, PlusCircle, Search, Filter, ChevronDown, Clock, User, Building, MapPin, AlertTriangle, CheckCircle, Loader, FileText, Target, ArrowRight, Trash2, Calendar as CalendarIcon2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import './Complaints.css'
import { sortBy, uniqBy } from 'lodash';

interface Task {
    id: number;
    taskTitle: string;
    taskDescription: string;
    dueDate: string;
    assignedToId: number;
    assignedToName: string;
    assignedById: number;
    status: string;
    priority: string;
    category: string;
    storeId: number;
    storeName: string;
    storeCity: string;
    taskType: string;
    imageCount: number;
}

interface Employee {
    id: number;
    firstName: string;
    lastName: string;
}

interface Store {
    id: number;
    storeName: string;
}

interface AttachmentResponse {
    fileName: string;
    fileDownloadUri: string;
    fileType: string;
    tag: string;
    size: number;
}

const Complaints = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
    const [newTask, setNewTask] = useState<Task>({
        id: 0,
        taskTitle: '',
        taskDescription: '',
        dueDate: '',
        assignedToId: 0,
        assignedToName: '',
        assignedById: 86,
        status: 'Assigned',
        priority: 'low',
        category: 'Complaint',
        storeId: 0,
        storeName: '',
        storeCity: '',
        taskType: 'complaint',
        imageCount: 0
    });
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('general');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({
        employee: '',
        priority: '',
        status: '',
        search: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd')
    });
    const [isLoading, setIsLoading] = useState(true);
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [filterEmployees, setFilterEmployees] = useState<{ id: number; name: string }[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [expandedComplaint, setExpandedComplaint] = useState<number | null>(null);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
    const [taskImages, setTaskImages] = useState<string[]>([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isLoadingImages, setIsLoadingImages] = useState(false);

    const token = useSelector((state: RootState) => state.auth.token);
    const role = useSelector((state: RootState) => state.auth.role);
    const teamId = useSelector((state: RootState) => state.auth.teamId);

    useEffect(() => {
        if (errorMessage) {
            const timer = setTimeout(() => {
                setErrorMessage(null);
            }, 20000);
            return () => clearTimeout(timer);
        }
    }, [errorMessage]);

    const handleDateChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };

        if (newFilters.startDate && newFilters.endDate) {
            const startDate = new Date(newFilters.startDate);
            const endDate = new Date(newFilters.endDate);

            if (differenceInDays(endDate, startDate) > 30) {
                setErrorMessage('Date range should not exceed 30 days');
                return;
            }
        }

        setFilters(newFilters);
    };

    const handleNext = () => {
        setActiveTab('details');
    };

    const handleBack = () => {
        setActiveTab('general');
    };

    const handleViewStore = (storeId: number) => {
        router.push(`/CustomerDetailPage/${storeId}`);
    };

    const handleViewFieldOfficer = (employeeId: number) => {
        router.push(`/SalesExecutive/${employeeId}`);
    };

    const fetchTasks = useCallback(async () => {
        setIsLoading(true);
        try {
            const formattedStartDate = format(new Date(filters.startDate), 'yyyy-MM-dd');
            const formattedEndDate = format(new Date(filters.endDate), 'yyyy-MM-dd');

            const url = role === 'MANAGER' ?
                `https://api.gajkesaristeels.in/task/getByTeamAndDate?start=${formattedStartDate}&end=${formattedEndDate}&id=${teamId}` :
                `https://api.gajkesaristeels.in/task/getByDate?start=${formattedStartDate}&end=${formattedEndDate}`;

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();

            const filteredTasks = data
                .filter((task: any) => task.taskType === 'complaint')
                .map((task: any) => ({
                    ...task,
                    taskDescription: task.taskDescription,
                    assignedToName: task.assignedToName || 'Unknown',
                }))
                .sort((a: Task, b: Task) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

            setTasks(filteredTasks);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            setIsLoading(false);
        }
    }, [role, filters, teamId, token]);

    const fetchEmployees = useCallback(async () => {
        try {
            const response = await fetch('https://api.gajkesaristeels.in/employee/getAll', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            const sortedEmployees = sortBy(data, (emp) => `${emp.firstName} ${emp.lastName}`);
            setAllEmployees(sortedEmployees);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    }, [token]);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    useEffect(() => {
        if (tasks.length > 0) {
            const uniqueEmployees = uniqBy(tasks.map(task => ({
                id: task.assignedToId,
                name: task.assignedToName
            })), 'id');
            const sortedEmployees = sortBy(uniqueEmployees, 'name');
            setFilterEmployees(sortedEmployees);
        }
    }, [tasks]);

    const fetchStores = useCallback(async () => {
        try {
            const response = await fetch('https://api.gajkesaristeels.in/store/names', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            setStores(data);
        } catch (error) {
            console.error('Error fetching stores:', error);
        }
    }, [token]);

    useEffect(() => {
        fetchTasks();
    }, [token, currentPage, filters, fetchTasks]);

    useEffect(() => {
        if (isModalOpen) {
            fetchStores();
        }
    }, [isModalOpen, token, fetchStores]);

    useEffect(() => {
        applyFilters();
    }, [tasks, filters]);

    const applyFilters = () => {
        const searchLower = filters.search.toLowerCase();
        const filtered = tasks
            .filter(
                (task) =>
                    task.taskType === 'complaint' &&
                    (
                        (task.taskTitle?.toLowerCase() || '').includes(searchLower) ||
                        (task.taskDescription?.toLowerCase() || '').includes(searchLower) ||
                        (task.storeName?.toLowerCase() || '').includes(searchLower) ||
                        (task.assignedToName?.toLowerCase() || '').includes(searchLower)
                    ) &&
                    (filters.employee === '' || filters.employee === 'all' ? true : task.assignedToId === parseInt(filters.employee)) &&
                    (filters.priority === '' || filters.priority === 'all' ? true : task.priority === filters.priority) &&
                    (filters.status === '' || filters.status === 'all' ? task.status !== 'Complete' : task.status === filters.status) &&
                    (filters.startDate === '' || new Date(task.dueDate) >= new Date(filters.startDate)) &&
                    (filters.endDate === '' || new Date(task.dueDate) <= new Date(filters.endDate))
            );

        setFilteredTasks(filtered);
    };

    const createTask = async () => {
        try {
            const taskToCreate = {
                ...newTask,
                taskType: 'complaint',
            };

            const response = await fetch('https://api.gajkesaristeels.in/task/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(taskToCreate),
            });
            const data = await response.json();

            const createdTask = {
                ...newTask,
                id: data.id,
                assignedToName: allEmployees.find(emp => emp.id === newTask.assignedToId)?.firstName + ' ' + allEmployees.find(emp => emp.id === newTask.assignedToId)?.lastName || 'Unknown',
                storeName: stores.find(store => store.id === newTask.storeId)?.storeName || '',
            };

            setTasks(prevTasks => [createdTask, ...prevTasks]);

            setNewTask({
                id: 0,
                taskTitle: '',
                taskDescription: '',
                dueDate: '',
                assignedToId: 0,
                assignedToName: '',
                assignedById: 86,
                status: 'Assigned',
                priority: 'low',
                category: 'Complaint',
                storeId: 0,
                storeName: '',
                storeCity: '',
                taskType: 'complaint',
                imageCount: 0
            });
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error creating task:', error);
        }
    };

    const updateTaskStatus = async (taskId: number, newStatus: string) => {
        try {
            const response = await fetch(
                `https://api.gajkesaristeels.in/task/updateTask?taskId=${taskId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ status: newStatus }),
                }
            );

            if (response.ok) {
                setTasks((prevTasks) =>
                    prevTasks.map((task) =>
                        task.id === taskId ? { ...task, status: newStatus } : task
                    )
                );
            } else {
                console.error('Failed to update task status');
            }
        } catch (error) {
            console.error('Error updating task status:', error);
        }
    };

    const deleteTask = async (taskId: number) => {
        try {
            await fetch(`https://api.gajkesaristeels.in/task/deleteById?taskId=${taskId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            fetchTasks();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            [key]: value,
        }));
        applyFilters();
    };

    const getStatusInfo = (status: string): { icon: React.ReactNode; color: string } => {
        switch (status.toLowerCase()) {
            case 'assigned':
                return { icon: <Clock className="w-4 h-4" />, color: 'bg-purple-100 text-purple-800' };
            case 'work in progress':
                return { icon: <Loader className="w-4 h-4 animate-spin" />, color: 'bg-blue-100 text-blue-800' };
            case 'complete':
                return { icon: <CheckCircle className="w-4 h-4" />, color: 'bg-green-100 text-green-800' };
            default:
                return { icon: <AlertTriangle className="w-4 h-4" />, color: 'bg-gray-100 text-gray-800' };
        }
    };

    const renderPagination = () => {
        const totalPages = Math.ceil(filteredTasks.length / 10);
        const pageNumbers = [];
        const displayPages = 5;

        let startPage = Math.max(currentPage - Math.floor(displayPages / 2), 1);
        let endPage = startPage + displayPages - 1;

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(endPage - displayPages + 1, 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <Pagination>
                <PaginationContent>
                    {currentPage !== 1 && <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} />}
                    {startPage > 1 && (
                        <>
                            <PaginationItem>
                                <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
                            </PaginationItem>
                            {startPage > 2 && (
                                <PaginationItem>
                                    <PaginationLink>...</PaginationLink>
                                </PaginationItem>
                            )}
                        </>
                    )}
                    {pageNumbers.map((page) => (
                        <PaginationItem key={page}>
                            <PaginationLink isActive={page === currentPage} onClick={() => handlePageChange(page)}>
                                {page}
                            </PaginationLink>
                        </PaginationItem>
                    ))}
                    {endPage < totalPages && (
                        <>
                            {endPage < totalPages - 1 && (
                                <PaginationItem>
                                    <PaginationLink>...</PaginationLink>
                                </PaginationItem>
                            )}
                            <PaginationItem>
                                <PaginationLink onClick={() => handlePageChange(totalPages)}>{totalPages}</PaginationLink>
                            </PaginationItem>
                        </>
                    )}
                    {currentPage !== totalPages && <PaginationNext onClick={() => handlePageChange(currentPage + 1)} />}
                </PaginationContent>
            </Pagination>
        );
    };

    const fetchTaskImages = async (taskId: number) => {
        setIsLoadingImages(true);
        try {
            // First, fetch the task details
            const taskResponse = await fetch(`https://api.gajkesaristeels.in/task/getById?id=${taskId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!taskResponse.ok) {
                throw new Error('Failed to fetch task details');
            }
            const taskData = await taskResponse.json();
    
            // Extract file names from the attachmentResponse
            const fileNames = taskData.attachmentResponse
                .filter((attachment: AttachmentResponse) => attachment.tag === 'check-in')
                .map((attachment: AttachmentResponse) => attachment.fileName);
    
            // Now fetch each image using the file names
            const imageUrls = await Promise.all(
                fileNames.map(async (fileName: string) => {
                    const imageResponse = await fetch(
                        `https://api.gajkesaristeels.in/task/downloadFile/${taskId}/check-in/${fileName}`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );
                    if (imageResponse.ok) {
                        const blob = await imageResponse.blob();
                        return URL.createObjectURL(blob);
                    }
                    return null;
                })
            );
    
            setTaskImages(imageUrls.filter((url): url is string => url !== null));
            setIsImagePreviewOpen(true);
        } catch (error) {
            console.error('Error fetching task images:', error);
        } finally {
            setIsLoadingImages(false);
        }
    };

    const renderComplaintCard = (task: Task, index: number) => {
        const { icon, color } = getStatusInfo(task.status);
        const isExpanded = expandedComplaint === task.id;

        return (
            <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="w-full sm:w-1/2 lg:w-1/3 p-2"
            >
                <Card className="h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <Badge className={`${color} px-3 py-1 rounded-full font-semibold flex items-center space-x-2`}>
                                {icon} <span>{task.status}</span>
                            </Badge>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleViewStore(task.storeId)}>
                                        <Building className="mr-2 h-4 w-4" /> View Store
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleViewFieldOfficer(task.assignedToId)}>
                                        <User className="mr-2 h-4 w-4" /> View Field Officer
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => deleteTask(task.id)} className="text-red-600">
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete Complaint
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <CardTitle className="text-xl mt-2">{task.taskTitle || 'Untitled Complaint'}</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                            <Building className="w-4 h-4 mr-2 text-gray-500" />
                            {task.storeName}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-indigo-500" />
                                <div>
                                    <span className="text-sm text-gray-500">Assigned to:</span>
                                    <p className="font-medium">{task.assignedToName}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <CalendarIcon2 className="w-4 h-4 text-indigo-500" />
                                <div>
                                    <span className="text-sm text-gray-500">Due Date:</span>
                                    <p className="font-medium">{format(new Date(task.dueDate), 'MMM d, yyyy')}</p>
                                </div>
                            </div>
                        </div>
                        <p className={`text-gray-600 ${isExpanded ? '' : 'line-clamp-2'}`}>{task.taskDescription}</p>
                        {task.taskDescription && task.taskDescription.length > 100 && (
                            <Button
                                variant="link"
                                onClick={() => setExpandedComplaint(isExpanded ? null : task.id)}
                                className="mt-2 p-0 h-auto font-normal text-indigo-600"
                            >
                                {isExpanded ? 'Show less' : 'Show more'}
                            </Button>
                        )}
                        {task.imageCount > 0 && (
                            <div className="mt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchTaskImages(task.id)}
                                >
                                    View Images ({task.imageCount})
                                </Button>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="bg-gray-50 border-t">
                        <div className="w-full">

                            <Select
                                value={task.status}
                                onValueChange={(value) => updateTaskStatus(task.id, value)}
                            >
                                <SelectTrigger id={`status-${task.id}`} className="mt-1">
                                    <SelectValue placeholder="Change status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Assigned">Assigned</SelectItem>
                                    <SelectItem value="Work In Progress">Work In Progress</SelectItem>
                                    <SelectItem value="Complete">Complete</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardFooter>
                </Card>
            </motion.div>
        );
    };

    const renderMobileFilters = () => (
        <Sheet open={isFilterDrawerOpen} onOpenChange={setIsFilterDrawerOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                    <SheetTitle>Filter Complaints</SheetTitle>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="employee">Employee</Label>
                        <Select value={filters.employee} onValueChange={(value) => handleFilterChange('employee', value)}>
                            <SelectTrigger id="employee">
                                <SelectValue placeholder="Filter by employee" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Employees</SelectItem>
                                {filterEmployees.map((employee) => (
                                    <SelectItem key={employee.id} value={employee.id.toString()}>
                                        {employee.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
                            <SelectTrigger id="priority">
                                <SelectValue placeholder="Filter by priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priorities</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                            <SelectTrigger id="status">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Open Statuses</SelectItem>
                                <SelectItem value="Assigned">Assigned</SelectItem>
                                <SelectItem value="Work In Progress">Work In Progress</SelectItem>
                                <SelectItem value="Complete">Complete</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                            id="startDate"
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => handleDateChange('startDate', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                            id="endDate"
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => handleDateChange('endDate', e.target.value)}
                        />
                    </div>
                </div>
                <Button onClick={() => { fetchTasks(); setIsFilterDrawerOpen(false); }} className="w-full mt-4">
                    Apply Filters
                </Button>
            </SheetContent>
        </Sheet>
    );

    return (
        <div className="container-complaints mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-6">Complaints Management</h1>
            <div className="mb-6 flex flex-wrap gap-4 items-center">
                <div className="flex-grow lg:flex-grow-0 lg:w-64 flex items-center gap-2">
                    <Input
                        placeholder="Search complaints"
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="w-full"
                    />
                    <Button onClick={() => setIsModalOpen(true)}>
                        <PlusCircle className="w-4 h-4 mr-2" /> New
                    </Button>
                </div>
                <div className="flex-shrink-0">
                    {renderMobileFilters()}
                </div>
                <div className="hidden lg:flex flex-wrap gap-4 items-center">
                    <Select value={filters.employee} onValueChange={(value) => handleFilterChange('employee', value)}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filter by employee" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Employees</SelectItem>
                            {filterEmployees.map((employee) => (
                                <SelectItem key={employee.id} value={employee.id.toString()}>
                                    {employee.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filter by priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Priorities</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Open Statuses</SelectItem>
                            <SelectItem value="Assigned">Assigned</SelectItem>
                            <SelectItem value="Work In Progress">Work In Progress</SelectItem>
                            <SelectItem value="Complete">Complete</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="flex items-center space-x-2">
                        <Label htmlFor="startDate">From:</Label>
                        <Input
                            type="date"
                            id="startDate"
                            value={filters.startDate}
                            onChange={(e) => handleDateChange('startDate', e.target.value)}
                            className="w-auto"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Label htmlFor="endDate">To:</Label>
                        <Input
                            type="date"
                            id="endDate"
                            value={filters.endDate}
                            onChange={(e) => handleDateChange('endDate', e.target.value)}
                            className="w-auto"
                        />
                    </div>
                </div>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Complaint</DialogTitle>
                        <DialogDescription>Fill in the details to create a new complaint.</DialogDescription>
                    </DialogHeader>
                    <Tabs value={activeTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="general" onClick={() => setActiveTab('general')}>General</TabsTrigger>
                            <TabsTrigger value="details" onClick={() => setActiveTab('details')}>Details</TabsTrigger>
                        </TabsList>
                        <TabsContent value="general">
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="taskTitle">Complaint Title</Label>
                                    <Input
                                        id="taskTitle"
                                        placeholder="Enter complaint title"
                                        value={newTask.taskTitle}
                                        onChange={(e) => setNewTask({ ...newTask, taskTitle: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="taskDescription">Complaint Description</Label>
                                    <Input
                                        id="taskDescription"
                                        placeholder="Enter complaint description"
                                        value={newTask.taskDescription}
                                        onChange={(e) => setNewTask({ ...newTask, taskDescription: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select value={newTask.category} onValueChange={(value) => setNewTask({ ...newTask, category: value })}>
                                        <SelectTrigger className="w-[280px]">
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Complaint">Complaint</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex justify-between mt-4">
                                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                    <Button onClick={handleNext}>Next</Button>
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="details">
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="dueDate">Due Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={`w-[280px] justify-start text-left font-normal ${!newTask.dueDate && 'text-muted-foreground'}`}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {newTask.dueDate ? format(new Date(newTask.dueDate), 'PPP') : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={newTask.dueDate ? new Date(newTask.dueDate) : undefined}
                                                onSelect={(date) => setNewTask({ ...newTask, dueDate: date?.toISOString() || '' })}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="assignedToId">Assigned To</Label>
                                    <Select
                                        value={newTask.assignedToId ? newTask.assignedToId.toString() : ''}
                                        onValueChange={(value) => {
                                            const selectedEmployee = allEmployees.find(emp => emp.id === parseInt(value));
                                            setNewTask({ ...newTask, assignedToId: parseInt(value), assignedToName: selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : 'Unknown' });
                                        }}
                                    >
                                        <SelectTrigger className="w-[280px]">
                                            <SelectValue placeholder="Select an employee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allEmployees.map((employee) => (
                                                <SelectItem key={employee.id} value={employee.id.toString()}>
                                                    {employee.firstName} {employee.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="priority">Priority</Label>
                                    <Select value={newTask.priority} onValueChange={(value) => setNewTask({ ...newTask, priority: value })}>
                                        <SelectTrigger className="w-[280px]">
                                            <SelectValue placeholder="Select a priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="storeId">Store</Label>
                                    <Select
                                        value={newTask.storeId ? newTask.storeId.toString() : ''}
                                        onValueChange={(value) => setNewTask({ ...newTask, storeId: parseInt(value) })}
                                    >
                                        <SelectTrigger className="w-[280px]">
                                            <SelectValue placeholder="Select a store" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {stores.map((store) => (
                                                <SelectItem key={store.id} value={store.id.toString()}>
                                                    {store.storeName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex justify-between mt-4">
                                    <Button variant="outline" onClick={handleBack}>Back</Button>
                                    <Button onClick={createTask}>Create Complaint</Button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="text-center py-10">
                    <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <p className="text-xl font-semibold">No complaints found.</p>
                    <p className="text-gray-500 mt-2">Try adjusting your filters or create a new complaint.</p>
                </div>
            ) : (
                <div className="flex flex-wrap -mx-2">
                    {filteredTasks
                        .slice((currentPage - 1) * 10, currentPage * 10)
                        .map((task, index) => renderComplaintCard(task, index))}
                </div>
            )}

            <div className="mt-8 flex justify-center">
                {renderPagination()}
            </div>

            {isImagePreviewOpen && (
                <Dialog open={isImagePreviewOpen} onOpenChange={setIsImagePreviewOpen}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Image Preview</DialogTitle>
                        </DialogHeader>
                        {isLoadingImages ? (
                            <div className="flex justify-center items-center h-64">
                                <Loader className="w-8 h-8 animate-spin text-primary" />
                                <span className="ml-2">Loading images...</span>
                            </div>
                        ) : (
                            <>
                                <div className="relative">
                                    <img
                                        src={taskImages[currentImageIndex]}
                                        alt={`Image ${currentImageIndex + 1}`}
                                        className="w-full h-auto"
                                    />
                                    {taskImages.length > 1 && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="absolute left-2 top-1/2 transform -translate-y-1/2"
                                                onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? taskImages.length - 1 : prev - 1))}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                                                onClick={() => setCurrentImageIndex((prev) => (prev === taskImages.length - 1 ? 0 : prev + 1))}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                                <p className="text-center mt-2">
                                    Image {currentImageIndex + 1} of {taskImages.length}
                                </p>
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default Complaints;