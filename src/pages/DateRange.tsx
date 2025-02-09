import React, { useState, useEffect } from 'react';
import { format, subDays, differenceInDays, addDays, parseISO } from 'date-fns';
import { ChevronDownIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface DateRangeDropdownProps {
  selectedOption: string;
  onDateRangeChange: (startDate: string, endDate: string, selectedOption: string) => void;
  startDate: string;
  endDate: string;
}

const DateRangeDropdown: React.FC<DateRangeDropdownProps> = ({ 
  selectedOption, 
  onDateRangeChange, 
  startDate: propStartDate, 
  endDate: propEndDate 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>(parseISO(propStartDate));
  const [endDate, setEndDate] = useState<Date>(parseISO(propEndDate));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);

  const options = [
    'Today',
    'Last 7 Days',
    'Last 15 Days',
    'Last 30 Days',
    'Custom Date Range',
  ];

  useEffect(() => {
    setStartDate(parseISO(propStartDate));
    setEndDate(parseISO(propEndDate));
  }, [propStartDate, propEndDate]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleDateSelect = (newDate: Date | undefined, isStartDate: boolean) => {
    if (!newDate) return;

    let newStartDate = isStartDate ? newDate : startDate;
    let newEndDate = isStartDate ? endDate : newDate;

    if (newStartDate && newEndDate) {
      if (newStartDate > newEndDate) {
        if (isStartDate) {
          newEndDate = newStartDate;
        } else {
          newStartDate = newEndDate;
        }
      }

      const daysDifference = differenceInDays(newEndDate, newStartDate);
      if (daysDifference > 20) {
        if (isStartDate) {
          newEndDate = addDays(newStartDate, 20);
        } else {
          newStartDate = addDays(newEndDate, -20);
        }
        setErrorMessage("Date range automatically adjusted to 20 days.");
      } else {
        setErrorMessage(null);
      }
    }

    setStartDate(newStartDate);
    setEndDate(newEndDate);
    setIsStartDateOpen(false);
    setIsEndDateOpen(false);

    onDateRangeChange(
      format(newStartDate, 'yyyy-MM-dd'),
      format(newEndDate, 'yyyy-MM-dd'),
      'Custom Date Range'
    );
  };

  const handleOptionClick = (option: string) => {
    setIsOpen(false);

    if (option === 'Custom Date Range') {
      setStartDate(parseISO(propStartDate));
      setEndDate(parseISO(propEndDate));
      setErrorMessage(null);
    } else {
      const today = new Date();
      let start = today;
      let end = today;

      switch (option) {
        case 'Today':
          break;
        case 'Last 7 Days':
          start = subDays(today, 6);
          break;
        case 'Last 15 Days':
          start = subDays(today, 14);
          break;
        case 'Last 30 Days':
          start = subDays(today, 29);
          break;
      }

      setStartDate(start);
      setEndDate(end);
      onDateRangeChange(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'), option);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <div>
        <Button
          variant="outline"
          onClick={toggleDropdown}
          className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500"
        >
          {selectedOption}
          <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
        </Button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div
            className="py-1"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="options-menu"
          >
            {options.map((option) => (
              <a
                key={option}
                href="#"
                className={`${
                  option === selectedOption
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700'
                } block px-4 py-2 text-sm`}
                role="menuitem"
                onClick={() => handleOptionClick(option)}
              >
                {option}
              </a>
            ))}
          </div>
        </div>
      )}

      {selectedOption === 'Custom Date Range' && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Start date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => handleDateSelect(date, true)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>End date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => handleDateSelect(date, false)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mt-2 text-yellow-600 text-sm">{errorMessage}</div>
      )}
    </div>
  );
};

export default DateRangeDropdown;