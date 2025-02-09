import React from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface SortIconProps {
    sortOrder: 'asc' | 'desc';
}

const SortIcon: React.FC<SortIconProps> = ({ sortOrder }) => {
    return sortOrder === 'asc' ? (
        <ChevronUpIcon className="h-4 w-4 inline-block ml-1" />
    ) : (
        <ChevronDownIcon className="h-4 w-4 inline-block ml-1" />
    );
};

export default SortIcon;