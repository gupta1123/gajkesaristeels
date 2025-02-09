'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
}

interface Store {
  storeId: number;
  storeName: string;
}

interface AddVisitsProps {
  closeModal: () => void;
}

const AddVisits: React.FC<AddVisitsProps> = ({ closeModal }) => {
  const [visitDate, setVisitDate] = useState<Date | undefined>(undefined);
  const [visitPurpose, setVisitPurpose] = useState('');
  const [otherPurpose, setOtherPurpose] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [storeSearch, setStoreSearch] = useState('');
  const [showStoreResults, setShowStoreResults] = useState(false);
  const storeSearchRef = useRef<HTMLDivElement>(null);

  const token = useSelector((state: RootState) => state.auth.token);
  const role = useSelector((state: RootState) => state.auth.role);
  const employeeId = useSelector((state: RootState) => state.auth.employeeId);
  const loggedInUserId = useSelector((state: RootState) => state.auth.employeeId);

  const purposes = ['Follow Up', 'Order', 'Birthday', 'Payment', 'Others'];

  const fetchEmployees = useCallback(async () => {
    try {
      const url = role === 'MANAGER'
        ? `https://api.gajkesaristeels.in/employee/team/getbyEmployee?id=${employeeId}`
        : 'https://api.gajkesaristeels.in/employee/getAll';

      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();

      setEmployees(role === 'MANAGER' ? (data[0]?.fieldOfficers || []) : (Array.isArray(data) ? data : []));
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  }, [role, employeeId, token]);

  const fetchStoresByEmployee = useCallback(async (employeeId: string, searchTerm: string = '') => {
    try {
      const url = `https://api.gajkesaristeels.in/store/getByEmployeeWithSort?id=${employeeId}&storeName=${encodeURIComponent(searchTerm)}&sortBy=storeName&sortOrder=asc`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (Array.isArray(data.content)) {
        setStores(data.content.map((store: any) => ({
          storeId: store.storeId,
          storeName: store.storeName
        })));
      } else {
        console.error('Unexpected response format:', data);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  }, [token]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    if (selectedEmployee) {
      fetchStoresByEmployee(selectedEmployee, storeSearch);
    }
  }, [selectedEmployee, storeSearch, fetchStoresByEmployee]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (storeSearchRef.current && !storeSearchRef.current.contains(event.target as Node)) {
        setShowStoreResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) {
      console.error('No store selected');
      return;
    }
    const payload = {
      storeId: selectedStore.storeId,
      employeeId: parseInt(selectedEmployee, 10),
      visit_date: visitDate ? format(visitDate, "yyyy-MM-dd") : "",
      purpose: visitPurpose === 'Others' ? otherPurpose : visitPurpose,
      isSelfGenerated: role !== 'MANAGER',
      ...(role === 'MANAGER' && { assignedById: loggedInUserId })
    };

    try {
      const response = await fetch('https://api.gajkesaristeels.in/visit/create', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Visit created successfully:', data);
        closeModal();
      } else {
        console.error('Failed to create visit');
      }
    } catch (error) {
      console.error('Error creating visit:', error);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <Label htmlFor="visitDate">Visit Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !visitDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {visitDate ? format(visitDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={visitDate}
              onSelect={setVisitDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Label htmlFor="visitPurpose">Visit Purpose</Label>
        <Select value={visitPurpose} onValueChange={setVisitPurpose}>
          <SelectTrigger>
            <SelectValue placeholder="Select visit purpose" />
          </SelectTrigger>
          <SelectContent>
            {purposes.map((purpose) => (
              <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {visitPurpose === 'Others' && (
        <div>
          <Label htmlFor="otherPurpose">Other Purpose</Label>
          <Input
            id="otherPurpose"
            value={otherPurpose}
            onChange={(e) => setOtherPurpose(e.target.value)}
            placeholder="Specify other purpose"
          />
        </div>
      )}

      <div>
        <Label htmlFor="employee">Employee</Label>
        <Select
          value={selectedEmployee}
          onValueChange={(value) => {
            setSelectedEmployee(value);
            setSelectedStore(null);
            setStoreSearch('');
            fetchStoresByEmployee(value);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an employee" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id.toString()}>
                {`${employee.firstName} ${employee.lastName}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div ref={storeSearchRef}>
        <Label htmlFor="store">Store</Label>
        <Input
          type="text"
          placeholder="Search and select store..."
          value={selectedStore ? selectedStore.storeName : storeSearch}
          onChange={(e) => {
            setStoreSearch(e.target.value);
            setSelectedStore(null);
            setShowStoreResults(true);
          }}
          onFocus={() => setShowStoreResults(true)}
          disabled={!selectedEmployee} // Disable the input if no employee is selected
        />
        {showStoreResults && stores.length > 0 && (
          <div className="absolute z-10 w-full bg-white border border-gray-300 mt-1 rounded-md shadow-lg">
            {stores.slice(0, 5).map((store) => (
              <div
                key={store.storeId}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setSelectedStore(store);
                  setStoreSearch('');
                  setShowStoreResults(false);
                }}
              >
                {store.storeName}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit">Submit Visit</Button>
      </div>
    </form>
  );
};

export default AddVisits;