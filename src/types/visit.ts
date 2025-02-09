export interface Visit {
  id: number;
  employeeId: number;
  employeeFirstName: string;
  employeeLastName: string;
  employeeState: string;
  storeId: number;
  employeeName: string;
  purpose: string;
  storeName: string;
  visit_date: string;
  checkinTime: string;
  checkoutTime: string | null;
  statsDto: {
    completedVisitCount: number;
    fullDays: number;
    halfDays: number;
    absences: number;
  };
} 