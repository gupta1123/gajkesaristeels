// contexts/VisitListContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface VisitListContextType {
    filters: {
        startDate: Date | null;
        endDate: Date | null;
        employeeName: string;
    };
    setFilters: (filters: { startDate: Date | null; endDate: Date | null; employeeName: string }) => void;
}

const VisitListContext = createContext<VisitListContextType | undefined>(undefined);

export const VisitListProvider = ({ children }: { children: ReactNode }) => {
    const [filters, setFilters] = useState<VisitListContextType['filters']>({
        startDate: null,
        endDate: null,
        employeeName: '',
    });

    return (
        <VisitListContext.Provider value={{ filters, setFilters }}>
            {children}
        </VisitListContext.Provider>
    );
};

export const useVisitList = () => {
    const context = useContext(VisitListContext);
    if (!context) {
        throw new Error('useVisitList must be used within a VisitListProvider');
    }
    return context;
};
