import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { PhoneIcon, EnvelopeIcon, MapPinIcon, CalendarIcon, BuildingOfficeIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import AddTeam from './AddTeam';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import "./Employeelist.css";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from 'next/router';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import './Employeelist.css';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  departmentName: string;
  userName: string;
  password: string;
  primaryContact: string;
  dateOfJoining: string;
  name: string;
  department: string;
  actions: string;
  city: string;
  state: string;
  userDto: {
    username: string;
    password: string | null;
    roles: string | null;
    employeeId: number | null;
    firstName: string | null;
    lastName: string | null;
  };
}

interface TeamData {
  id: number;
  office: {
    id: number;
    firstName: string;
    lastName: string;
  };
  fieldOfficers: User[];
}

interface OfficeManager {
  id: number;
  firstName: string;
  lastName: string;
  city: string;
  email: string;
  deleted?: boolean;
  role?: string;
}

const EmployeeList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [officeManager, setOfficeManager] = useState<OfficeManager | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<number | string | null>(null);
  const [selectedColumns, setSelectedColumns] = useState(['name', 'email', 'city', 'state', 'role', 'department', 'userName', 'dateOfJoining', 'primaryContact', 'actions']);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof User>('firstName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [assignCityUserId, setAssignCityUserId] = useState<number | null>(null);
  const [assignCityUserName, setAssignCityUserName] = useState<string>("");
  const [city, setCity] = useState("");
  const [assignedCity, setAssignedCity] = useState<string | null>(null);
  const [isAssignCityModalOpen, setIsAssignCityModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [assignedCities, setAssignedCities] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('tab1');
  const [archivedEmployees, setArchivedEmployees] = useState<User[]>([]);
  const [isArchivedModalOpen, setIsArchivedModalOpen] = useState(false);
  const [archiveSearchQuery, setArchiveSearchQuery] = useState("");
  const [isEditUsernameModalOpen, setIsEditUsernameModalOpen] = useState(false);
  const [editingUsername, setEditingUsername] = useState<{ id: number; username: string } | null>(null);

  const token = useSelector((state: RootState) => state.auth.token);
  const role = useSelector((state: RootState) => state.auth.role);
  const employeeId = useSelector((state: RootState) => state.auth.employeeId);
  const officeManagerId = useSelector((state: RootState) => state.auth.officeManagerId);
  const { toast } = useToast();
  const router = useRouter();

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (role === 'MANAGER') {
        const teamResponse = await axios.get(`https://api.gajkesaristeels.in/employee/team/getbyEmployee?id=${employeeId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!teamResponse.data || teamResponse.data.length === 0) {
          throw new Error('No team data found for the manager');
        }

        const teamData: TeamData = teamResponse.data[0];
        setTeamData(teamData);

        setUsers(teamData.fieldOfficers.map((user: User) => ({ ...user, userName: user.userDto?.username || "" })));
      } else {
        const response = await axios.get('https://api.gajkesaristeels.in/employee/getAll', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.data) {
          throw new Error('No data received when fetching all employees');
        }

        setUsers(response.data.map((user: User) => ({ ...user, userName: user.userDto?.username || "" })));
        setAssignedCities(response.data.filter((user: User) => user.city).map((user: User) => user.city));
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [token, role, employeeId]);

  const getRandomColor = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7B801', '#7FDBFF', '#85144b'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const fetchOfficeManager = useCallback(async () => {
    try {
      const response = await axios.get(`https://api.gajkesaristeels.in/employee/get?id=${officeManagerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOfficeManager(response.data);
    } catch (error) {
      console.error('Error fetching Office Manager:', error);
    }
  }, [token, officeManagerId]);

  const fetchCities = useCallback(async () => {
    try {
      const response = await axios.get('https://api.gajkesaristeels.in/employee/getCities', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCities(response.data);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchEmployees();
    }
  }, [token, role, employeeId, fetchEmployees]);

  useEffect(() => {
    if (token && role === 'MANAGER' && officeManagerId) {
      fetchOfficeManager();
    }
  }, [token, role, officeManagerId, fetchOfficeManager]);

  useEffect(() => {
    if (isAssignCityModalOpen) {
      fetchCities();
    }
  }, [isAssignCityModalOpen, fetchCities]);

  const handleResetPassword = (userId: number | string) => {
    setResetPasswordUserId(userId);
    setIsResetPasswordOpen(true);
  };

  const handleResetPasswordSubmit = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match!",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await axios.put(
        "https://api.gajkesaristeels.in/user/manage/update",
        {
          username: users.find(user => user.id === resetPasswordUserId)?.userName,
          password: newPassword
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 200) {
        toast({
          title: "Success",
          description: "Password reset successfully",
        });
        setIsResetPasswordOpen(false);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast({
          title: "Error",
          description: `Failed to reset password: ${response.data}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while resetting the password",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingEmployee({ ...user, name: `${user.firstName} ${user.lastName}` });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (editingEmployee) {
      try {
        const response = await axios.put(
          `https://api.gajkesaristeels.in/employee/edit?empId=${editingEmployee.id}`,
          {
            firstName: editingEmployee.firstName,
            lastName: editingEmployee.lastName,
            email: editingEmployee.email,
            role: editingEmployee.role,
            departmentName: editingEmployee.departmentName,
            userName: editingEmployee.userName,
            primaryContact: editingEmployee.primaryContact,
            city: editingEmployee.city,
            state: editingEmployee.state,
            dateOfJoining: editingEmployee.dateOfJoining,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 200) {
          setUsers(prevUsers =>
            prevUsers.map(user => (user.id === editingEmployee.id ? editingEmployee : user))
          );
          setIsEditModalOpen(false);
          toast({
            title: "Success",
            description: "Employee updated successfully!",
          });
        } else {
          toast({
            title: "Error",
            description: `Failed to update employee: ${response.data}`,
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An error occurred while updating the employee.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditingEmployee(prevEmployee => prevEmployee ? { ...prevEmployee, [name]: value } : null);
  };

  const handleViewUser = (userId: number) => {
    router.push(`/SalesExecutive/${userId}`);
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      const response = await axios.put(
        `https://api.gajkesaristeels.in/employee/delete?id=${userId}`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        toast({
          title: "Success",
          description: "Employee deleted successfully!",
        });
        setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
      } else {
        toast({
          title: "Error",
          description: `Failed to delete employee: ${response.data}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting the employee.",
        variant: "destructive",
      });
    }
  };

  const handleSort = (column: keyof User) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) =>
      (`${user.firstName} ${user.lastName}`).toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      if (a[sortColumn] < b[sortColumn]) return sortDirection === 'asc' ? -1 : 1;
      if (a[sortColumn] > b[sortColumn]) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredUsers, sortColumn, sortDirection]);

  const indexOfLastUser = currentPage * itemsPerPage;
  const indexOfFirstUser = indexOfLastUser - itemsPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleColumnSelection = (column: keyof User) => {
    if (selectedColumns.includes(column)) {
      setSelectedColumns(selectedColumns.filter((col) => col !== column));
    } else {
      setSelectedColumns([...selectedColumns, column]);
    }
  };

  const handleNextClick = () => {
    setActiveTab('tab2');
  };

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
  };

  const initialNewEmployeeState = {
    firstName: "",
    lastName: "",
    employeeId: "",
    primaryContact: "",
    secondaryContact: "",
    departmentName: "",
    email: "",
    role: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    dateOfJoining: "",
    userName: "",
    password: "",
  };
  const [newEmployee, setNewEmployee] = useState(initialNewEmployeeState);

  const handleSubmit = async () => {
    try {
      const response = await axios.post(
        "https://api.gajkesaristeels.in/employee-user/create",
        {
          user: {
            username: newEmployee.userName,
            password: newEmployee.password,
          },
          employee: {
            firstName: newEmployee.firstName,
            lastName: newEmployee.lastName,
            employeeId: newEmployee.employeeId,
            primaryContact: newEmployee.primaryContact,
            secondaryContact: newEmployee.secondaryContact,
            departmentName: newEmployee.departmentName,
            email: newEmployee.email,
            role: newEmployee.role,
            addressLine1: newEmployee.addressLine1,
            addressLine2: newEmployee.addressLine2,
            city: newEmployee.city,
            state: newEmployee.state,
            country: newEmployee.country,
            pincode: newEmployee.pincode,
            dateOfJoining: newEmployee.dateOfJoining,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        // Get all employees to find the newly created employee
        const getAllResponse = await axios.get('https://api.gajkesaristeels.in/employee/getAll', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (getAllResponse.data) {
          // Find the newly created employee by matching the username
          const createdEmployee = getAllResponse.data.find(
            (emp: User) => emp.userDto?.username === newEmployee.userName
          );

          if (createdEmployee) {
            // Create attendance log for the new employee
            try {
              const attendanceResponse = await axios.post(
                `https://api.gajkesaristeels.in/attendance-log/createAttendanceLog?employeeId=${createdEmployee.id}`,
                {},
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (attendanceResponse.status === 200) {
                toast({
                  title: "Success",
                  description: "Employee added successfully and attendance log created!",
                });
              }
            } catch (attendanceError) {
              console.error("Error creating attendance log:", attendanceError);
              toast({
                title: "Partial Success",
                description: "Employee added successfully but failed to create attendance log.",
                variant: "destructive",
              });
            }
          }
        }

        setIsModalOpen(false);
        fetchEmployees();
      } else {
        throw new Error("Error adding employee!");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while adding the employee.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEmployee((prevEmployee) => ({
      ...prevEmployee,
      [name]: value,
    }));
  };

  const transformRole = (role: string) => {
    return role === 'Manager' ? 'Regional Manager' : role;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const fetchArchivedEmployees = async () => {
    try {
      const response = await axios.get('https://api.gajkesaristeels.in/employee/getAllInactive', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setArchivedEmployees(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch archived employees",
        variant: "destructive",
      });
    }
  };

  const handleUnarchive = async (employeeId: number) => {
    try {
      const response = await axios.put(
        `https://api.gajkesaristeels.in/employee/setActive?id=${employeeId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.data === "Employee Status changed!") {
        toast({
          title: "Success",
          description: "Employee successfully unarchived",
        });
        // Refresh both lists
        fetchArchivedEmployees();
        fetchEmployees();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unarchive employee",
        variant: "destructive",
      });
    }
  };

  const filteredArchivedEmployees = useMemo(() => {
    return archivedEmployees.filter((employee) =>
      `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(archiveSearchQuery.toLowerCase()) ||
      employee.role.toLowerCase().includes(archiveSearchQuery.toLowerCase()) ||
      employee.departmentName.toLowerCase().includes(archiveSearchQuery.toLowerCase()) ||
      employee.city.toLowerCase().includes(archiveSearchQuery.toLowerCase())
    );
  }, [archivedEmployees, archiveSearchQuery]);

  const handleEditUsername = (userId: number, currentUsername: string) => {
    setEditingUsername({ id: userId, username: currentUsername });
    setIsEditUsernameModalOpen(true);
  };

  const handleSaveUsername = async () => {
    if (!editingUsername?.username.trim()) {
      toast({
        title: "Error",
        description: "Username cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (editingUsername) {
      try {
        setIsLoading(true);
        
        // Make the edit username call
        await axios.put(
          `https://api.gajkesaristeels.in/employee/editUsername?id=${editingUsername.id}&username=${editingUsername.username}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Immediately get updated data
        const getAllResponse = await axios.get('https://api.gajkesaristeels.in/employee/getAll', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (getAllResponse.data) {
          setUsers(getAllResponse.data.map((user: User) => ({ ...user, userName: user.userDto?.username || "" })));
          setAssignedCities(getAllResponse.data.filter((user: User) => user.city).map((user: User) => user.city));
          
          // Close dialog and show success message
          setIsEditUsernameModalOpen(false);
          setEditingUsername(null);
          
          toast({
            title: "Success",
            description: "Username updated successfully!",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update username",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const closeUsernameDialog = () => {
    setIsEditUsernameModalOpen(false);
    setEditingUsername(null);
  };

  return (
    <div className="container-employee mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mobile-display flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">
          {role === 'MANAGER' ? 'Team Employees' : 'Employee List'}
        </h1>
        <br/>
        <div className="flex items-center space-x-4">
          <Input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md"
          />
          <Button 
            variant="outline"
            onClick={() => {
              setIsArchivedModalOpen(true);
              fetchArchivedEmployees();
            }}
          >
            Archived Employees
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Select Columns</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {['name', 'city', 'state', 'role', 'userName', 'primaryContact', 'actions'].map((column) => (
                <DropdownMenuCheckboxItem
                  key={column}
                  checked={selectedColumns.includes(column)}
                  onCheckedChange={() => handleColumnSelection(column as keyof User)}
                >
                  {column}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <AddTeam />
          <Button onClick={() => setIsModalOpen(true)}>Add Employee</Button>
        </div>
      </div>

      {isLoading && <div>Loading employees...</div>}
      {error && <div className="text-red-500">Error: {error}</div>}

      {!isLoading && !error && (
        <>
          {/* Mobile view */}
          <div className="md:hidden space-y-4">
            {currentUsers.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="pb-2">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gray-200 text-gray-700 font-semibold">
                          {getInitials(user.firstName, user.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg font-bold">{`${user.firstName} ${user.lastName}`}</CardTitle>
                        <p className="text-sm text-muted-foreground">{transformRole(user.role)}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedColumns.includes('userName') && (
                        <div className="flex items-center space-x-2">
                          <UserCircleIcon className="h-5 w-5 text-blue-500" />
                          <span className="text-sm">{user.userName}</span>
                        </div>
                      )}
                      {selectedColumns.includes('primaryContact') && (
                        <div className="flex items-center space-x-2">
                          <PhoneIcon className="h-5 w-5 text-green-500" />
                          <span className="text-sm">{user.primaryContact}</span>
                        </div>
                      )}
                      {selectedColumns.includes('email') && (
                        <div className="flex items-center space-x-2">
                          <EnvelopeIcon className="h-5 w-5 text-red-500" />
                          <span className="text-sm">{user.email}</span>
                        </div>
                      )}
                      {selectedColumns.includes('city') && (
                        <div className="flex items-center space-x-2">
                          <MapPinIcon className="h-5 w-5 text-yellow-500" />
                          <span className="text-sm">{user.city}</span>
                        </div>
                      )}
                      {selectedColumns.includes('state') && (
                        <div className="flex items-center space-x-2">
                          <BuildingOfficeIcon className="h-5 w-5 text-purple-500" />
                          <span className="text-sm">{user.state}</span>
                        </div>
                      )}
                      {selectedColumns.includes('dateOfJoining') && (
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="h-5 w-5 text-indigo-500" />
                          <span className="text-sm">{format(new Date(user.dateOfJoining), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <div className="px-6 py-3 bg-gray-50 flex justify-end space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleViewUser(user.id)}>
                      View
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)}>
                      Delete
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Desktop view */}
          <div className="hidden md:block">
            <Table>
              <TableCaption>List of users</TableCaption>
              <TableHeader>
                <TableRow>
                  {selectedColumns.includes('name') && (
                    <TableHead className="cursor-pointer" onClick={() => handleSort('firstName')}>
                      Name
                      {sortColumn === 'firstName' && (
                        <span className="ml-2">
                          {sortDirection === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </TableHead>
                  )}
                  {selectedColumns.includes('role') && (
                    <TableHead className="cursor-pointer" onClick={() => handleSort('role')}>
                      Role
                      {sortColumn === 'role' && (
                        <span className="ml-2">
                          {sortDirection === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </TableHead>
                  )}
                  {selectedColumns.includes('userName') && (
                    <TableHead className="cursor-pointer" onClick={() => handleSort('userName')}>
                      User Name
                      {sortColumn === 'userName' && (
                        <span className="ml-2">
                          {sortDirection === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </TableHead>
                  )}
                  {selectedColumns.includes('primaryContact') && (
                    <TableHead className="cursor-pointer" onClick={() => handleSort('primaryContact')}>
                      Phone
                      {sortColumn === 'primaryContact' && (
                        <span className="ml-2">
                          {sortDirection === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </TableHead>
                  )}
                  {selectedColumns.includes('city') && (
                    <TableHead className="cursor-pointer" onClick={() => handleSort('city')}>
                      City
                      {sortColumn === 'city' && (
                        <span className="ml-2">
                          {sortDirection === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </TableHead>
                  )}
                  {selectedColumns.includes('state') && (
                    <TableHead className="cursor-pointer" onClick={() => handleSort('state')}>
                      State
                      {sortColumn === 'state' && (
                        <span className="ml-2">
                          {sortDirection === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </TableHead>
                  )}
                  {selectedColumns.includes('actions') && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentUsers.map((user) => (
                  <TableRow key={user.id}>
                    {selectedColumns.includes('name') && (
                      <TableCell className="font-medium">{`${user.firstName} ${user.lastName}`}</TableCell>
                    )}
                    {selectedColumns.includes('role') && <TableCell>{transformRole(user.role)}</TableCell>}
                    {selectedColumns.includes('userName') && <TableCell>{user.userName}</TableCell>}
                    {selectedColumns.includes('primaryContact') && <TableCell>{user.primaryContact}</TableCell>}
                    {selectedColumns.includes('city') && <TableCell>{user.city}</TableCell>}
                    {selectedColumns.includes('state') && <TableCell>{user.state}</TableCell>}
                    {selectedColumns.includes('actions') && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <span>•••</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditUsername(user.id, user.userName)}>
                              Edit Username
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewUser(user.id)}>
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(user.id)}>
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteUser(user.id)}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex justify-center">
            <Pagination>
              <PaginationContent>
                {Array.from({ length: Math.ceil(sortedUsers.length / itemsPerPage) }, (_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink onClick={() => paginate(i + 1)} isActive={currentPage === i + 1}>
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
              </PaginationContent>
            </Pagination>
          </div>
        </>
      )}

      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter a new password for the user.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetPasswordSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
        setIsModalOpen(isOpen);
        if (!isOpen) {
          setNewEmployee(initialNewEmployeeState);
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
            </DialogHeader>
          <Tabs value={activeTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tab1">Personal & Work</TabsTrigger>
              <TabsTrigger value="tab2">Credentials</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1" className="pb-16">
              <div className="space-y-4">
                <div className="text-lg font-semibold">Personal Information</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={newEmployee.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={newEmployee.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input
                      id="employeeId"
                      name="employeeId"
                      value={newEmployee.employeeId}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primaryContact">
                      Primary Contact <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="primaryContact"
                      name="primaryContact"
                      value={newEmployee.primaryContact}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryContact">Secondary Contact</Label>
                    <Input
                      id="secondaryContact"
                      name="secondaryContact"
                      value={newEmployee.secondaryContact}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressLine1">Address Line 1</Label>
                  <Input
                    id="addressLine1"
                    name="addressLine1"
                    value={newEmployee.addressLine1}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressLine2">Address Line 2</Label>
                  <Input
                    id="addressLine2"
                    name="addressLine2"
                    value={newEmployee.addressLine2}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={newEmployee.city}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      name="state"
                      value={newEmployee.state}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      name="country"
                      value={newEmployee.country}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    name="pincode"
                    value={newEmployee.pincode}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="text-lg font-semibold mt-6">Work Information</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="departmentName">
                      Department <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={newEmployee.departmentName}
                      onValueChange={(value) =>
                        setNewEmployee({ ...newEmployee, departmentName: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sales">Sales</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role <span className="text-red-500">*</span></Label>
                    <Select
                      value={newEmployee.role}
                      onValueChange={(value) =>
                        setNewEmployee({ ...newEmployee, role: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Field Officer">Field Officer</SelectItem>
                        <SelectItem value="Manager">Regional Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfJoining">Date of Joining</Label>
                    <Input
                      id="dateOfJoining"
                      name="dateOfJoining"
                      type="date"
                      value={newEmployee.dateOfJoining}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              <div className="sticky bottom-0 bg-white py-4 mt-6">
                <Button
                  onClick={handleNextClick}
                  disabled={!newEmployee.firstName || !newEmployee.lastName || !newEmployee.primaryContact || !newEmployee.departmentName || !newEmployee.role}
                  className="w-full"
                >
                  Next
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="tab2" className="pb-16">
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    onClick={() => setActiveTab('tab1')}
                    className="p-2"
                  >
                    <ArrowLeftIcon className="h-5 w-5" />
                  </Button>
                </div>
                <div className="text-lg font-semibold">User Credentials</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="userName">
                      User Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="userName"
                      name="userName"
                      value={newEmployee.userName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={newEmployee.password}
                        onChange={handleInputChange}
                        required
                      />
                      <button
                        type="button"
                        className="absolute top-1/2 right-2 transform -translate-y-1/2 focus:outline-none"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="sticky bottom-0 bg-white py-4 mt-6">
                <Button
                  onClick={handleSubmit}
                  disabled={!newEmployee.userName || !newEmployee.password}
                  className="w-full"
                >
                  Add Employee
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          {editingEmployee && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={editingEmployee.firstName}
                    onChange={handleEditInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={editingEmployee.lastName}
                    onChange={handleEditInputChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    value={editingEmployee.email}
                    onChange={handleEditInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="primaryContact">Primary Contact</Label>
                  <Input
                    id="primaryContact"
                    name="primaryContact"
                    value={editingEmployee.primaryContact}
                    onChange={handleEditInputChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={editingEmployee.role}
                    onValueChange={(value) =>
                      setEditingEmployee({ ...editingEmployee, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Field Officer">Field Officer</SelectItem>
                      <SelectItem value="Manager">Regional Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={editingEmployee.city}
                    onChange={handleEditInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    value={editingEmployee.state}
                    onChange={handleEditInputChange}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dateOfJoining">Date of Joining</Label>
                <Input
                  id="dateOfJoining"
                  name="dateOfJoining"
                  type="date"
                  value={editingEmployee.dateOfJoining}
                  onChange={handleEditInputChange}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isArchivedModalOpen} onOpenChange={setIsArchivedModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Archived Employees</DialogTitle>
            <DialogDescription>
              View and manage archived employees
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Search Filter */}
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search archived employees..."
                value={archiveSearchQuery}
                onChange={(e) => setArchiveSearchQuery(e.target.value)}
                className="max-w-md"
              />
              <Badge variant="secondary" className="h-9 px-3">
                {filteredArchivedEmployees.length} Results
              </Badge>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredArchivedEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">
                        {`${employee.firstName} ${employee.lastName}`}
                      </TableCell>
                      <TableCell>{employee.role}</TableCell>
                      <TableCell>{employee.departmentName}</TableCell>
                      <TableCell>{employee.city}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnarchive(employee.id)}
                          className="flex items-center gap-2"
                        >
                          <ArrowLeftIcon className="h-4 w-4" />
                          Unarchive
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredArchivedEmployees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <p className="text-sm text-muted-foreground">
                            {archivedEmployees.length === 0 
                              ? "No archived employees found" 
                              : "No results found for your search"}
                          </p>
                          {archivedEmployees.length > 0 && archiveSearchQuery && (
                            <Button 
                              variant="ghost" 
                              onClick={() => setArchiveSearchQuery("")}
                              className="text-sm"
                            >
                              Clear search
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditUsernameModalOpen} onOpenChange={closeUsernameDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Username</DialogTitle>
            <DialogDescription>
              Enter a new username for the employee. Username must not be empty.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="newUsername">New Username</Label>
              <Input
                id="newUsername"
                value={editingUsername?.username || ''}
                onChange={(e) => setEditingUsername(prev => prev ? { ...prev, username: e.target.value } : null)}
                placeholder="Enter new username"
                disabled={isLoading}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={closeUsernameDialog}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveUsername}
              disabled={isLoading || !editingUsername?.username.trim()}
              className="relative"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeList;
          