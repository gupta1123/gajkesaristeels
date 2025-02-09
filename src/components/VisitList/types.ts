export interface Visit {
    id: number;
    storeId: number;
    storeName: string;
    storeLatitude: number;
    storeLongitude: number;
    employeeId: number;
    employeeName: string;
    visit_date: string;
    intent: number | null;
    scheduledStartTime: string | null;
    scheduledEndTime: string | null;
    visitLatitude: number | null;
    visitLongitude: number | null;
    checkinLatitude: number | null;
    checkinLongitude: number | null;
    checkoutLatitude: number | null;
    checkoutLongitude: number | null;
    checkinDate: string | null;
    checkoutDate: string | null;
    checkinTime: string | null;
    checkoutTime: string | null;
    purpose: string;
    outcome: string | null;
    feedback: string | null;
    createdAt: string | null;
    createdTime: string | null;
    updatedAt: string | null;
    updatedTime: string | null;
    storePrimaryContact: string; // Add this property
    district: string; // Add this property
    subDistrict: string; // Add this property
}
