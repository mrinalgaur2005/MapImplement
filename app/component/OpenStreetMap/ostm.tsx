'use client'

import React from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

interface MarkerData {
  student_id: string
  latitude: number
  longitude: number
}

const OpenStreetmap: React.FC<{ markers: MarkerData[] }> = ({ markers }) => {
  const [center, setCenter] = React.useState<LatLngExpression>({ lat: 30.7652305, lng: 76.7846207 }) // Default fallback location
  const ZOOM_LEVEL = 17

  // Custom marker icon
  const defaultIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
  

  React.useEffect(() => {
    console.log("Markers updated:", markers); // Add this line to check markers
    if (markers.length > 0) {
      const lastMarker = markers[markers.length - 1];
      setCenter({ lat: lastMarker.latitude, lng: lastMarker.longitude });
    }
  }, [markers]);// This will run whenever markers are updated

  return (
    <MapContainer center={center} zoom={ZOOM_LEVEL} style={{ height: '500px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {/* Render markers */}
      {markers.map((marker, index) => (
        <Marker key={index} position={[marker.latitude, marker.longitude]} icon={defaultIcon}>
          <Popup>
            Student ID: {marker.student_id} <br />
            Latitude: {marker.latitude}, Longitude: {marker.longitude}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

export default OpenStreetmap
