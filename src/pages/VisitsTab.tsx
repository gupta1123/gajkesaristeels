// VisitsTab.tsx
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FaCalendarAlt } from 'react-icons/fa';
import { format } from "date-fns";
import './VisitsTab.css';

interface Visit {
    id: number;
    storeName: string;
    visit_date: string;
    purpose: string;
    scheduledStartTime: string;
    scheduledEndTime: string;
}

const VisitsTab: React.FC = () => {
    const token = useSelector((state: RootState) => state.auth.token);
    const [visits, setVisits] = useState<Visit[]>([]);

    useEffect(() => {
        const fetchVisits = async () => {
            try {
                const response = await fetch('https://api.gajkesaristeels.in/visit/getByDateRangeAndEmployeeStats', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                setVisits(data.visitDto);
            } catch (error) {
                console.error("Error fetching visits:", error);
            }
        };

        if (token) {
            fetchVisits();
        }
    }, [token]);

    return (
        <div className="visits-container">
            <div className="visits-header">
                <div className="filter-group">
                    <select>
                        <option>All Time</option>
                        {/* Add more options here */}
                    </select>
                    <select>
                        <option>All Types</option>
                        {/* Add more options here */}
                    </select>
                </div>
            </div>
            <div className="visits-grid">
                {visits.map((visit) => (
                    <Card key={visit.id} className="visit-card">
                        <CardContent>
                            <div className="store-name">{visit.storeName}</div>
                            <div className="visit-date">
                                <FaCalendarAlt className="icon" />
                                <span>{format(new Date(visit.visit_date), 'yyyy-MM-dd')}</span>
                            </div>
                            <div className="visit-type">
                                Type: {visit.purpose}
                            </div>
                            <div className="visit-duration">
                                Duration: {format(new Date(visit.scheduledEndTime).getTime() - new Date(visit.scheduledStartTime).getTime(), 'h:mm')}
                            </div>
                            <Badge className="status-badge">Completed</Badge>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default VisitsTab;