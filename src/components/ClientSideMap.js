// ClientSideMap.js
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const ClientSideMap = () => (
    <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '400px' }}>
        <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {/* Your markers here */}
    </MapContainer>
);

export default ClientSideMap;
