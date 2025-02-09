import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import maplibregl, { Map as MapLibreMap, NavigationControl, Marker, Popup } from 'maplibre-gl';
import { RootState } from '../store'; 
import Select from 'react-select';
import 'maplibre-gl/dist/maplibre-gl.css';
import styles from './EmployeeLocationTracking.module.css';

interface Employee {
    id: number;
    firstName: string;
    lastName: string;
}

interface EmployeeLocation {
    id: number;
    empId: number;
    empName: string;
    latitude: number;
    longitude: number;
    updatedAt: string;
    updatedTime: string;
}

interface EmployeeOption {
    value: number;
    label: string;
}

const API_BASE_URL = 'https://api.gajkesaristeels.in';
const MAP_STYLE_URL = 'https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json';
const OLA_CLIENT_ID = '7ba2810b-f481-4e31-a0c6-d436b0c7c1eb';
const OLA_CLIENT_SECRET = 'klymi04gaquWCnpa57hBEpMXR7YPhkLD';

const EmployeeLocationTracking: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeLocation | null>(null);
    const [error, setError] = useState<string | null>(null);
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<MapLibreMap | null>(null);
    const marker = useRef<maplibregl.Marker | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);

    const token = useSelector((state: RootState) => state.auth.token);

    useEffect(() => {
        if (token) {
            fetchEmployees();
            getAccessToken();
        } else {
            setError('Not authenticated. Please log in.');
        }

        return () => {
            if (map.current) {
                map.current.remove();
            }
        };
    }, [token]);

    useEffect(() => {
        if (accessToken) {
            initializeMap();
        }
    }, [accessToken]);

    const getAccessToken = async () => {
        try {
            const response = await axios.post(
                'https://account.olamaps.io/realms/olamaps/protocol/openid-connect/token',
                new URLSearchParams({
                    grant_type: 'client_credentials',
                    scope: 'openid',
                    client_id: OLA_CLIENT_ID,
                    client_secret: OLA_CLIENT_SECRET
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );
            setAccessToken(response.data.access_token);
        } catch (error) {
            console.error('Error getting access token:', error);
            setError('Failed to authenticate with Ola Maps.');
        }
    };

    const initializeMap = async () => {
        if (mapContainer.current && !map.current && accessToken) {
            try {
                const response = await axios.get(MAP_STYLE_URL, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });

                const style = response.data;

                map.current = new MapLibreMap({
                    container: mapContainer.current,
                    style: style,
                    center: [78.9629, 20.5937], // Default to India's center
                    zoom: 4,
                    transformRequest: (url, resourceType) => {
                        if (url.startsWith('https://api.olamaps.io')) {
                            return {
                                url: url,
                                headers: {
                                    'Authorization': `Bearer ${accessToken}`
                                },
                            };
                        }
                    },
                });

                map.current.addControl(new NavigationControl(), 'top-left');
            } catch (error) {
                console.error('Error initializing map:', error);
                setError('Failed to load the map. Please try again later.');
            }
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/employee/getAll`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (Array.isArray(response.data)) {
                setEmployees(response.data.sort((a, b) => a.firstName.localeCompare(b.firstName)));
            } else {
                setError('Unexpected data format received from server');
            }
        } catch (error) {
            setError('Failed to fetch employees. Please try again later.');
        }
    };

    const fetchEmployeeLocation = async (id: number) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/employee/getLiveLocation?id=${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedEmployee(response.data);
            updateMarker(response.data);
        } catch (error) {
            setError('Failed to fetch employee location. Please try again.');
        }
    };

    const formatDateTime = (date: string, time: string) => {
        const dateObj = new Date(`${date}T${time}`);
        return dateObj.toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    const updateMarker = (employeeLocation: EmployeeLocation) => {
        if (map.current) {
            if (marker.current) {
                marker.current.remove();
            }

            marker.current = new Marker()
                .setLngLat([employeeLocation.longitude, employeeLocation.latitude])
                .addTo(map.current);

            const formattedDateTime = formatDateTime(employeeLocation.updatedAt, employeeLocation.updatedTime);

            const popup = new Popup({ offset: 25 }).setHTML(
                `<div style="font-family: Arial, sans-serif; padding: 10px;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">${employeeLocation.empName}</h3>
                    <p style="margin: 0; color: #666;">
                        <strong>Last updated:</strong><br>
                        ${formattedDateTime}
                    </p>
                </div>`
            );

            marker.current.setPopup(popup);

            map.current.flyTo({
                center: [employeeLocation.longitude, employeeLocation.latitude],
                zoom: 12,
                essential: true
            });
        }
    };

    const employeeOptions: EmployeeOption[] = employees.map(emp => ({
        value: emp.id,
        label: `${emp.firstName} ${emp.lastName}`
    }));

    if (!token) {
        return <div>Please log in to view employee locations.</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.sidebar}>
                <h2 className={styles.title}>Employee Locations</h2>
                {error && <p className={styles.error}>{error}</p>}
                <Select
                    options={employeeOptions}
                    onChange={(option) => option && fetchEmployeeLocation(option.value)}
                    placeholder="Select an employee"
                    className={styles.select}
                />
            </div>
            <div ref={mapContainer} className={styles.mapContainer} />
        </div>
    );
};

export default EmployeeLocationTracking;