// VisitCard.tsx
{/*import React from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from 'next/router';
import { Visit } from './types';

interface VisitCardProps {
    visit: Visit;
}

const VisitCard: React.FC<VisitCardProps> = ({ visit }) => {
    const { id, storeName, employeeName, visit_date, purpose } = visit;
    const router = useRouter();

    const avatarInitials = storeName
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase();

    const viewDetails = (visitId: string) => {
        router.push(`/VisitDetailPage/${visitId}`);
    };

    const getOutcomeStatus = (visit: Visit): { emoji: React.ReactNode; status: string; color: string } => {
        if (
            visit.checkinDate &&
            visit.checkinTime &&
            visit.checkoutDate &&
            visit.checkoutTime
        ) {
            return { emoji: '✅', status: 'Completed', color: 'bg-purple-100 text-purple-800' };
        } else if (visit.checkoutDate && visit.checkoutTime) {
            return { emoji: '🚪', status: 'Checked Out', color: 'bg-orange-100 text-orange-800' };
        } else if (visit.checkinDate && visit.checkinTime) {
            return { emoji: '⏳', status: 'On Going', color: 'bg-green-100 text-green-800' };
        }
        return { emoji: '📝', status: 'Assigned', color: 'bg-blue-100 text-blue-800' };
    };
    const { emoji, status, color } = getOutcomeStatus(visit);

    return (
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                        <Avatar>
                            <AvatarFallback>{avatarInitials}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="text-xl font-semibold">{storeName}</h3>
                            <p className="text-sm text-gray-500">{employeeName}</p>
                        </div>
                    </div>
                    <Badge className={`${color} px-3 py-1 rounded-full font-semibold`}>
                        {emoji} {status}
                    </Badge>
                </div>
                <Separator className="my-4" />
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                        <Calendar size={16} />
                        <span>{visit_date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Clock size={16} />
                        <span>{visit_date}</span>
                    </div>
                    <div className="col-span-2 flex items-center space-x-2">
                        <MapPin size={16} />
                        <span>{storeName}</span>
                    </div>
                </div>
                <p className="text-gray-600 mt-4">
                    <strong>Purpose:</strong> {purpose}
                </p>
            </CardContent>
            <CardFooter className="flex justify-between items-center p-6">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <Button
                                variant="outline"
                                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                                onClick={() => viewDetails(id)}
                            >
                                View Details
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-sm">
                                View full details of the visit, including notes and action items.
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </CardFooter>
        </Card>
    );
};

export default VisitCard;*/}