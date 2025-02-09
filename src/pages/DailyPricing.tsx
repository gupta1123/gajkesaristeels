import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ClipLoader } from 'react-spinners';
import dayjs from 'dayjs';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import './DailyPricing.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Brand {
    id: number;
    brandName: string;
    price: number;
    city: string;
    state: string;
    employeeDto: {
        id: number;
        firstName: string;
        lastName: string;
        city: string;
    };
    metric: string;
    createdAt: string;
    updatedAt: string;
}

const DailyPricingPage = () => {
    const [brandData, setBrandData] = useState<Brand[]>([]);
    const [previousDayData, setPreviousDayData] = useState<Brand[]>([]);
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [cities, setCities] = useState<string[]>([]);
    const [gajkesariRate, setGajkesariRate] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [showGajkesariRate, setShowGajkesariRate] = useState(false);
    const token = useSelector((state: RootState) => state.auth.token);
    const role = useSelector((state: RootState) => state.auth.role);
    const teamId = useSelector((state: RootState) => state.auth.teamId);
    const username = useSelector((state: RootState) => state.auth.username);

    useEffect(() => {
        fetchData();
    }, [selectedCity, selectedDate]);

    const fetchData = async () => {
        setIsLoading(true);
        await Promise.all([fetchBrandData(), fetchPreviousDayData()]);
        setIsLoading(false);
    };

    const fetchBrandData = useCallback(async () => {
        try {
            const formattedStartDate = dayjs(selectedDate).startOf('day').format('YYYY-MM-DD');
            const formattedEndDate = dayjs(selectedDate).endOf('day').format('YYYY-MM-DD');

            const url = role === 'MANAGER'
                ? `https://api.gajkesaristeels.in/brand/getByTeamAndDate?id=${teamId}&start=${formattedStartDate}&end=${formattedEndDate}`
                : `https://api.gajkesaristeels.in/brand/getByDateRange?start=${formattedStartDate}&end=${formattedEndDate}`;

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data: Brand[] = await response.json();
            setBrandData(data);

            const uniqueCities = Array.from(new Set(data.map(brand =>
                brand.brandName.toLowerCase() === 'gajkesari' ? brand.city : brand.employeeDto?.city
            ).filter(city => city && city.trim() !== "")));
            setCities(uniqueCities);

            if (!selectedCity && uniqueCities.length > 0) {
                setSelectedCity(uniqueCities[0]);
            }

            const gajkesariBrand = data.find(brand => brand.brandName.toLowerCase() === 'gajkesari');
            if (gajkesariBrand) {
                setGajkesariRate(gajkesariBrand.price);
                setShowGajkesariRate(gajkesariBrand.employeeDto?.firstName === 'Test' && gajkesariBrand.employeeDto?.lastName === '1');
            } else {
                setGajkesariRate(0);
                setShowGajkesariRate(false);
            }
        } catch (error) {
            console.error('Error fetching brand data:', error);
            setBrandData([]);
            setGajkesariRate(0);
            setShowGajkesariRate(false);
        }
    }, [role, selectedDate, teamId, token, selectedCity]);

    const fetchPreviousDayData = useCallback(async () => {
        const previousDay = dayjs(selectedDate).subtract(1, 'day').format('YYYY-MM-DD');
        try {
            const url = role === 'MANAGER'
                ? `https://api.gajkesaristeels.in/brand/getByTeamAndDate?id=${teamId}&start=${previousDay}&end=${previousDay}`
                : `https://api.gajkesaristeels.in/brand/getByDateRange?start=${previousDay}&end=${previousDay}`;

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data: Brand[] = await response.json();
            setPreviousDayData(data);
        } catch (error) {
            console.error('Error fetching previous day data:', error);
            setPreviousDayData([]);
        }
    }, [role, selectedDate, teamId, token]);

    const filteredBrands = brandData.filter(brand =>
        brand.brandName.toLowerCase() === 'gajkesari' ? brand.city === selectedCity : brand.employeeDto?.city === selectedCity
    );

    const chartData = {
        labels: filteredBrands.map(brand => brand.brandName).concat(['Gajkesari']),
        datasets: [
            {
                label: 'Competitor Prices (₹/ton)',
                data: filteredBrands.map(brand => brand.price).concat([gajkesariRate]),
                backgroundColor: filteredBrands.map(() => 'rgba(0, 0, 0, 0.6)').concat(['rgba(128, 128, 128, 0.6)']),
                borderColor: filteredBrands.map(() => 'rgba(0, 0, 0, 1)').concat(['rgba(128, 128, 128, 1)']),
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (tickValue: string | number) => {
                        const value = typeof tickValue === 'number' ? tickValue : parseFloat(tickValue);
                        return `₹${value}`;
                    },
                },
            },
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => `₹${context.parsed.y}/ton`,
                },
            },
        },
    };

    return (
        <div className="container-pricing mx-auto py-8 px-4 max-w-6xl">
            <Card className="shadow-lg">
                <CardHeader className="bg-white">
                    <CardTitle className="text-3xl font-bold text-black">Pricing Report</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex space-x-4">
                            <Select value={selectedCity} onValueChange={setSelectedCity}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Select City" />
                                </SelectTrigger>
                                <SelectContent>
                                    {cities.map((city) => (
                                        <SelectItem key={city} value={city}>
                                            {city}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-[150px]"
                            />
                        </div>
                        {showGajkesariRate && gajkesariRate > 0 && (
                            <div className="text-right">
                                <h2 className="text-2xl">
                                    Gajkesari Rate: <span className="font-bold">₹{gajkesariRate}/ton</span>
                                </h2>
                            </div>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <ClipLoader color="#000000" size={50} />
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto mb-8">
                                <table className="w-full border-collapse border-none shadow-lg rounded-lg overflow-hidden">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="p-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Competitor</th>
                                            <th className="p-4 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">Price (₹/ton)</th>
                                            <th className="p-4 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">Field Officer</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredBrands.map((brand) => (
                                            <tr key={brand.id} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                                                <td className="p-4 whitespace-nowrap text-sm font-medium text-gray-900">{brand.brandName}</td>
                                                <td className="p-4 whitespace-nowrap text-sm text-gray-500 text-right">₹{brand.price.toFixed(2)}</td>
                                                <td className="p-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                    {brand.brandName.toLowerCase() === 'gajkesari'
                                                        ? brand.city
                                                        : brand.employeeDto
                                                            ? `${brand.employeeDto.firstName} ${brand.employeeDto.lastName}`
                                                            : 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="h-96">
                                <Bar data={chartData} options={chartOptions} />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default DailyPricingPage;