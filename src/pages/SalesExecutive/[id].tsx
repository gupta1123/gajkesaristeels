import { useRouter } from 'next/router';
import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format, formatDuration, intervalToDuration, differenceInMinutes } from "date-fns";
import { FaCalendarAlt } from 'react-icons/fa';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import './SalesExecutivePage.css';

interface Visit {
  id: number;
  storeId: number;
  storeName: string;
  employeeName: string;
  visit_date: string;
  scheduledStartTime: string | null;
  scheduledEndTime: string | null;
  checkinDate: string | null;
  checkoutDate: string | null;
  checkinTime: string | null;
  checkoutTime: string | null;
  purpose: string;
  outcome: string | null;
}

interface StatsDto {
  visitCount: number;
  fullDays: number;
  halfDays: number;
  absences: number;
}

interface Expense {
  id: number;
  type: string;
  subType: string;
  amount: number;
  approvalStatus: string;
  description: string;
  approvalDate: string;
  expenseDate: string;
  employeeName: string;
}

interface EmployeeData {
  id: number;
  firstName: string;
  lastName: string;
  employeeId: string;
  primaryContact: number;
  email: string;
  role: string;
  city: string;
  state: string;
  country: string;
  dateOfJoining: string;
  departmentName: string;
}

interface PricingData {
  id: number;
  brandName: string;
  price: number;
  city: string;
}

const SalesExecutivePage = () => {
  const router = useRouter();
  const { id } = router.query;
  const token = useSelector((state: RootState) => state.auth.token);

  const [activeTab, setActiveTab] = useState('visits');
  const [activeInfoTab, setActiveInfoTab] = useState('personal-info');
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [showExpenseStartCalendar, setShowExpenseStartCalendar] = useState(false);
  const [showExpenseEndCalendar, setShowExpenseEndCalendar] = useState(false);

  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [stats, setStats] = useState<StatsDto | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<any | null>(null);
  const [dailyPricing, setDailyPricing] = useState<PricingData[]>([]);

  const [visitFilter, setVisitFilter] = useState<string>('today');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [expenseStartDate, setExpenseStartDate] = useState<Date | undefined>(new Date());
  const [expenseEndDate, setExpenseEndDate] = useState<Date | undefined>(new Date());
  const [pricingStartDate, setPricingStartDate] = useState<Date | undefined>(new Date());
  const [pricingEndDate, setPricingEndDate] = useState<Date | undefined>(new Date());

  const [showPricingStartCalendar, setShowPricingStartCalendar] = useState(false);
  const [showPricingEndCalendar, setShowPricingEndCalendar] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const response = await fetch(`https://api.gajkesaristeels.in/employee/getAll`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        const employee = data.find((emp: EmployeeData) => emp.id.toString() === id);
        if (employee) {
          setEmployeeData(employee);
        }
      } catch (error) {
        console.error("Error fetching employee data:", error);
      }
    };

    if (token && id) {
      fetchEmployeeData();
    }
  }, [token, id]);

  useEffect(() => {
    const fetchVisitsAndStats = async () => {
      if (token && id) {
        let startDate, endDate;
        const now = new Date();

        // Determine date range based on visitFilter
        if (visitFilter === 'today') {
          startDate = now.toISOString().split('T')[0];
          endDate = now.toISOString().split('T')[0];
        } else if (visitFilter === 'yesterday') {
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          startDate = yesterday.toISOString().split('T')[0];
          endDate = yesterday.toISOString().split('T')[0];
        } else if (visitFilter === 'last-2-days') {
          const twoDaysAgo = new Date(now);
          twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
          startDate = twoDaysAgo.toISOString().split('T')[0];
          endDate = now.toISOString().split('T')[0];
        } else if (visitFilter === 'this-month') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        } else if (visitFilter === 'last-month') {
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
          endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
        }

        try {
          const response = await fetch(`https://api.gajkesaristeels.in/visit/getByDateRangeAndEmployeeStats?id=${id}&start=${startDate}&end=${endDate}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await response.json();
          setVisits(data.visitDto);
          setStats(data.statsDto);
        } catch (error) {
          console.error("Error fetching visits and stats:", error);
        }
      }
    };

    fetchVisitsAndStats();
  }, [token, id, visitFilter]);

  useEffect(() => {
    const fetchExpenses = async () => {
      if (token && id) {
        const start = expenseStartDate ? expenseStartDate.toISOString().split('T')[0] : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
        const end = expenseEndDate ? expenseEndDate.toISOString().split('T')[0] : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-30`;
        try {
          const response = await fetch(`https://api.gajkesaristeels.in/expense/getByEmployeeAndDate?start=${start}&end=${end}&id=${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await response.json();
          setExpenses(data);
        } catch (error) {
          console.error("Error fetching expenses:", error);
        }
      }
    };

    fetchExpenses();
  }, [token, id, expenseStartDate, expenseEndDate]);

  useEffect(() => {
    const fetchAttendanceStats = async () => {
      if (token && id) {
        try {
          const selectedDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
          const response = await fetch(`https://api.gajkesaristeels.in/attendance-log/monthlyVisits?date=${selectedDate}&employeeId=${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await response.json();
          setAttendanceStats(data);
        } catch (error) {
          console.error("Error fetching attendance stats:", error);
        }
      }
    };

    fetchAttendanceStats();
  }, [token, id, selectedYear, selectedMonth]);

  useEffect(() => {
    const fetchDailyPricing = async () => {
      if (token && id) {
        const start = pricingStartDate ? pricingStartDate.toISOString().split('T')[0] : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
        const end = pricingEndDate ? pricingEndDate.toISOString().split('T')[0] : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-30`;
        try {
          const response = await fetch(`https://api.gajkesaristeels.in/brand/getByDateRangeForEmployee?start=${start}&end=${end}&id=${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await response.json();
          setDailyPricing(data);
        } catch (error) {
          console.error("Error fetching daily pricing:", error);
        }
      }
    };

    fetchDailyPricing();
  }, [token, id, pricingStartDate, pricingEndDate]);

  const loadPerformanceChart = useCallback(() => {
    if (chartRef.current && stats) {
      const ctx = chartRef.current.getContext('2d');

      if (ctx) {
        const config: ChartConfiguration = {
          type: 'line',
          data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
              label: 'Visits',
              data: [stats.visitCount, 59, 80, 81, 56, 55],
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1
            }, {
              label: 'Full Days',
              data: [stats.fullDays, 48, 40, 19, 86, 27],
              borderColor: 'rgb(255, 99, 132)',
              tension: 0.1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        };

        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        chartInstance.current = new Chart(ctx, config);
      }
    }
  }, [stats]);

  useEffect(() => {
    loadPerformanceChart();
  }, [stats, loadPerformanceChart]);

  const calculateStats = () => {
    const totalVisits = visits.length;
    const now = new Date();
    const currentMonthVisits = visits.filter(visit => {
      const visitDate = new Date(visit.visit_date);
      return visitDate.getMonth() === now.getMonth() && visitDate.getFullYear() === now.getFullYear();
    }).length;

    const totalDuration = visits.reduce((acc, visit) => {
      if (visit.checkinTime && visit.checkoutTime) {
        const checkinDate = new Date(`${visit.checkinDate}T${visit.checkinTime}`);
        const checkoutDate = new Date(`${visit.checkoutDate}T${visit.checkoutTime}`);
        const duration = differenceInMinutes(checkoutDate, checkinDate);
        return acc + duration;
      }
      return acc;
    }, 0);

    const avgDuration = totalVisits > 0 ? totalDuration / totalVisits : 0;
    const hours = Math.floor(avgDuration / 60);
    const minutes = Math.floor(avgDuration % 60);

    return {
      totalVisits,
      currentMonthVisits,
      avgDuration: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
    };
  };

  const { totalVisits, currentMonthVisits, avgDuration } = calculateStats();

  return (
    <div className="container mainContent">
      <Head>
        <title>Employee Detail Page</title>
      </Head>

      <div className="employeeDetails">
        <aside className="leftPanel">
          <div className="backButton"><i className="fas fa-arrow-left"></i> Back to employees</div>
          <div className="profile">
            <Avatar
              className="avatar custom-avatar"
              style={{
                width: '100px',
                height: '100px',
                background: 'linear-gradient(135deg, #4a90e2 0%, #f5a623 100%)'
              }}
            >
              <AvatarFallback
                className="custom-avatar-fallback"
                style={{
                  color: 'white',
                  fontSize: '36px',
                  fontWeight: 'bold',
                  background: 'transparent'
                }}
              >
                {employeeData ? getInitials(`${employeeData.firstName} ${employeeData.lastName}`) : 'PS'}
              </AvatarFallback>
            </Avatar>
            <h2>{employeeData?.firstName} {employeeData?.lastName}</h2>
            <p className="jobTitle">{employeeData?.role}</p>
          </div>
          <div className="actionButtons">
          </div>
          <div className="employeeStats">
            {activeTab === 'visits' && (
              <>
                <div className="statItem">
                  <span className="statLabel">Total Visits</span>
                  <span className="statValue">{totalVisits}</span>
                </div>
                <div className="statItem">
                  <span className="statLabel">Avg. Duration</span>
                  <span className="statValue">{avgDuration}</span>
                </div>
              </>
            )}
          </div>
          <div className="infoTabs">
            <div className={`infoTab ${activeInfoTab === 'personal-info' ? 'active' : ''}`} onClick={() => setActiveInfoTab('personal-info')}>Personal Info</div>
            <div className={`infoTab ${activeInfoTab === 'work-info' ? 'active' : ''}`} onClick={() => setActiveInfoTab('work-info')}>Work Info</div>
          </div>
          <div className={`infoContent ${activeInfoTab === 'personal-info' ? 'active' : ''}`} id="personal-info">
            <div className="infoItem">
              <div className="infoLabel"><i className="fas fa-envelope"></i> Email</div>
              <div>{employeeData?.email}</div>
            </div>
            <div className="infoItem">
              <div className="infoLabel"><i className="fas fa-phone"></i> Phone</div>
              <div>{employeeData?.primaryContact}</div>
            </div>
            <div className="infoItem">
              <div className="infoLabel"><i className="fas fa-map-marker-alt"></i> Location</div>
              <div>{`${employeeData?.city}, ${employeeData?.state}, ${employeeData?.country}`}</div>
            </div>
            <div className="infoItem">
              <div className="infoLabel"><i className="fas fa-calendar"></i> Joined</div>
              <div>{employeeData?.dateOfJoining ? format(new Date(employeeData.dateOfJoining), 'MMM d, yyyy') : 'N/A'}</div>
            </div>
          </div>
          <div className={`infoContent ${activeInfoTab === 'work-info' ? 'active' : ''}`} id="work-info">
            <div className="infoItem">
              <div>{employeeData?.employeeId}</div>
            </div>
            <div className="infoItem">
              <div className="infoLabel"><i className="fas fa-building"></i> Department</div>
              <div>{employeeData?.departmentName}</div>
            </div>
            <div className="infoItem">
              <div className="infoLabel"><i className="fas fa-user-tie"></i> Role</div>
              <div>{employeeData?.role}</div>
            </div>
          </div>
        </aside>
        <section className="activityDetails">
          {/* <div className="performanceOverview">
            <h3>Performance Overview</h3>
            <div className="chartContainer">
              <canvas ref={chartRef}></canvas>
            </div>
          </div> */}
          <div className="tabs">
            <button className={`tab ${activeTab === 'visits' ? 'active' : ''}`} onClick={() => setActiveTab('visits')}>
              <i className="fas fa-map-marked-alt"></i> Visits
            </button>
            <button className={`tab ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>
              <i className="fas fa-calendar-check"></i> Attendance
            </button>
            <button className={`tab ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>
              <i className="fas fa-receipt"></i> Expenses
            </button>
            <button className={`tab ${activeTab === 'daily-pricing' ? 'active' : ''}`} onClick={() => setActiveTab('daily-pricing')}>
              <i className="fas fa-tags"></i> Daily Pricing
            </button>
          </div>

          <div className={`tabContent ${activeTab === 'visits' ? 'active' : ''}`} id="visits">
            <div className="filters flex space-x-4 mb-4">
              <Select value={visitFilter} onValueChange={setVisitFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Select Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last-2-days">Last 2 Days</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="visitsGrid">
              {visits.map((visit) => {
                let status = 'Scheduled';
                if (visit.checkinDate && visit.checkinTime && visit.checkoutDate && visit.checkoutTime) {
                  status = 'Completed';
                } else if (visit.checkinDate && visit.checkinTime) {
                  status = 'In Progress';
                }

                return (
                  <Card key={visit.id} className="visitCard" onClick={() => router.push(`/VisitDetailPage/${visit.id}`)}>
                    <CardContent>
                      <div className="visitHeader">
                        <div className="storeName">{visit.storeName}</div>
                        <div className="visitDate">
                          {format(new Date(visit.visit_date), 'yyyy-MM-dd')}
                        </div>
                      </div>
                      <div className="visitDetail">
                        <strong>Purpose:</strong> {visit.purpose}
                      </div>
                      <div className="visitDetail">
                        <strong>Duration:</strong> {visit.checkinTime && visit.checkoutTime ? (
                          `${formatDuration(intervalToDuration({
                            start: new Date(`${visit.checkinDate}T${visit.checkinTime}`),
                            end: new Date(`${visit.checkoutDate}T${visit.checkoutTime}`)
                          }))}`
                        ) : 'N/A'}
                      </div>
                      <div className={`visitStatus ${status.toLowerCase().replace(' ', '-')}`}>{status}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className={`tabContent ${activeTab === 'attendance' ? 'active' : ''}`} id="attendance">
            <div className="filters flex space-x-4 mb-4">
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 27 }, (_, index) => (
                    <SelectItem key={index} value={(2023 + index).toString()}>
                      {2023 + index}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="attendanceGrid">
              <div className="attendanceCard">
                <div className="attendanceLabel">Full Day</div>
                <div className="attendanceValue">{attendanceStats?.statsDto.fullDays}</div>
              </div>
              <div className="attendanceCard">
                <div className="attendanceLabel">Half Day</div>
                <div className="attendanceValue">{attendanceStats?.statsDto.halfDays}</div>
              </div>
              <div className="attendanceCard">
                <div className="attendanceLabel">Absent</div>
                <div className="attendanceValue">{attendanceStats?.statsDto.absences}</div>
              </div>
            </div>
          </div>

          <div className={`tabContent ${activeTab === 'expenses' ? 'active' : ''}`} id="expenses">
            <div className="filters flex space-x-4 mb-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    Start Date: {expenseStartDate ? format(expenseStartDate, 'MMM d, yyyy') : 'Select Start Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={expenseStartDate}
                    onSelect={setExpenseStartDate}
                    showOutsideDays
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    End Date: {expenseEndDate ? format(expenseEndDate, 'MMM d, yyyy') : 'Select End Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={expenseEndDate}
                    onSelect={setExpenseEndDate}
                    showOutsideDays
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="expensesGrid">
              {expenses.map((expense) => (
                <Card key={expense.id} className="expenseCard">
                  <CardContent>
                    <div className="expenseType">{expense.type}</div>
                    <div className="expenseDate">
                      <FaCalendarAlt className="icon" />
                      <span>{format(new Date(expense.expenseDate), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="expenseAmount">Amount: ₹{expense.amount.toFixed(2)}</div>
                    <div className={`expenseStatus ${expense.approvalStatus.toLowerCase()}`}>{expense.approvalStatus}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className={`tabContent ${activeTab === 'daily-pricing' ? 'active' : ''}`} id="daily-pricing">
            <div className="filters flex space-x-4 mb-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    Start Date: {pricingStartDate ? format(pricingStartDate, 'MMM d, yyyy') : 'Select Start Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={pricingStartDate}
                    onSelect={setPricingStartDate}
                    showOutsideDays
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    End Date: {pricingEndDate ? format(pricingEndDate, 'MMM d, yyyy') : 'Select End Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={pricingEndDate}
                    onSelect={setPricingEndDate}
                    showOutsideDays
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="pricingGrid">
              {dailyPricing.map((pricing) => (
                <Card key={pricing.id} className="pricingCard">
                  <CardContent>
                    <div className="pricingHeader">
                      <div className="pricingBrand">{pricing.brandName}</div>
                      <div className="pricingCategory">{pricing.city}</div>
                    </div>
                    <div className="pricingBody">
                      <div className="pricingPrice">₹{pricing.price.toFixed(2)}</div>

                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SalesExecutivePage;
