import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import AttendanceCard from './AttendanceCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { VisitListProvider } from '../contexts/VisitListContext';
import VisitDetailsModal from './VisitDetailsModal';
import './Attendance.css';

interface AttendanceData {
  id: number;
  employeeId: number;
  employeeName: string;
  attendanceStatus: 'full day' | 'half day' | 'Absent';
  checkinDate: string;
  checkoutDate: string;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  employeeId: string;
  department: string;
  position: string;
}

const Attendance: React.FC = () => {
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [noDataMessage, setNoDataMessage] = useState<string>("");
  const [nameFilter, setNameFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [visitData, setVisitData] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>('');

  const years = Array.from({ length: 27 }, (_, index) => 2024 + index);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const token = useSelector((state: RootState) => state.auth.token);

  const fetchEmployees = useCallback(async () => {
    if (!token) {
      console.error("Auth token is missing");
      return;
    }

    try {
      const response = await fetch("https://api.gajkesaristeels.in/employee/getAll", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }

      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  }, [token]);

  const fetchAttendanceData = useCallback(async () => {
    setIsLoading(true);

    if (!token) {
      console.error("Auth token is missing");
      return;
    }

    const startDate = new Date(selectedYear, selectedMonth, 1).toISOString().split("T")[0];
    const lastDayOfMonth = new Date(selectedYear, selectedMonth + 1, 0);
    const nextDay = new Date(lastDayOfMonth);
    nextDay.setDate(lastDayOfMonth.getDate() + 1);
    const endDate = nextDay.toISOString().split("T")[0];

    try {
      const response = await fetch(
        `https://api.gajkesaristeels.in/attendance-log/getForRange1?start=${startDate}&end=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch attendance data");
      }

      const data = await response.json();

      const modifiedData = data.map((item: any) => {
        if (item.attendanceStatus === "Present") {
          return { ...item, attendanceStatus: "full day" };
        }
        return item;
      });

      setAttendanceData(modifiedData);
      setNoDataMessage("");

      if (data.length === 0) {
        setNoDataMessage("No data available for the selected month and year. Please choose a different month or year.");
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      setAttendanceData([]);
      setNoDataMessage("No data available for the selected month and year. Please choose a different month or year.");
    }

    setIsLoading(false);
  }, [token, selectedYear, selectedMonth]);

  const fetchVisitData = useCallback(
    async (date: string, employeeName: string) => {
      if (!token) {
        console.error("Auth token is missing");
        return;
      }

      try {
        const response = await fetch(
          `https://api.gajkesaristeels.in/visit/getByDateSorted?startDate=${date}&endDate=${date}&employeeName=${employeeName}&page=0&size=100&sort=id,desc`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch visit data");
        }

        const data = await response.json();

        // Filter the visits to only include those for the selected employee
        const filteredVisits = data.content.filter((visit: any) => visit.employeeName === employeeName);

        setVisitData(filteredVisits || []);
        setSelectedDate(date);
        setSelectedEmployeeName(employeeName);
        setIsModalOpen(true);

        if (filteredVisits.length === 0) {
          setVisitData([]);
        }
      } catch (error) {
        console.error("Error fetching visit data:", error);
        setVisitData([]);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchAttendanceData();
    fetchEmployees();
  }, [selectedYear, selectedMonth, token, fetchAttendanceData, fetchEmployees]);

  // Filter employees by name, then sort
  const filteredEmployees = employees
    .filter((employee) =>
      `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(nameFilter.toLowerCase())
    )
    .sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

  return (
    <VisitListProvider>
      <div className="container mx-auto py-8 px-4 sm:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="w-full sm:w-auto">
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={month} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Input
                type="text"
                placeholder="Filter by name"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              />
            </div>
          </div>
          <div className="mb-4">
            <p className="text-lg font-bold">Legend:</p>
            <div className="flex space-x-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 mr-2"></div>
                <p>Full Day</p>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-500 mr-2"></div>
                <p>Half Day</p>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 mr-2"></div>
                <p>Absent</p>
              </div>
            </div>
          </div>
        </div>

        {noDataMessage && <p className="mb-4 text-red-500">{noDataMessage}</p>}

        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} height={200} />)
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredEmployees.map((employee) => {
                const initialSummary = { fullDays: 0, halfDays: 0, absentDays: 0 };
                const employeeAttendance = attendanceData.filter((data) => data.employeeId === employee.id);
                
                // Console log the dates for this employee
                const employeeDates = employeeAttendance.map(item => new Date(item.checkinDate).getDate());
                console.log(`Dates passed to AttendanceCard for ${employee.firstName} ${employee.lastName}:`, employeeDates);
                
                return (
                  <AttendanceCard
                    key={employee.id}
                    employee={employee}
                    initialSummary={initialSummary}
                    selectedYear={selectedYear}
                    selectedMonth={selectedMonth}
                    attendanceData={employeeAttendance}
                    onDateClick={(date, employeeName) => fetchVisitData(date, employeeName)}
                  />
                );
              })}
            </div>
          )}
        </div>

        <VisitDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          visitData={visitData}
          selectedDate={selectedDate}
          employeeName={selectedEmployeeName}
        />
      </div>
    </VisitListProvider>
  );
};

export default Attendance;
