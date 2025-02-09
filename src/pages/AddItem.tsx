"use client"

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Select from 'react-select';
import { Checkbox } from "@/components/ui/checkbox";

interface Employee {
    id: number;
    firstName: string;
    lastName: string;
    city: string;
}

interface OfficeManager {
    id: number;
    firstName: string;
    lastName: string;
}

const AddItem = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [officeManager, setOfficeManager] = useState<{ value: number, label: string } | null>(null);
    const [selectedCities, setSelectedCities] = useState<string[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
    const [officeManagers, setOfficeManagers] = useState<OfficeManager[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const token = useSelector((state: RootState) => state.auth.token);

    useEffect(() => {
        const fetchOfficeManagers = async () => {
            try {
                const response = await fetch(
                    "https://api.gajkesaristeels.in/employee/getOfficeManager",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                const data: OfficeManager[] = await response.json();
                setOfficeManagers(data);
            } catch (error) {
                console.error("Error fetching office managers:", error);
            }
        };

        const fetchCities = async () => {
            try {
                const response = await fetch(
                    "https://api.gajkesaristeels.in/employee/getAll",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                const data: Employee[] = await response.json();
                const uniqueCities = Array.from(new Set(data.map((employee) => employee.city)));
                setCities(uniqueCities);
            } catch (error) {
                console.error("Error fetching cities:", error);
            }
        };

        if (token) {
            fetchOfficeManagers();
            fetchCities();
        }
    }, [token]);

    useEffect(() => {
        const fetchEmployeesByCity = async () => {
            const allEmployees: Employee[] = [];

            for (const city of selectedCities) {
                try {
                    const response = await fetch(
                        `https://api.gajkesaristeels.in/employee/getFieldOfficerByCity?city=${city}`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );
                    const data: Employee[] = await response.json();
                    allEmployees.push(...data);
                } catch (error) {
                    console.error(`Error fetching employees for city ${city}:`, error);
                }
            }

            setEmployees(allEmployees);
        };

        if (selectedCities.length > 0) {
            fetchEmployeesByCity();
        }
    }, [selectedCities, token]);

    const handleAddItem = () => {
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
    };

    const handleEmployeeSelection = (employeeId: number) => {
        setSelectedEmployees((prevSelected) =>
            prevSelected.includes(employeeId)
                ? prevSelected.filter((id) => id !== employeeId)
                : [...prevSelected, employeeId]
        );
    };

    const handleCreateTeam = async () => {
        if (!officeManager) return;

        const payload = {
            officeManager: officeManager.value,
            fieldOfficers: selectedEmployees,
        };

        try {
            const response = await fetch(
                "https://api.gajkesaristeels.in/employee/team/create",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Error creating team:", errorData);
            } else {
                const responseData = await response.json();
                console.log("Team created successfully:", responseData);
                handleModalClose();
            }
        } catch (error) {
            console.error("Error creating team:", error);
        }
    };

    const cityOptions = cities.map((city) => ({ value: city, label: city }));

    return (
        <div>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                    <Button onClick={handleAddItem} className="ml-4">Add Team</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add Item</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label htmlFor="officeManager">Office Manager</label>
                            <Select
                                value={officeManager}
                                onChange={(option) => setOfficeManager(option)}
                                options={officeManagers.map(manager => ({
                                    value: manager.id,
                                    label: `${manager.firstName} ${manager.lastName}`
                                }))}
                                placeholder="Select an office manager"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="city">City</label>
                            <Select
                                isMulti
                                value={selectedCities.map(city => ({ value: city, label: city }))}
                                onChange={(selectedOptions) => setSelectedCities(selectedOptions.map(option => option.value))}
                                options={cityOptions}
                                placeholder="Select cities"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="employeeName">Employee Name</label>
                            <div className="space-y-2">
                                {employees.map((employee) => (
                                    <div key={employee.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`employee-${employee.id}`}
                                            checked={selectedEmployees.includes(employee.id)}
                                            onCheckedChange={() => handleEmployeeSelection(employee.id)}
                                        />
                                        <label htmlFor={`employee-${employee.id}`} className="cursor-pointer">
                                            {employee.firstName} {employee.lastName}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button variant="outline" onClick={handleModalClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateTeam}>Create Team</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AddItem;