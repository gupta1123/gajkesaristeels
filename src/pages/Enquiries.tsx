import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from '@radix-ui/react-icons';
import { format } from 'date-fns';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table';
import './EnquiriesPage.css';
import { useQuery, QueryClient, QueryClientProvider, QueryKey, QueryFunctionContext } from 'react-query';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const queryClient = new QueryClient();

interface SalesData {
  [monthYear: string]: number;
}

interface Enquiry {
  id: number;
  taluka: string;
  population: number;
  dealerName: string;
  expenses: number;
  contactNumber: string;
  fileName: string;
  sheetName: string;
  sales: SalesData;
}

const formatDateToMMMyy = (date: Date | undefined): string => {
  return date ? format(date, 'MMM-yy') : '';
};

const formatMonthYearToString = (month: number | undefined, year: number | undefined): string => {
  if (typeof month === 'number' && typeof year === 'number') {
    const date = new Date(year, month);
    return format(date, 'MMM-yy');
  }
  return '';
};

const EnquiriesPageContent: React.FC = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [storeNameFilter, setStoreNameFilter] = useState<string>('');
  const [talukaFilter, setTalukaFilter] = useState<string>('');

  const [tempStartMonth, setTempStartMonth] = useState<number | undefined>(undefined);
  const [tempStartYear, setTempStartYear] = useState<number | undefined>(undefined);
  const [tempEndMonth, setTempEndMonth] = useState<number | undefined>(undefined);
  const [tempEndYear, setTempEndYear] = useState<number | undefined>(undefined);

  const [tempStoreNameFilter, setTempStoreNameFilter] = useState<string>('');
  const [tempTalukaFilter, setTempTalukaFilter] = useState<string>('');
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2000 + 1 }, (_, index) => currentYear - index);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  type EnquiryApiQueryKey = [
    string,
    string, // startDate (MMM-yy)
    string, // endDate (MMM-yy)
    string, // storeNameFilter
    string // talukaFilter
  ];

  const fetchEnquiries = useCallback(async (context: QueryFunctionContext<EnquiryApiQueryKey>): Promise<Enquiry[]> => {
    const [_key, startMonth, endMonth, storeName, taluka] = context.queryKey;
    if (!token) throw new Error('No token available. Please log in.');

    const queryParams = new URLSearchParams();
    let baseUrl = 'http://ec2-3-88-111-83.compute-1.amazonaws.com:8081/enquiry/';

    const hasAnyFilter = storeName || taluka || startMonth || endMonth;

    if (hasAnyFilter) {
      baseUrl += 'filter';
      if (storeName) queryParams.append('storeName', storeName);
      if (taluka) queryParams.append('taluka', taluka);
      if (startMonth) queryParams.append('startMonth', startMonth);
      if (endMonth && startMonth) queryParams.append('endMonth', endMonth);
      else if (endMonth && !startMonth) {
        queryParams.append('endMonth', endMonth);
      }
    } else {
      baseUrl += 'getAll';
    }

    const endpoint = queryParams.toString() ? `${baseUrl}?${queryParams.toString()}` : baseUrl;
    
    const response = await fetch(endpoint, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Network response was not ok while fetching enquiries: ${errorData || response.statusText}`);
    }
    return response.json();
  }, [token]);

  const { data: enquiriesDataFromApi, isLoading, isError, error, refetch } = useQuery<Enquiry[], Error, Enquiry[], EnquiryApiQueryKey>(
    ['enquiriesApi', 
      startDate,
      endDate,
      storeNameFilter,
      talukaFilter
    ],
    fetchEnquiries,
    {
      enabled: !!token,
      retry: 1,
    }
  );

  const filteredEnquiries = React.useMemo(() => {
    return enquiriesDataFromApi || [];
  }, [enquiriesDataFromApi]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setUploadMessage(null);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) { setUploadMessage('Please select a file first.'); return; }
    if (!token) { setUploadMessage('Authentication token not found. Please log in.'); return; }
    setIsUploading(true);
    setUploadMessage('Uploading...');
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const response = await fetch('http://ec2-3-88-111-83.compute-1.amazonaws.com:8081/enquiry/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const responseText = await response.text();
      if (response.ok && responseText === 'File uploaded successfully') {
        setUploadMessage('File uploaded successfully!');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        refetch();
      } else if (response.ok) {
        setUploadMessage(responseText);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        refetch();
      } else {
        setUploadMessage(`Upload failed: ${responseText || response.statusText}`);
      }
    } catch (e: any) {
      setUploadMessage(`Upload error: ${e.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyFilters = () => {
    setStartDate(formatMonthYearToString(tempStartMonth, tempStartYear));
    setEndDate(formatMonthYearToString(tempEndMonth, tempEndYear));
    setStoreNameFilter(tempStoreNameFilter);
    setTalukaFilter(tempTalukaFilter);
  };

  const handleClearFilters = () => {
    setTempStartMonth(undefined);
    setTempStartYear(undefined);
    setTempEndMonth(undefined);
    setTempEndYear(undefined);
    setTempStoreNameFilter('');
    setTempTalukaFilter('');
    
    setStartDate('');
    setEndDate('');
    setStoreNameFilter('');
    setTalukaFilter('');
  };

  const baseDisplayColumns = ['Taluka', 'Population', 'Store Name', 'Expenses', 'Phone'];
  const salesMonths = React.useMemo(() => {
    const months = new Set<string>();
    filteredEnquiries.forEach((enquiry: Enquiry) => {
      if (enquiry.sales) {
        Object.keys(enquiry.sales).forEach(month => months.add(month));
      }
    });
    return Array.from(months).sort();
  }, [filteredEnquiries]);
  const tableDisplayColumns = [...baseDisplayColumns, ...salesMonths, 'Total Sales'];

  const calculateTotalSales = (sales: SalesData | undefined): number => {
    if (!sales) return 0;
    return Object.values(sales).reduce((sum, value) => sum + (Number(value) || 0), 0);
  };

  const renderMainContent = () => {
    if (!token && !isLoading) {
      return <p className="text-red-500">Authentication token not found. Please log in to view enquiries.</p>;
    }
    if (isLoading) return <p>Loading enquiries from API...</p>;
    if (isError) return <p className="text-red-500">Error fetching enquiries: {error?.message}</p>;
    return (
      <div className="overflow-x-auto shadow-md sm:rounded-lg mt-4">
        <Table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <TableCaption className="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
            Enquiry Data
            <p className="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">Browse a list of your recent enquiries, filter by date range and other criteria.</p>
          </TableCaption>
          <TableHeader className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <TableRow>
              {tableDisplayColumns.map((column) => (
                <TableHead key={column} scope="col" className="px-6 py-3">
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEnquiries.map((enquiry: Enquiry) => (
              <TableRow key={enquiry.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <TableCell className="px-6 py-4">{enquiry.taluka}</TableCell>
                <TableCell className="px-6 py-4">{enquiry.population}</TableCell>
                <TableCell className="px-6 py-4">{enquiry.dealerName}</TableCell>
                <TableCell className="px-6 py-4">{enquiry.expenses}</TableCell>
                <TableCell className="px-6 py-4">{enquiry.contactNumber}</TableCell>
                {salesMonths.map(month => (
                  <TableCell key={month} className="px-6 py-4">
                    {enquiry.sales?.[month] ?? 0}
                  </TableCell>
                ))}
                <TableCell className="px-6 py-4 font-semibold">
                  {calculateTotalSales(enquiry.sales)}
                </TableCell>
              </TableRow>
            ))}
            {filteredEnquiries.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={tableDisplayColumns.length} className="px-6 py-4 text-center text-gray-500">
                  No enquiries found for the selected criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="container-enquiries mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-4xl font-bold">Enquiries</h1>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            id="fileUploadEnquiry"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
            accept=".xlsx,.xls,.csv"
          />
          <label 
            htmlFor="fileUploadEnquiry" 
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 cursor-pointer"
           >Select File</label>
          {selectedFile && <span className="text-sm text-gray-600">{selectedFile.name}</span>}
          <Button onClick={handleUpload} disabled={isUploading || !selectedFile} className="whitespace-nowrap bg-black hover:bg-gray-800 text-white">
            {isUploading ? 'Uploading...' : 'Upload Data'}
          </Button>
        </div>
      </div>
      {uploadMessage && (
        <div className={`mb-4 p-3 rounded-md text-sm ${uploadMessage.includes('successfully') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {uploadMessage}
        </div>
      )}

      <div className="p-4 bg-gray-50 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-4 items-end">
          <div>
            <label htmlFor="storeNameFilter" className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
            <Input 
              id="storeNameFilter"
              type="text" 
              placeholder="Enter Store Name"
              value={tempStoreNameFilter} 
              onChange={(e) => setTempStoreNameFilter(e.target.value)} 
              className="h-9 w-full"
            />
          </div>
          <div>
            <label htmlFor="talukaFilter" className="block text-sm font-medium text-gray-700 mb-1">Taluka</label>
            <Input 
              id="talukaFilter"
              type="text" 
              placeholder="Enter Taluka"
              value={tempTalukaFilter} 
              onChange={(e) => setTempTalukaFilter(e.target.value)} 
              className="h-9 w-full"
            />
          </div>
          
          <div>
            <label htmlFor="fromYearFilter" className="block text-sm font-medium text-gray-700 mb-1">From Year</label>
            <Select
              value={tempStartYear?.toString()}
              onValueChange={(value) => {
                if (value === "NONE_VALUE") setTempStartYear(undefined);
                else setTempStartYear(value ? parseInt(value) : undefined);
              }}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE_VALUE"><em>None</em></SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="fromMonthFilter" className="block text-sm font-medium text-gray-700 mb-1">From Month</label>
            <Select
              value={tempStartMonth?.toString()}
              onValueChange={(value) => {
                if (value === "NONE_VALUE") setTempStartMonth(undefined);
                else setTempStartMonth(value ? parseInt(value) : undefined);
              }}
              disabled={!tempStartYear}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                 <SelectItem value="NONE_VALUE"><em>None</em></SelectItem>
                {months.map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label htmlFor="toYearFilter" className="block text-sm font-medium text-gray-700 mb-1">To Year</label>
            <Select
              value={tempEndYear?.toString()}
              onValueChange={(value) => {
                if (value === "NONE_VALUE") setTempEndYear(undefined);
                else setTempEndYear(value ? parseInt(value) : undefined);
              }}
              disabled={!tempStartYear || typeof tempStartMonth !== 'number'}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE_VALUE"><em>None</em></SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="toMonthFilter" className="block text-sm font-medium text-gray-700 mb-1">To Month</label>
            <Select
              value={tempEndMonth?.toString()}
              onValueChange={(value) => {
                if (value === "NONE_VALUE") setTempEndMonth(undefined);
                else setTempEndMonth(value ? parseInt(value) : undefined);
              }}
              disabled={!tempEndYear}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE_VALUE"><em>None</em></SelectItem>
                {months.map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 items-end sm:col-span-2 md:col-span-1 lg:col-span-1 xl:col-span-1 justify-start pt-5">
            <Button onClick={handleApplyFilters} className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white">Apply</Button>
            <Button variant="outline" onClick={handleClearFilters} className="w-full sm:w-auto">Clear</Button>
          </div>
        </div>
      </div>

      {renderMainContent()}
    </div>
  );
};

const EnquiriesPage: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <EnquiriesPageContent />
    </QueryClientProvider>
  );
};

export default EnquiriesPage;