import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Filter, X, CalendarIcon, Search } from 'lucide-react';
import AddVisits from '@/pages/AddVisits';
import { cn } from "@/lib/utils";

const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

interface VisitsFilterProps {
    onFilter: (filters: { storeName: string; employeeName: string; purpose: string }, clearFilters: boolean) => void;
    onColumnSelect: (column: string) => void;
    onExport: () => void;
    selectedColumns: string[];
    viewMode: 'card' | 'table';
    startDate: Date | undefined;
    setStartDate: (date: Date | undefined) => void;
    endDate: Date | undefined;
    setEndDate: (date: Date | undefined) => void;
    purpose: string;
    setPurpose: (purpose: string) => void;
    storeName: string;
    setStoreName: (storeName: string) => void;
    employeeName: string;
    setEmployeeName: (employeeName: string) => void;
}

const VisitsFilter: React.FC<VisitsFilterProps> = ({
    onFilter,
    onColumnSelect,
    onExport,
    selectedColumns,
    viewMode,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    purpose,
    setPurpose,
    storeName,
    setStoreName,
    employeeName,
    setEmployeeName,
}) => {
    const role = useSelector((state: RootState) => state.auth.role);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [localStoreName, setLocalStoreName] = useState(storeName);
    const [localEmployeeName, setLocalEmployeeName] = useState(employeeName);
    const [localPurpose, setLocalPurpose] = useState(purpose);

    const debouncedStoreName = useDebounce(localStoreName, 300);
    const debouncedEmployeeName = useDebounce(localEmployeeName, 300);
    const debouncedPurpose = useDebounce(localPurpose, 300);

    useEffect(() => {
        onFilter({
            storeName: debouncedStoreName,
            employeeName: debouncedEmployeeName,
            purpose: debouncedPurpose
        }, false);
    }, [debouncedStoreName, debouncedEmployeeName, debouncedPurpose, onFilter]);

    useEffect(() => {
        setLocalStoreName(storeName);
        setLocalEmployeeName(employeeName);
        setLocalPurpose(purpose);
    }, [storeName, employeeName, purpose]);

    const handleInputChange = (field: 'storeName' | 'employeeName' | 'purpose', value: string) => {
        switch (field) {
            case 'storeName':
                setLocalStoreName(value);
                break;
            case 'employeeName':
                setLocalEmployeeName(value);
                break;
            case 'purpose':
                setLocalPurpose(value);
                break;
        }
    };

    const handleClear = (field: 'storeName' | 'employeeName' | 'purpose') => {
        handleInputChange(field, '');
    };

    const columnMapping: Record<string, string> = {
        'Customer Name': 'storeName',
        'Executive': 'employeeName',
        'visit_date': 'visit_date',
        'Status': 'outcome',
        'purpose': 'purpose',
        'visitStart': 'visitStart',
        'visitEnd': 'visitEnd',
        'intent': 'intent',
    };

    const handleColumnSelect = (column: string) => {
        onColumnSelect(columnMapping[column]);
    };

    const FilterInput = ({ placeholder, value, onChange, onClear, field }: { placeholder: string; value: string; onChange: (value: string) => void; onClear: () => void; field: 'storeName' | 'employeeName' | 'purpose' }) => (
        <div className="relative w-full">
            <Input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full pr-8 pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            {value && (
                <button
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    onClick={onClear}
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );

    const DateFilter = ({ label, date, setDate }: { label: string; date: Date | undefined; setDate: (date: Date | undefined) => void }) => (
        <div className="w-full">
            <Label htmlFor={label} className="mb-1 block text-sm font-medium text-gray-700">{label}</Label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id={label}
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
        </div>
    );

    const FilterContent = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FilterInput
                    placeholder="Customer Name"
                    value={localStoreName}
                    onChange={(value) => handleInputChange('storeName', value)}
                    onClear={() => handleClear('storeName')}
                    field="storeName"
                />
                <FilterInput
                    placeholder="Sales Executive Name"
                    value={localEmployeeName}
                    onChange={(value) => handleInputChange('employeeName', value)}
                    onClear={() => handleClear('employeeName')}
                    field="employeeName"
                />
                <FilterInput
                    placeholder="Purpose"
                    value={localPurpose}
                    onChange={(value) => handleInputChange('purpose', value)}
                    onClear={() => handleClear('purpose')}
                    field="purpose"
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DateFilter label="Start Date" date={startDate} setDate={setStartDate} />
                <DateFilter label="End Date" date={endDate} setDate={setEndDate} />
            </div>
        </div>
    );

    const ActionButtons = () => (
        <div className="flex flex-wrap gap-2 justify-end mt-4">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                    <Button variant="default">
                        Create Visit
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <AddVisits closeModal={() => setIsModalOpen(false)} />
                </DialogContent>
            </Dialog>
            {viewMode === 'table' && (
                <>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">Columns</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {Object.keys(columnMapping).map(column => (
                                <DropdownMenuCheckboxItem
                                    key={column}
                                    checked={selectedColumns.includes(columnMapping[column])}
                                    onCheckedChange={() => handleColumnSelect(column)}
                                >
                                    {column}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {role === 'ADMIN' && (
                        <Button onClick={onExport}>Export</Button>
                    )}
                </>
            )}
        </div>
    );

    return (
        <>
            <div className="md:hidden">
                <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="w-full mb-4">
                            <Filter className="mr-2 h-4 w-4" /> Filter Visits
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right">
                        <SheetHeader>
                            <SheetTitle>Visits Filter</SheetTitle>
                        </SheetHeader>
                        <div className="py-4 space-y-6">
                            <FilterContent />
                            <ActionButtons />
                        </div>
                        <SheetFooter>
                            <Button onClick={() => setIsDrawerOpen(false)} className="w-full">Apply Filters</Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="hidden md:block">
                <Card className="bg-white shadow-sm">
                    <CardContent className="p-6">
                        <h2 className="text-xl font-semibold mb-4">Visits Filter</h2>
                        <div className="space-y-6">
                            <FilterContent />
                            <ActionButtons />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default VisitsFilter;