import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow
});

function LocationMarker({ position, setPosition }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
}

function FlyToCurrentLocation({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo(position, 15);
        }
    }, [position, map]);
    return null;
}

const MapSelector = ({ isOpen, onClose, onSelect, initialPosition }) => {
    // Default to Dhaka if no position
    const defaultPos = { lat: 23.8103, lng: 90.4125 };
    const [position, setPosition] = useState(initialPosition || defaultPos);

    useEffect(() => {
        if (initialPosition) setPosition(initialPosition);
    }, [initialPosition]);

    const handleUseMyLocation = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                (err) => alert("Could not fetch location. Please ensure location permissions are enabled.")
            );
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 9999
        }}>
            <div style={{
                background: 'white', padding: '20px', borderRadius: '15px',
                width: '90%', maxWidth: '600px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, color: '#2c3e50' }}>📍 Select Location</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#7f8c8d' }}>&times;</button>
                </div>

                <div style={{ height: '350px', width: '100%', borderRadius: '10px', overflow: 'hidden', marginBottom: '15px' }}>
                    <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker position={position} setPosition={setPosition} />
                        <FlyToCurrentLocation position={position} />
                    </MapContainer>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button onClick={handleUseMyLocation} style={{ background: '#ecf0f1', color: '#2c3e50', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                        🎯 Use Current GPS
                    </button>
                    <button onClick={() => { onSelect(position); onClose(); }} style={{ background: '#e67e22', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Confirm Location
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MapSelector;
