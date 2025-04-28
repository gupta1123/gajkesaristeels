import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader, AlertTriangle, User, BarChart } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { sortBy } from 'lodash';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './TotalSalesReportComponent.css'; // Import the component-specific CSS

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Interfaces
interface Store {
    id: number;
    storeName: string;
}

interface SummaryData {
  employeeId: number;
  employeeName: string;
  totalTons: number;
  storeId: number;
  storeName: string;
}

// Initial state for the BAR chart data (placeholder)
const initialChartData = {
  labels: ['Selected Store'], // Use a single label for the bar
  datasets: [
    {
      label: 'Total Tons',
      data: [0], // Single data point for the bar
      backgroundColor: 'rgba(227, 30, 36, 0.6)', // Slightly transparent red
      borderColor: 'rgb(196, 25, 32)', // Darker red border
      borderWidth: 1,
    },
  ],
};

const TotalSalesReportComponent: React.FC = () => {
  // State
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [summaryStoreId, setSummaryStoreId] = useState<string>('');
  const [summaryStartDate, setSummaryStartDate] = useState<Date | undefined>(subDays(new Date(), 7));
  const [summaryEndDate, setSummaryEndDate] = useState<Date | undefined>(new Date());
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  // Add state for dynamic chart data
  const [chartDisplayData, setChartDisplayData] = useState(initialChartData);

  const token = useSelector((state: RootState) => state.auth.token);

  // Chart options for Bar Chart
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend for single bar
      },
      title: {
        display: true,
        text: 'Total Sales Volume', // Updated title
      },
    },
     scales: {
        y: {
            beginAtZero: true,
             title: {
                display: true,
                text: 'Tons'
            }
        },
        x: { // Optional: Hide x-axis labels if desired for single bar
            // display: false,
        }
    }
  };

  // Fetch Stores
  const fetchStores = useCallback(async () => {
    if (!token) return;
    setIsLoadingStores(true);
    try {
      const response = await fetch('https://api.gajkesaristeels.in/store/names', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Store[] = await response.json();
      setStores(sortBy(data, 'storeName'));
    } catch (error: any) {
      console.error('Error fetching stores:', error);
    } finally {
      setIsLoadingStores(false);
    }
  }, [token]);

  // Fetch Sales Summary Data (Update BAR chart data on success)
  const fetchSalesSummary = async (storeId: string, startDate: Date, endDate: Date) => {
    if (!token || !storeId || !startDate || !endDate) return;
    setIsSummaryLoading(true);
    setSummaryError(null);
    setSummaryData(null);
    setChartDisplayData(initialChartData); // Reset chart on new fetch

    const formattedStartDate = format(startDate, 'yyyy-MM-dd');
    const formattedEndDate = format(endDate, 'yyyy-MM-dd');
    try {
      const url = `https://api.gajkesaristeels.in/sales/totalTonsByStore?storeId=${storeId}&startDate=${formattedStartDate}&endDate=${formattedEndDate}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
           const errorData = await response.json();
           errorMsg = errorData.message || errorMsg;
        } catch (e) { /* Ignore */ }
        throw new Error(errorMsg);
      }
      const data: SummaryData = await response.json();
      setSummaryData(data);

      // Update BAR chart data with fetched total
      setChartDisplayData({
        labels: [data.storeName], // Use store name as the label for the bar
        datasets: [
          {
            ...initialChartData.datasets[0], // Keep styling
            label: 'Total Tons',
            data: [data.totalTons], // Single data point for the bar
          },
        ],
      });

    } catch (error: any) {
      console.error('Error fetching sales summary:', error);
      setSummaryError(error.message || 'Failed to load sales summary.');
      setChartDisplayData(initialChartData); // Reset chart on error
    } finally {
      setIsSummaryLoading(false);
    }
  };

  // Handlers
  const handleDateChange = (date: Date | undefined, type: 'start' | 'end') => {
    if (type === 'start') setSummaryStartDate(date);
    else setSummaryEndDate(date);
  };

  const handleApplyFilters = () => {
    if (summaryStoreId && summaryStartDate && summaryEndDate) {
      fetchSalesSummary(summaryStoreId, summaryStartDate, summaryEndDate);
    } else {
      setSummaryError("Please select a store, start date, and end date.");
      setSummaryData(null);
    }
  };

  const handleClearFilters = () => {
    setSummaryStoreId('');
    setSummaryStartDate(subDays(new Date(), 7));
    setSummaryEndDate(new Date());
    setSummaryData(null);
    setSummaryError(null);
    setChartDisplayData(initialChartData); // Reset chart on clear
  };

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  return (
    <div className="container-total-sales-report px-4 py-6 space-y-6">
        {/* Filters */}
        <div className="p-4 border rounded-md bg-gradient-to-b from-[var(--gajkesari-black)] to-[var(--gajkesari-gray)]">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                {/* Store Filter */}
                <div className="space-y-1">
                   <Label htmlFor="report-storeId" className="text-gray-200">Store</Label> {/* Updated ID for uniqueness */}
                   <Select value={summaryStoreId} onValueChange={setSummaryStoreId}>
                       <SelectTrigger id="report-storeId">
                           <SelectValue placeholder={isLoadingStores ? "Loading..." : "Select Store"} />
                       </SelectTrigger>
                       <SelectContent>
                           {!isLoadingStores && stores.map((store) => (
                               <SelectItem key={store.id} value={store.id.toString()}>
                                   {store.storeName}
                               </SelectItem>
                           ))}
                       </SelectContent>
                   </Select>
                </div>
                {/* Start Date Filter */}
                <div className="space-y-1">
                    <Label htmlFor="report-startDate" className="text-gray-200">Start Date</Label> {/* Updated ID */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="report-startDate"
                                variant={"outline"}
                                className={`w-full justify-start text-left font-normal ${
                                    !summaryStartDate && "text-muted-foreground"
                                }`}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {summaryStartDate ? format(summaryStartDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={summaryStartDate}
                                onSelect={(date) => handleDateChange(date, 'start')}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                {/* End Date Filter */}
                <div className="space-y-1">
                    <Label htmlFor="report-endDate" className="text-gray-200">End Date</Label> {/* Updated ID */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="report-endDate"
                                variant={"outline"}
                                className={`w-full justify-start text-left font-normal ${
                                    !summaryEndDate && "text-muted-foreground"
                                }`}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {summaryEndDate ? format(summaryEndDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={summaryEndDate}
                                onSelect={(date) => handleDateChange(date, 'end')}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                 {/* Apply/Clear Buttons - Adjusted flex direction for responsiveness */}
                <div className="flex flex-col md:flex-col gap-2 md:col-span-1"> {/* Changed sm:flex-row to md:flex-col */}
                   <Button
                       onClick={handleApplyFilters}
                       disabled={isSummaryLoading || !summaryStoreId || !summaryStartDate || !summaryEndDate}
                       className="w-full"
                   >
                       {isSummaryLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                       Apply
                   </Button>
                   <Button
                       variant="outline"
                       onClick={handleClearFilters}
                       className="w-full bg-gray-600 text-white hover:bg-gray-700"
                   >
                       Clear
                   </Button>
                </div>
             </div>
          </div>

        {/* Display Area */} 
        <div>
            {isSummaryLoading ? (
                 <div className="flex justify-center items-center h-40">
                     <Loader className="w-8 h-8 animate-spin text-primary" />
                 </div>
             ) : summaryError ? (
                 <div className="text-center py-10 text-red-600">
                     <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                     <p className="text-lg font-semibold">Error Loading Summary</p>
                     <p>{summaryError}</p>
                 </div>
             ) : summaryData ? (
                 <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border border-[var(--gajkesari-red)]">
                     <CardHeader className="text-center bg-gradient-to-r from-[var(--gajkesari-black)] to-[var(--gajkesari-dark-red)] text-white rounded-t-lg py-4">
                         <CardTitle className="text-2xl">{summaryData.storeName}</CardTitle>
                         <CardDescription className="text-[var(--gajkesari-dark-red)] font-semibold">
                             Sales Summary ({summaryStartDate ? format(summaryStartDate, "MMM d, yyyy") : ''} - {summaryEndDate ? format(summaryEndDate, "MMM d, yyyy") : ''})
                         </CardDescription>
                     </CardHeader>
                     <CardContent className="p-6 text-center">
                         <div className="mb-4">
                             <p className="text-sm text-gray-500 uppercase tracking-wider">Total Tons Sold</p>
                             <p className="text-5xl font-bold text-[var(--gajkesari-dark-red)] my-2">
                                 {summaryData.totalTons.toFixed(2)}
                             </p>
                         </div>
                         <div className="flex items-center justify-center space-x-2 text-gray-600">
                            <User className="w-4 h-4" />
                            <span>Last Sale By: {summaryData.employeeName || 'N/A'}</span>
                         </div>
                     </CardContent>
                 </Card>
             ) : (
                 <div className="text-center py-10 text-gray-500 h-full flex flex-col justify-center items-center border rounded-md bg-gray-50">
                      <BarChart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>Select filters to view the sales summary.</p>
                 </div>
             )}
        </div>

        {/* Graph Area - Now a direct child */}
        <div>
            <Card className="h-full shadow-md">
                <CardHeader>
                    <CardTitle>Total Sales Bar Chart</CardTitle>
                    <CardDescription>Total tonnage for the selected store and period.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] p-4">
                    <Bar options={chartOptions} data={chartDisplayData} />
                </CardContent>
            </Card>
        </div>
    </div>
  );
};

export default TotalSalesReportComponent; 