import React from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface GeoTagProps {
    latitude: number;
    longitude: number;
}

const GeoTag: React.FC<GeoTagProps> = ({ latitude, longitude }) => {
    const openInMaps = () => {
        window.open(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`, '_blank');
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-2 bg-white hover:bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-300 transition-all duration-200"
                        onClick={openInMaps}
                    >
                        <MapPin className="h-4 w-4" />
                        <span>View on Map</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Open location in Google Maps</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default GeoTag;