import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';
import { message } from 'antd';

interface CreateComplaintModalProps {
    isOpen: boolean;
    onClose: () => void;
    employees: any[]; // or a more specific type if available
    stores: any[]; // or a more specific type if available
    storeId: number;
    createTask: () => Promise<void>;
}


const CreateComplaintModal: React.FC<CreateComplaintModalProps> = ({ isOpen, onClose, storeId, createTask }) => {
    const [newTask, setNewTask] = useState({
        taskTitle: '',
        taskDesciption: '',
        dueDate: '',
        assignedToId: 0,
        assignedToName: '',
        assignedById: 86,
        status: 'Assigned',
        priority: 'low',
        taskType: 'complaint',
        storeId: storeId,
        category: '',
        storeName: ''
    });
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        const fetchTaskDetails = async () => {
            try {
                const response = await axios.get(`https://api.gajkesaristeels.in/task/getByStoreAndDate?storeId=${storeId}&start=2024-06-01&end=2024-06-30`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                if (Array.isArray(response.data) && response.data.length > 0) {
                    const task = response.data[0]; // Assuming the first task has the required info
                    setNewTask(prev => ({
                        ...prev,
                        assignedToId: task.assignedToId,
                        assignedToName: task.assignedToName,
                        storeName: task.storeName
                    }));
                }
            } catch (error) {
                console.error('Error fetching task details:', error);
                message.error('Error fetching task details.');
            }
        };

        fetchTaskDetails();
    }, [storeId]);

    const handleNext = () => {
        setActiveTab('details');
    };

    const handleBack = () => {
        setActiveTab('general');
    };

    const handleCreateTask = async () => {
        try {
            const response = await axios.post('https://api.gajkesaristeels.in/task/create', {
                ...newTask,
                dueDate: newTask.dueDate.split('T')[0],
                storeId: newTask.storeId,
                taskType: 'complaint'
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            message.success('Complaint created successfully!');
            createTask();

            onClose();
        } catch (error) {
            console.error('Error creating complaint:', error);
            message.error('Error creating complaint.');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Create Complaint</DialogTitle>
                    <DialogDescription>Fill in the complaint details.</DialogDescription>
                </DialogHeader>
                <Tabs value={activeTab}>
                    <TabsList className="mb-4">
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
                                    className="w-[280px]"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="taskDescription">Complaint Description</Label>
                                <Input
                                    id="taskDescription"
                                    placeholder="Enter complaint description"
                                    value={newTask.taskDesciption}
                                    onChange={(e) => setNewTask({ ...newTask, taskDesciption: e.target.value })}
                                    className="w-[280px]"
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
                            <div className="grid gap-2">
                                <Label htmlFor="storeName">Store</Label>
                                <Input
                                    id="storeName"
                                    value={newTask.storeName}
                                    disabled
                                    className="w-[280px] bg-gray-100"
                                />
                            </div>
                            <div className="flex justify-between mt-4">
                                <Button variant="outline" onClick={onClose}>Cancel</Button>
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
                                            onSelect={(date) => setNewTask({ ...newTask, dueDate: date ? date.toISOString().split('T')[0] : '' })}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="assignedTo">Assigned To</Label>
                                <Input
                                    id="assignedTo"
                                    value={newTask.assignedToName}
                                    disabled
                                    className="w-[280px] bg-gray-100"
                                />
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
                            <div className="flex justify-between mt-4">
                                <Button variant="outline" onClick={handleBack}>Back</Button>
                                <Button onClick={handleCreateTask}>Create Complaint</Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default CreateComplaintModal;