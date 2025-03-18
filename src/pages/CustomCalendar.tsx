import React, { useEffect, useRef } from 'react';
import './CustomCalendar.css';

interface CustomCalendarProps {
  month: number;
  year: number;
  attendanceData: {
    employeeId: number;
    attendanceStatus: 'full day' | 'half day' | 'Absent';
    checkinDate: string;
    checkoutDate: string;
  }[];
  onSummaryChange: (summary: { fullDays: number; halfDays: number; absentDays: number }) => void;
  onDateClick: (date: string, employeeName: string) => void;
  employeeName: string;
}

const CustomCalendar: React.FC<CustomCalendarProps> = ({
  month,
  year,
  attendanceData,
  onSummaryChange,
  onDateClick,
  employeeName,
}) => {
  const datesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderCalendar = () => {
      if (datesRef.current) {
        datesRef.current.innerHTML = '';

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let fullDays = 0;
        let halfDays = 0;
        let absentDays = 0;

        // Render empty slots for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
          const emptyDiv = document.createElement('div');
          emptyDiv.classList.add('empty');
          datesRef.current.appendChild(emptyDiv);
        }

        // Render each day of the month
        for (let i = 1; i <= daysInMonth; i++) {
          const dateDiv = document.createElement('div');
          dateDiv.textContent = i.toString();

          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
          const date = new Date(year, month, i);

          // Find an attendance record (if any) for this date
          const attendanceRecord = attendanceData.find((data) => {
            // Extract just the date part (YYYY-MM-DD) from the checkinDate
            const checkinDatePart = data.checkinDate.split('T')[0];
            return checkinDatePart === dateKey;
          });
          
          const attendanceStatus = attendanceRecord?.attendanceStatus;

          const tooltip = document.createElement('span');
          tooltip.classList.add('calendar-tooltip');

          // Priority: if there's an attendance record, use it
          if (attendanceStatus) {
            dateDiv.classList.add(attendanceStatus.toLowerCase().replace(' ', '-'));
            tooltip.textContent = ` ${attendanceStatus}`;

            if (attendanceStatus === 'full day') {
              fullDays++;
            } else if (attendanceStatus === 'half day') {
              halfDays++;
            } else if (attendanceStatus === 'Absent') {
              absentDays++;
            }
          }
          // Otherwise, if it's Sunday and no attendance record, default to "full day"
          else if (date.getDay() === 0) {
            dateDiv.classList.add('full-day');
            tooltip.textContent = 'Full Day';
            fullDays++;
          }

          dateDiv.appendChild(tooltip);

          // Tooltip positioning on mouseover
          dateDiv.addEventListener('mouseover', () => {
            const rect = dateDiv.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            const calendarRect = datesRef.current!.getBoundingClientRect();

            // Reset styles
            tooltip.style.left = '';
            tooltip.style.right = '';
            tooltip.style.transform = '';

            // Check if tooltip goes beyond the left edge of the calendar
            if (rect.left - tooltipRect.width / 2 < calendarRect.left) {
              tooltip.style.left = '0';
              tooltip.style.transform = 'translateX(0)';
            }
            // Check if tooltip goes beyond the right edge of the calendar
            else if (rect.right + tooltipRect.width / 2 > calendarRect.right) {
              tooltip.style.right = '0';
              tooltip.style.left = 'auto';
              tooltip.style.transform = 'translateX(0)';
            }
            // Center the tooltip if it fits
            else {
              tooltip.style.left = '50%';
              tooltip.style.transform = 'translateX(-50%)';
            }
          });

          // Handle date click
          dateDiv.addEventListener('click', () => {
            onDateClick(dateKey, employeeName);
          });

          datesRef.current.appendChild(dateDiv);
        }

        // Update the summary in the parent
        onSummaryChange({ fullDays, halfDays, absentDays });
      }
    };

    renderCalendar();
  }, [month, year, attendanceData, onSummaryChange, employeeName, onDateClick]);

  return (
    <div className="custom-calendar">
      <div className="calendar-days">
        <div>S</div>
        <div>M</div>
        <div>T</div>
        <div>W</div>
        <div>T</div>
        <div>F</div>
        <div>S</div>
      </div>
      <div className="calendar-dates" ref={datesRef}></div>
    </div>
  );
};

export default CustomCalendar;
