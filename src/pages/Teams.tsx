import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from "@/components/ui/use-toast";
import { UserPlus, ChevronLeft, ChevronRight, MapPin, X, Trash2, Users, User, Building2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import Select, { MultiValue } from 'react-select';

interface Team {
    id: number;
    officeManager: {
        id: number;
        firstName: string | null;
        lastName: string | null;
        assignedCity: string[];
    };
    fieldOfficers: FieldOfficer[];
}

interface FieldOfficer {
    id: number;
    firstName: string;
    lastName: string;
    role: string;
    status: string;
}

const Teams: React.FC<{ authToken: string | null }> = ({ authToken }) => {
    const { toast } = useToast();
    const [teams, setTeams] = useState<Team[]>([]);
    const [isDataAvailable, setIsDataAvailable] = useState<boolean>(true);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState<boolean>(false);
    const [deleteTeamId, setDeleteTeamId] = useState<number | null>(null);
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
    const [selectedOfficeManagerId, setSelectedOfficeManagerId] = useState<number | null>(null);
    const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
    const [isCityRemoveModalVisible, setIsCityRemoveModalVisible] = useState<boolean>(false);
    const [fieldOfficers, setFieldOfficers] = useState<FieldOfficer[]>([]);
    const [selectedFieldOfficers, setSelectedFieldOfficers] = useState<number[]>([]);
    const [assignedCities, setAssignedCities] = useState<string[]>([]);
    const [cityToRemove, setCityToRemove] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<{ [key: number]: number }>({});
    const [availableCities, setAvailableCities] = useState<{ value: string, label: string }[]>([]);
    const [selectedCities, setSelectedCities] = useState<MultiValue<{ value: string, label: string }>>([]);
    const [newCity, setNewCity] = useState<string | null>(null);

    const fetchTeams = useCallback(async () => {
        try {
            const response = await axios.get('https://api.gajkesaristeels.in/employee/team/getAll', {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            });
            setTeams(response.data);
            setIsDataAvailable(response.data.length > 0);
            toast({
                title: "Teams loaded successfully",
                description: "All team data has been fetched.",
                variant: "default",
            });
        } catch (error) {
            console.error('Error fetching teams:', error);
            setIsDataAvailable(false);
            toast({
                title: "Error loading teams",
                description: "Failed to fetch team data. Please try again.",
                variant: "destructive",
            });
        }
    }, [authToken, toast]);

    useEffect(() => {
        fetchTeams();
    }, [fetchTeams]);

    const fetchCities = async () => {
        try {
            const response = await axios.get(
                "https://api.gajkesaristeels.in/employee/getCities",
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );
            const sortedCities = response.data
                .sort((a: string, b: string) => a.localeCompare(b))
                .map((city: string) => ({ value: city, label: city }));
            setAvailableCities(sortedCities);
        } catch (error) {
            console.error('Error fetching cities:', error);
            toast({
                title: "Error",
                description: "Failed to fetch cities. Please try again.",
                variant: "destructive",
            });
        }
    };

    const fetchFieldOfficersByCities = async (cities: string[], officeManagerId: number) => {
        try {
            const promises = cities.map(city =>
                axios.get(`https://api.gajkesaristeels.in/employee/getFieldOfficerByCity?city=${city}`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                    },
                })
            );
            const responses = await Promise.all(promises);
            const allFieldOfficers: FieldOfficer[] = responses.flatMap(response => response.data);
            const currentTeam = teams.find(team => team.officeManager.id === officeManagerId);
            const currentTeamMemberIds = currentTeam ? currentTeam.fieldOfficers.map(officer => officer.id) : [];
            const availableFieldOfficers = allFieldOfficers.filter((officer: FieldOfficer) => !currentTeamMemberIds.includes(officer.id));
            setFieldOfficers(availableFieldOfficers);
        } catch (error) {
            console.error('Error fetching field officers:', error);
            toast({
                title: "Error",
                description: "Failed to fetch field officers. Please try again.",
                variant: "destructive",
            });
        }
    };

    const showDeleteModal = (teamId: number) => {
        setDeleteTeamId(teamId);
        setIsDeleteModalVisible(true);
    };

    const handleDeleteTeam = async () => {
        if (!deleteTeamId) return;
        try {
            await axios.delete(`https://api.gajkesaristeels.in/employee/team/delete?id=${deleteTeamId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            });
            await fetchTeams();
            setIsDeleteModalVisible(false);
            toast({
                title: "Team deleted",
                description: "The team has been successfully deleted.",
                variant: "default",
            });
        } catch (error) {
            console.error('Error deleting team:', error);
            toast({
                title: "Error",
                description: "Failed to delete team. Please try again.",
                variant: "destructive",
            });
        }
    };

    const showEditModal = (team: Team) => {
        setSelectedTeamId(team.id);
        setSelectedOfficeManagerId(team.officeManager.id);
        setAssignedCities(team.officeManager.assignedCity);
        fetchCities();
        fetchFieldOfficersByCities(team.officeManager.assignedCity, team.officeManager.id);
        setIsEditModalVisible(true);
    };

    const handleAddCity = (selectedOptions: MultiValue<{ value: string; label: string; }>) => {
        setSelectedCities(selectedOptions);
        if (selectedOptions.length > 0) {
            const lastSelectedCity = selectedOptions[selectedOptions.length - 1].value;
            setNewCity(lastSelectedCity);
        } else {
            setNewCity(null);
        }
    };

    const handleRemoveCity = (city: string) => {
        setCityToRemove(city);
        setIsCityRemoveModalVisible(true);
    };

    const confirmRemoveCity = async () => {
        if (!cityToRemove || !selectedOfficeManagerId) return;
        try {
            await axios.put(
                `https://api.gajkesaristeels.in/employee/removeCity?id=${selectedOfficeManagerId}&city=${cityToRemove}`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            setAssignedCities(prev => prev.filter(c => c !== cityToRemove));
            setIsCityRemoveModalVisible(false);
            setCityToRemove(null);
            toast({
                title: "City removed",
                description: `${cityToRemove} has been removed from the team.`,
                variant: "default",
            });
        } catch (error) {
            console.error('Error removing city:', error);
            toast({
                title: "Error",
                description: "Failed to remove city. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleAddFieldOfficer = async () => {
        if (!selectedTeamId || selectedFieldOfficers.length === 0) return;
        try {
            await axios.put(
                `https://api.gajkesaristeels.in/employee/team/addFieldOfficer?id=${selectedTeamId}`,
                {
                    fieldOfficers: selectedFieldOfficers,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            await fetchTeams();
            setIsEditModalVisible(false);
            setSelectedFieldOfficers([]);
            toast({
                title: "Field officers added",
                description: "The selected field officers have been added to the team.",
                variant: "default",
            });
        } catch (error) {
            console.error('Error adding field officer:', error);
            toast({
                title: "Error",
                description: "Failed to add field officers. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleRemoveFieldOfficer = async (teamId: number, fieldOfficerId: number) => {
        try {
            await axios.delete(`https://api.gajkesaristeels.in/employee/team/deleteFieldOfficer?id=${teamId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                data: {
                    fieldOfficers: [fieldOfficerId],
                },
            });
            await fetchTeams();
            toast({
                title: "Field officer removed",
                description: "The field officer has been removed from the team.",
                variant: "default",
            });
        } catch (error) {
            console.error('Error removing field officer:', error);
            toast({
                title: "Error",
                description: "Failed to remove field officer. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleAssignCity = async () => {
        if (!newCity || !selectedOfficeManagerId) return;
        try {
            await axios.put(
                `https://api.gajkesaristeels.in/employee/assignCity?id=${selectedOfficeManagerId}&city=${newCity}`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            toast({
                title: "City assigned",
                description: `${newCity} assigned to team ${selectedOfficeManagerId}`,
                variant: "default",
            });
            await fetchFieldOfficersByCities([...assignedCities, newCity], selectedOfficeManagerId);
            setAssignedCities(prev => [...prev, newCity]);
            setNewCity(null);
        } catch (error) {
            console.error('Error assigning city:', error);
            toast({
                title: "Error",
                description: "Failed to assign city. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handlePageChange = (teamId: number, newPage: number) => {
        setCurrentPage(prev => ({ ...prev, [teamId]: newPage }));
    };

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {isDataAvailable ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {teams.map((team) => {
                        const pageCount = Math.ceil(team.fieldOfficers.length / 4);
                        const currentPageForTeam = currentPage[team.id] || 1;
                        const startIndex = (currentPageForTeam - 1) * 4;
                        const visibleOfficers = team.fieldOfficers.slice(startIndex, startIndex + 4);

                        return (
                            <Card key={team.id} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white overflow-hidden">
                                <CardContent className="p-4 md:p-6 flex-grow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center">
                                            <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center mr-3 text-lg font-semibold shadow-md">
                                                {team.officeManager?.firstName?.[0]}{team.officeManager?.lastName?.[0]}
                                            </div>
                                            <div>
                                                <h3 className="text-lg md:text-xl font-semibold text-black">
                                                    {team.officeManager?.firstName ?? 'N/A'} {team.officeManager?.lastName ?? 'N/A'}
                                                </h3>
                                                <p className="text-sm text-gray-600 font-medium">
                                                    Regional Manager
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => showDeleteModal(team.id)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                                        >
                                            <Trash2 size={20} />
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {team.officeManager.assignedCity.map((city, index) => (
                                            <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full flex items-center">
                                                <Building2 size={12} className="mr-1" />
                                                {city}
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="space-y-3">
                                        {visibleOfficers.map((officer) => (
                                            <div key={officer.id} className="bg-white p-3 rounded-lg shadow-sm flex items-center justify-between group hover:bg-gray-50 transition-all duration-300">
                                                <div className="flex items-center min-w-0">
                                                    <User size={20} className="text-gray-600 mr-2 flex-shrink-0" />
                                                    <div className="min-w-0 flex-grow">
                                                        <p className="font-medium text-sm text-black truncate" title={`${officer.firstName} ${officer.lastName}`}>
                                                            {`${officer.firstName} ${officer.lastName}`}
                                                            </p>
                                                        <p className="text-xs text-gray-500 truncate" title={officer.role}>
                                                            {officer.role}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    {officer.status === 'inactive' && (
                                                        <Badge 
                                                            variant="secondary"
                                                            className="mr-2 bg-red-100 text-red-800"
                                                        >
                                                            Inactive
                                                        </Badge>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveFieldOfficer(team.id, officer.id)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                                                    >
                                                        <X size={16} />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {pageCount > 1 && (
                                        <div className="flex justify-center items-center mt-4 space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(team.id, currentPageForTeam - 1)}
                                                disabled={currentPageForTeam === 1}
                                                className="text-black border-gray-300 hover:bg-gray-50 rounded-full"
                                            >
                                                <ChevronLeft size={16} />
                                            </Button>
                                            <span className="text-sm text-black">
                                                Page {currentPageForTeam} of {pageCount}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(team.id, currentPageForTeam + 1)}
                                                disabled={currentPageForTeam === pageCount}
                                                className="text-black border-gray-300 hover:bg-gray-50 rounded-full"
                                            >
                                                <ChevronRight size={16} />
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="p-4 md:p-6 pt-0">
                                    <Button
                                        className="w-full bg-black hover:bg-gray-800 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300"
                                        onClick={() => showEditModal(team)}
                                    >
                                        <UserPlus size={16} className="mr-2" />
                                        Add Field Officer
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-10">
                    <Users size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-xl font-semibold text-black">No teams available</p>
                    <p className="text-gray-500 mt-2">Try refreshing the page or check back later.</p>
                </div>
            )}

            <Dialog open={isDeleteModalVisible} onOpenChange={setIsDeleteModalVisible}>
                <DialogContent className="bg-white rounded-lg">
                    <DialogHeader>
                        <DialogTitle className="text-black">Delete Team</DialogTitle>
                    </DialogHeader>
                    <p className="text-gray-600">Are you sure you want to delete this team? This action cannot be undone.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModalVisible(false)} className="border-gray-300 text-black hover:bg-gray-50 rounded-full">Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteTeam} className="bg-red-500 hover:bg-red-600 text-white rounded-full">Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditModalVisible} onOpenChange={setIsEditModalVisible}>
                <DialogContent className="sm:max-w-[425px] bg-white rounded-lg">
                    <DialogHeader>
                        <DialogTitle className="text-black">Add Field Officer</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2 text-black">Assigned Cities</h4>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {assignedCities.map((city, index) => (
                                <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full flex items-center">
                                    <Building2 size={12} className="mr-1" />
                                    {city}
                                    <Button size="sm" variant="ghost" onClick={() => handleRemoveCity(city)} className="h-auto p-0 ml-1 text-gray-500 hover:text-gray-700">
                                        <X size={12} />
                                    </Button>
                                </Badge>
                            ))}
                        </div>
                        <Select
                            isMulti
                            value={selectedCities}
                            onChange={handleAddCity}
                            options={availableCities.filter(city => !assignedCities.includes(city.value))}
                            placeholder="Select cities"
                            className="mb-4"
                            styles={{
                                control: (provided) => ({
                                    ...provided,
                                    borderColor: '#d1d5db',
                                    '&:hover': {
                                        borderColor: '#9ca3af',
                                    },
                                }),
                                option: (provided, state) => ({
                                    ...provided,
                                    backgroundColor: state.isSelected ? '#111827' : state.isFocused ? '#f3f4f6' : 'white',
                                    color: state.isSelected ? 'white' : '#111827',
                                }),
                            }}
                        />
                        {newCity && (
                            <Button onClick={handleAssignCity} className="w-full mb-4 bg-black hover:bg-gray-800 text-white rounded-full">
                                Assign {newCity}
                            </Button>
                        )}
                        <h4 className="text-sm font-medium mb-2 text-black">Available Field Officers</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {fieldOfficers.map((officer) => (
                                <div key={officer.id} className="flex items-center space-x-2">
                                    {officer.status === 'active' ? (
                                        <div className="flex items-center w-full">
                                            <Checkbox
                                                id={`officer-${officer.id}`}
                                                checked={selectedFieldOfficers.includes(officer.id)}
                                                onCheckedChange={(checked) => {
                                                    setSelectedFieldOfficers(prev =>
                                                        checked
                                                            ? [...prev, officer.id]
                                                            : prev.filter(id => id !== officer.id)
                                                    );
                                                }}
                                            />
                                            <label htmlFor={`officer-${officer.id}`} className="ml-2 text-sm text-black">
                                                {`${officer.firstName} ${officer.lastName} (${officer.role})`}
                                            </label>
                                        </div>
                                    ) : (
                                        <div className="flex items-center w-full">
                                            <span className="text-sm text-gray-500">{`${officer.firstName} ${officer.lastName} (${officer.role})`}</span>
                                            <Badge 
                                                variant="secondary"
                                                className="ml-2 bg-red-100 text-red-800 text-xs"
                                            >
                                                Inactive
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalVisible(false)} className="border-gray-300 text-black hover:bg-gray-50 rounded-full">Cancel</Button>
                        <Button onClick={handleAddFieldOfficer} disabled={selectedFieldOfficers.length === 0} className="bg-black hover:bg-gray-800 text-white rounded-full">
                            Add Selected Officers
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isCityRemoveModalVisible} onOpenChange={setIsCityRemoveModalVisible}>
                <DialogContent className="bg-white rounded-lg">
                    <DialogHeader>
                        <DialogTitle className="text-black">Remove City</DialogTitle>
                    </DialogHeader>
                    <p className="text-gray-600">Are you sure you want to remove {cityToRemove} from this team?</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCityRemoveModalVisible(false)} className="border-gray-300 text-black hover:bg-gray-50 rounded-full">Cancel</Button>
                        <Button variant="destructive" onClick={confirmRemoveCity} className="bg-red-500 hover:bg-red-600 text-white rounded-full">Remove</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Teams;