'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface GeoPoint {
  countryName: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  incoming: number;
  outgoing: number;
  totalBytes: number;
}

export default function GeoLocationMap({ data }: { data: GeoPoint[] }) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Safety check for data
  const safeData = Array.isArray(data) ? data : [];
  
  if (!isMounted) return null;
  
  return (
    <MapContainer 
      center={[20, 0]} 
      zoom={2} 
      style={{ height: '100%', width: '100%', borderRadius: '0.375rem' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {safeData.map((point, index) => (
        <CircleMarker 
          key={index}
          center={[point.latitude, point.longitude]}
          radius={Math.log(point.totalBytes / 1000000) * 4} // Size based on traffic volume
          fillColor="#ff6384"
          color="#ff6384"
          weight={1}
          opacity={0.8}
          fillOpacity={0.6}
        >
          <Tooltip direction="top" offset={[0, -5]} opacity={1}>
            <div>
              <strong>{point.countryName}</strong>
              <div>Incoming: {(point.incoming / (1024 * 1024)).toFixed(2)} MB</div>
              <div>Outgoing: {(point.outgoing / (1024 * 1024)).toFixed(2)} MB</div>
              <div>Total: {(point.totalBytes / (1024 * 1024)).toFixed(2)} MB</div>
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
} 