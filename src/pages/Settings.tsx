'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import Salary from './Salary';
import Allowance from './Allowance';
import WorkingDays from './WorkingDays';
import Teams from './Teams';
import TargetComponent from '@/components/Target';
import Approval from './Approval';
import { RootState } from '../store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import './Settings.css';

export default function Settings() {
    const [activeTab, setActiveTab] = useState('salary');
    const authToken = useSelector((state: RootState) => state.auth.token);

    const tabs = [
        { id: 'salary', label: 'Salary', component: <Salary authToken={authToken || ''} /> },
        { id: 'allowance', label: 'Allowance', component: <Allowance authToken={authToken || ''} /> },
        { id: 'workingDays', label: 'Working Days', component: <WorkingDays authToken={authToken || ''} /> },
        { id: 'team', label: 'Team', component: <Teams authToken={authToken || ''} /> },
        { id: 'target', label: 'Target', component: <TargetComponent /> },
        { id: 'approval', label: 'Approval', component: <Approval authToken={authToken || ''} /> },
    ];

    return (
        <div className="settingsContainer">
            <Card className="new w-full max-w-6xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-center">
                        Settings
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="tabHeader">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                className={`tabButton ${activeTab === tab.id ? 'activeTab' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="tabContent">
                        {tabs.find(tab => tab.id === activeTab)?.component}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}