import React, { useState, useCallback, useMemo } from 'react';
import CustomCalendar from './CustomCalendar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faCloudSun, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import styles from './AttendanceCard.module.css';

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
}

interface AttendanceCardProps {
  employee: Employee;
  attendanceData: AttendanceData[];
  selectedYear: number;
  selectedMonth: number;
  initialSummary: {
    fullDays: number;
    halfDays: number;
    absentDays: number;
  };
  onDateClick: (date: string, employeeName: string) => void;
}

const AttendanceCard: React.FC<AttendanceCardProps> = ({
  employee,
  attendanceData,
  selectedYear,
  selectedMonth,
  initialSummary,
  onDateClick,
}) => {
  const [summary, setSummary] = useState(initialSummary);

  const handleSummaryChange = useCallback(
    (newSummary: { fullDays: number; halfDays: number; absentDays: number }) => {
      setSummary(newSummary);
    },
    []
  );

  // Filter attendance for this specific employee
  const filteredAttendanceData = useMemo(
    () => attendanceData.filter((data) => data.employeeId === employee.id),
    [attendanceData, employee.id]
  );

  const employeeName = useMemo(
    () => `${employee.firstName} ${employee.lastName}`,
    [employee.firstName, employee.lastName]
  );

  const handleDateClick = useCallback(
    (date: string) => {
      onDateClick(date, employeeName);
    },
    [onDateClick, employeeName]
  );

  // Add this code where you process the attendance data
  const datesArray = attendanceData.map(item => new Date(item.checkinDate).getDate());
  console.log(`Employee: ${employeeName}`, datesArray);

  return (
    <div className={styles['info-card']}>
      <div className={styles.info}>
        <h2>{employeeName}</h2>
        <div className={styles.stats}>
          <div className={styles['stat-box']}>
            <FontAwesomeIcon icon={faSun} />
            <p>Full</p>
            <h3>{summary.fullDays}</h3>
          </div>
          <div className={styles['stat-box']}>
            <FontAwesomeIcon icon={faCloudSun} />
            <p>Half</p>
            <h3>{summary.halfDays}</h3>
          </div>
          <div className={styles['stat-box']}>
            <FontAwesomeIcon icon={faTimesCircle} />
            <p>Absent</p>
            <h3>{summary.absentDays}</h3>
          </div>
        </div>
      </div>
      <div className={styles['calendar-container']}>
        <CustomCalendar
          month={selectedMonth}
          year={selectedYear}
          attendanceData={filteredAttendanceData}
          onSummaryChange={handleSummaryChange}
          onDateClick={handleDateClick}
          employeeName={employeeName}
        />
      </div>
    </div>
  );
};

export default React.memo(AttendanceCard);
