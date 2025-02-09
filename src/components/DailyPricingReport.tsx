import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RootState } from '../store';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';

type BrandPrice = {
    id: number;
    brandName: string;
    price: number;
    city: string;
    createdAt: string;
};

const DailyPricingReport: React.FC = () => {
    const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [pricingData, setPricingData] = useState<BrandPrice[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [cities, setCities] = useState<string[]>([]);
    const token = useSelector((state: RootState) => state.auth.token);

    useEffect(() => {
        fetchPricingData();
    }, []);

    const fetchPricingData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get<BrandPrice[]>(
                'https://api.gajkesaristeels.in/brand/getByDateRange',
                {
                    params: { start: startDate, end: endDate },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setPricingData(response.data);
            const uniqueCities = Array.from(new Set(response.data.map(item => item.city)));
            setCities(uniqueCities);
            if (uniqueCities.length > 0) {
                setSelectedCity(uniqueCities[0]);
            }
        } catch (err) {
            console.error('Error fetching pricing data:', err);
            setError('Failed to fetch pricing data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'startDate') setStartDate(value);
        if (name === 'endDate') setEndDate(value);
    };

    const handleCityChange = (value: string) => {
        setSelectedCity(value);
    };

    const filteredData = pricingData.filter(item => item.city === selectedCity);

    const groupedData = filteredData.reduce((acc, item) => {
        const date = item.createdAt.split('T')[0];
        if (!acc[date]) {
            acc[date] = {};
        }
        acc[date][item.brandName] = item.price;
        return acc;
    }, {} as Record<string, Record<string, number>>);

    const chartData = Object.entries(groupedData).map(([date, brands]) => ({
        date,
        ...brands
    }));

    const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
        if (active && payload && payload.length) {
            const sortedPayload = [...payload].sort((a, b) => (b.value as number) - (a.value as number));
            return (
                <div className="custom-tooltip bg-white p-4 border border-gray-200 rounded shadow">
                    <p className="label font-bold">{`Date: ${label}`}</p>
                    {sortedPayload.map((entry, index) => (
                        <p key={`item-${index}`} style={{ color: entry.color }}>
                            {`${entry.name}: ${entry.value}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const renderChart = () => {
        if (chartData.length === 0) {
            return <p className="text-center text-gray-500">No data available for the selected city and date range.</p>;
        }

        const brandNames = Array.from(new Set(filteredData.map(item => item.brandName)));
        const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

        return (
            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {brandNames.map((brand, index) => (
                        <Line
                            key={brand}
                            type="monotone"
                            dataKey={brand}
                            stroke={colors[index % colors.length]}
                            activeDot={{ r: 8 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        );
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-end space-y-4 sm:space-y-0 sm:space-x-4">
                        <div className="w-full sm:w-auto">
                            <label className="block text-sm font-medium mb-1">Start Date</label>
                            <Input
                                type="date"
                                name="startDate"
                                value={startDate}
                                onChange={handleDateChange}
                            />
                        </div>
                        <div className="w-full sm:w-auto">
                            <label className="block text-sm font-medium mb-1">End Date</label>
                            <Input
                                type="date"
                                name="endDate"
                                value={endDate}
                                onChange={handleDateChange}
                            />
                        </div>
                        <div className="w-full sm:w-auto">
                            <label className="block text-sm font-medium mb-1">City</label>
                            <Select onValueChange={handleCityChange} value={selectedCity}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {cities.map((city) => (
                                        <SelectItem key={city} value={city}>
                                            {city}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={fetchPricingData}>Fetch Data</Button>
                    </div>
                </CardContent>
            </Card>

            {isLoading && (
                <Card>
                    <CardContent className="p-6">
                        <Skeleton className="w-full h-[400px]" />
                    </CardContent>
                </Card>
            )}

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {!isLoading && !error && (
                <Card>
                    <CardHeader>
                        <CardTitle>{selectedCity} - Brand Price Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {renderChart()}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default DailyPricingReport;