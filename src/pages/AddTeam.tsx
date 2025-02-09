import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Select, { MultiValue } from 'react-select';
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import axios from 'axios';

interface Employee {
    id: number;
    firstName: string;
    lastName: string;
    city: string;
    role: string;
    teamId: number | null;
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

const AddTeam = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [officeManager, setOfficeManager] = useState<{ value: number, label: string } | null>(null);
    const [selectedCities, setSelectedCities] = useState<MultiValue<{ value: string, label: string }>>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
    const [officeManagers, setOfficeManagers] = useState<OfficeManager[]>([]);
    const [cities, setCities] = useState<{ value: string, label: string }[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);

    const token = useSelector((state: RootState) => state.auth.token);
    const { toast } = useToast();

   


    useEffect(() => {
        if (!isModalOpen) {
            resetForm();
        }
    }, [isModalOpen]);

    const resetForm = () => {
        setOfficeManager(null);
        setSelectedCities([]);
        setSelectedEmployees([]);
        setEmployees([]);
    };

    const fetchOfficeManagers = useCallback(async () => {
        try {
            const allEmployeesResponse = await axios.get(
                "https://api.gajkesaristeels.in/employee/getAll",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const teamsResponse = await axios.get(
                "https://api.gajkesaristeels.in/employee/team/getAll",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const assignedManagerIds = teamsResponse.data.map((team: any) => team.officeManager.id);
            const deletedManagerIds = allEmployeesResponse.data
                .filter((employee: OfficeManager) => employee.role === "Manager" && employee.deleted)
                .map((employee: OfficeManager) => employee.id);
            const availableManagers = allEmployeesResponse.data
                .filter((employee: OfficeManager) =>
                    employee.role === "Manager" &&
                    !assignedManagerIds.includes(employee.id) &&
                    !deletedManagerIds.includes(employee.id)
                );

            setOfficeManagers(availableManagers);
        } catch (error) {
            console.error("Error fetching Regional managers:", error);
            toast({
                title: "Error",
                description: "Failed to fetch Regional managers. Please try again.",
                variant: "destructive",
            });
        }
    }, [token, toast]);
   
    const handleOfficeManagerChange = (selectedOption: { value: number, label: string } | null) => {
        setOfficeManager(selectedOption);
    };

    const fetchCities = useCallback(async () => {
        try {
            const response = await axios.get(
                "https://api.gajkesaristeels.in/employee/getCities",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const sortedCities = response.data
                .sort((a: string, b: string) => a.localeCompare(b))
                .map((city: string) => ({ value: city, label: city }));
            setCities(sortedCities);
        } catch (error) {
            console.error("Error fetching cities:", error);
            toast({
                title: "Error",
                description: "Failed to fetch cities. Please try again.",
                variant: "destructive",
            });
        }
    }, [token, toast]);


    useEffect(() => {
        if (isModalOpen && token) {
            fetchOfficeManagers();
            fetchCities();
        }
    }, [isModalOpen, token, fetchOfficeManagers, fetchCities]);
    const fetchEmployeesByCities = async (cities: string[]) => {
        try {
            const promises = cities.map(city =>
                axios.get(
                    `https://api.gajkesaristeels.in/employee/getFieldOfficerByCity?city=${city}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                )
            );

            const responses = await Promise.all(promises);
            const allEmployees = responses.flatMap(response => response.data)
                .filter((employee: Employee) =>
                    employee.role === "Field Officer" && employee.teamId === null
                );

            setEmployees(allEmployees);
        } catch (error) {
            console.error(`Error fetching employees for cities ${cities.join(", ")}:`, error);
            toast({
                title: "Error",
                description: `Failed to fetch employees for the selected cities. Please try again.`,
                variant: "destructive",
            });
        }
    };

    const handleCitySelect = async () => {
        if (selectedCities.length > 0 && officeManager) {
            const cities = selectedCities.map(option => option.value);
            try {
                for (const city of cities) {
                    await axios.put(
                        `https://api.gajkesaristeels.in/employee/assignCity`,
                        null,
                        {
                            params: { id: officeManager.value, city },
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );
                }
                toast({
                    title: "Success",
                    description: `${cities.join(", ")} assigned to Regional Manager ID: ${officeManager.value}`,
                });
                await fetchEmployeesByCities(cities);
            } catch (error) {
                console.error(`Error assigning cities to Regional manager ${officeManager.value}:`, error);
                toast({
                    title: "Error",
                    description: `Failed to assign cities to Regional Manager ID: ${officeManager.value}. Please try again.`,
                    variant: "destructive",
                });
            }
        } else {
            toast({
                title: "Error",
                description: "Please select at least one city and an Regional manager.",
                variant: "destructive",
            });
        }
    };

    const handleCreateTeam = async () => {
        if (!officeManager) {
            toast({
                title: "Error",
                description: "Please select an Regional manager.",
                variant: "destructive",
            });
            return;
        }

        if (selectedEmployees.length === 0) {
            toast({
                title: "Error",
                description: "Please select at least one team member.",
                variant: "destructive",
            });
            return;
        }

        try {
            const response = await axios.post(
                "https://api.gajkesaristeels.in/employee/team/create",
                {
                    officeManager: officeManager.value,
                    fieldOfficers: selectedEmployees,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 200) {
                toast({
                    title: "Success",
                    description: "Team created successfully!",
                });
                setIsModalOpen(false);
                resetForm();
            }
        } catch (error: any) {
            console.error("Error creating team:", error);
            if (error.response && error.response.data && error.response.data.message) {
                toast({
                    title: "Error Creating Team",
                    description: error.response.data.message,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Error",
                    description: "An unexpected error occurred. Please try again.",
                    variant: "destructive",
                });
            }
        }
    };

    return (
        <>
            <Button onClick={() => setIsModalOpen(true)}>Add Team</Button>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Team</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="officeManager">Regional Manager</label>
                            <Select
                                id="officeManager"
                                value={officeManager}
                                onChange={handleOfficeManagerChange}
                                options={officeManagers.map(manager => ({
                                    value: manager.id,
                                    label: `${manager.firstName} ${manager.lastName}`
                                }))}
                                placeholder="Select an Regional Manager"
                            />
                        </div>
                        <div>
                            <label htmlFor="city">Cities</label>
                            <Select
                                id="city"
                                isMulti
                                value={selectedCities}
                                onChange={setSelectedCities}
                                options={cities}
                                placeholder="Select cities"
                            />
                            <Button className="mt-2" onClick={handleCitySelect} disabled={selectedCities.length === 0}>
                                OK
                            </Button>
                        </div>
                        {selectedCities.length > 0 && (
                            <div>
                                <label>Team Members</label>
                                <div className="max-h-60 overflow-y-auto">
                                    {employees.map((employee) => (
                                        <div key={employee.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`employee-${employee.id}`}
                                                checked={selectedEmployees.includes(employee.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedEmployees([...selectedEmployees, employee.id]);
                                                    } else {
                                                        setSelectedEmployees(selectedEmployees.filter(id => id !== employee.id));
                                                    }
                                                }}
                                            />
                                            <label htmlFor={`employee-${employee.id}`}>
                                                {employee.firstName} {employee.lastName}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateTeam}
                            disabled={!officeManager || selectedEmployees.length === 0}
                        >
                            Create Team
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default AddTeam;