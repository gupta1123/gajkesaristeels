import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FiUsers, FiBarChart2, FiMap, FiPieChart, FiDollarSign, FiTrendingUp } from 'react-icons/fi';
import NewCustomersReport from '../components/NewCustomersReport';
import SalesPerformanceReport from '../components/SalesPerformanceReport';
import VisitFrequencyReport from '../components/VisitFrequencyReport';
import CustomerTypeAnalysisReport from '../components/CustomerTypeAnalysisReport';
import DailyPricingReport from '../components/DailyPricingReport';
import TotalSalesReportComponent from '../components/TotalSalesReportComponent';
import './Report.css'

const Reports = () => {
    const [activeTab, setActiveTab] = useState('newCustomers');

    const tabs = [
        { id: 'newCustomers', label: 'New Customers Acquired', icon: FiUsers, description: 'View statistics on new customers acquired by employees' },
        { id: 'salesPerformance', label: 'Sales Performance', icon: FiBarChart2, description: 'Analyze sales performance across different products and regions' },
        { id: 'visitFrequency', label: 'Visit Frequency', icon: FiMap, description: 'Analyze visit frequency, intent level, and monthly sales by employee' },
        { id: 'customerTypeAnalysis', label: 'Customer Type Analysis', icon: FiPieChart, description: 'Analyze customer types for each employee' },
        {
            id: 'totalSalesReport',
            label: 'Total Sales Report',
            icon: FiTrendingUp,
            description: 'View total sales for a specific store within a date range.'
        }
    ];

    return (
        <div className="container-reports mx-auto px-4 py-4">
            <div className="container-header-reports">
                <h1 className="text-2xl font-bold mb-4 text-gray-800">Reports</h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {tabs.map((tab) => (
                    <Card
                        key={tab.id}
                        className={`report-card cursor-pointer ${activeTab === tab.id ? 'active-card' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <CardContent className="card-glass-effect">
                            <div className="report-card-icon">
                                <tab.icon />
                            </div>
                            <h3 className="report-card-title">{tab.label}</h3>
                            <p className="report-card-description">{tab.description}</p>
                            <div className="card-shine"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="report-content">
                {activeTab === 'newCustomers' && <NewCustomersReport />}
                {activeTab === 'salesPerformance' && <SalesPerformanceReport />}
                {activeTab === 'visitFrequency' && <VisitFrequencyReport />}
                {activeTab === 'customerTypeAnalysis' && <CustomerTypeAnalysisReport />}
                {activeTab === 'totalSalesReport' && <TotalSalesReportComponent />}
                {/* {activeTab === 'dailyPricing' && <DailyPricingReport />} */}
            </div>
        </div>
    );
};

export default Reports;