import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { format } from 'date-fns';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";
import DateRangeDropdown from '../DateRangeDropdown';
import EmployeeDetails from '../EmployeeDetails';
import axios from 'axios';

const API_BASE_URL = 'https://api.gajkesaristeels.in';

const EmployeeDetailsPage = () => {
  const router = useRouter();
  const { employee, state } = router.query;
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedOption, setSelectedOption] = useState(router.query.selectedOption as string || 'Today');
  const [currentPage, setCurrentPage] = useState(parseInt(router.query.currentPage as string || '1'));
  const [isLoading, setIsLoading] = useState(false);
  const [employeeDetails, setEmployeeDetails] = useState<any>(null);
  
  const token = useSelector((state: RootState) => state.auth.token);

  const fetchEmployeeDetails = async (employeeName: string, start: string, end: string) => {
    setIsLoading(true);
    try {
      // First try to find employee in employeeInfo
      const employeeResponse = await axios.get(`${API_BASE_URL}/employee/getAll`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const employeeInfo = employeeResponse.data;
      const employeeMatch = employeeInfo.find((emp: any) => 
        `${emp.firstName} ${emp.lastName}`.toLowerCase() === employeeName.toLowerCase()
      );

      if (!employeeMatch) {
        throw new Error("Employee not found");
      }

      const response = await fetch(
        `${API_BASE_URL}/visit/getByDateRangeAndEmployeeStats?id=${employeeMatch.id}&start=${start}&end=${end}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch employee details: ${response.statusText}`);
      }

      const data = await response.json();
      setEmployeeDetails(data);
    } catch (error) {
      console.error('Error fetching employee details:', error);
      setEmployeeDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (router.isReady) {
      if (router.query.startDate && router.query.endDate) {
        setStartDate(router.query.startDate as string);
        setEndDate(router.query.endDate as string);
      }
      
      if (router.query.selectedOption) {
        setSelectedOption(router.query.selectedOption as string);
      }
    }
  }, [router.isReady, router.query]);

  useEffect(() => {
    if (employee && token && startDate && endDate) {
      fetchEmployeeDetails(employee as string, startDate, endDate);
    }
  }, [employee, token, startDate, endDate]);

  const handleDateRangeChange = (start: string, end: string, option: string) => {
    setStartDate(start);
    setEndDate(end);
    setSelectedOption(option);
    
    router.push(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          startDate: start,
          endDate: end,
          selectedOption: option
        }
      },
      undefined,
      { shallow: true }
    );
  };

  const handleViewDetails = (visitId: number) => {
    router.push({
      pathname: `/VisitDetailPage/${visitId}`,
      query: {
        returnTo: 'employeeDetails',
        employee: employee,
        state: state,
        startDate: startDate,
        endDate: endDate,
        selectedOption: selectedOption,
        currentPage: currentPage.toString()
      }
    });
  };

  const handleBackToDashboard = () => {
    router.push(state ? `/Dashboard?state=${state}` : '/Dashboard');
  };

  if (!employee) {
    return null;
  }

  return (
    <div className="container-dashboard w-full max-w-[100vw] mx-auto py-4 sm:py-8 px-3 sm:px-4">
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Employee Details</h1>
          <div className="flex items-center space-x-4">
            <DateRangeDropdown
              selectedOption={selectedOption}
              onDateRangeChange={handleDateRangeChange}
            />
            <Button variant="outline" size="sm" onClick={handleBackToDashboard}>
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {employeeDetails && (
          <EmployeeDetails
            employeeDetails={employeeDetails}
            selectedEmployee={employee as string}
            setSelectedEmployee={() => {}}
            handleDateRangeChange={handleDateRangeChange}
            selectedOption={selectedOption}
            handleViewDetails={handleViewDetails}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            isLoading={isLoading}
            onBackClick={handleBackToDashboard}
          />
        )}
      </div>
    </div>
  );
};

export default EmployeeDetailsPage; 