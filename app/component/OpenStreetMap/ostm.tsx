'use client'

import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { LatLngExpression, LatLngTuple } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import io from 'socket.io-client'

interface MarkerData {
  username: string
  latitude: number
  longitude: number
}

const OpenStreetmap: React.FC<{ markers: MarkerData[] }> = ({ markers }) => {
  const [center, setCenter] = useState<LatLngExpression>({ lat: 30.7652305, lng: 76.7846207 }) // Default fallback location
  const [userLocation, setUserLocation] = useState<LatLngExpression | null>(null)
  const [username, setUsername] = useState<string>('')

  const ZOOM_LEVEL = 17

  // Create a socket connection to the correct port (3001)
  const socket = io('http://localhost:3001')

  useEffect(() => {
    // Assuming the username is available after the user logs in or signs up
    const storedUsername = localStorage.getItem('username') || 'defaultUser' // Retrieve from localStorage or similar storage
    setUsername(storedUsername)

    // Emit the location to the server every time the location is updated
    if (userLocation && 'lat' in userLocation && 'lng' in userLocation) {  // Check if it's an object with lat and lng
      console.log('Emitting location update', userLocation)
      socket.emit('locationUpdate', {
        username: "user123",
        latitude: userLocation.lat,
        longitude: userLocation.lng,
      })
    }

    // Cleanup on unmount to avoid memory leaks
    return () => {
      console.log('Disconnecting from socket')
      socket.disconnect()
    }
  }, [userLocation])

  useEffect(() => {
    // Get the user's location using the browser's geolocation API with high accuracy
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc = { lat: position.coords.latitude, lng: position.coords.longitude }
          setUserLocation(userLoc)
          setCenter(userLoc) 
        },
        () => {
          setUserLocation({ lat: 40.7128, lng: -74.0060 }) 
        },
        {
          enableHighAccuracy: true,  
          timeout: 5000,             
          maximumAge: 0              
        }
      )
    }
  }, [])

  // Custom marker icon
  const customIcon = new L.Icon({
    iconUrl: 'https://www.maptive.com/wp-content/uploads/2020/10/Marker-Color-_-Grouping-Tool-2.svg',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, 32],
  })

  return (
    <MapContainer center={center} zoom={ZOOM_LEVEL} style={{ height: '500px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {/* Render markers for friends */}
      {markers.map((marker, index) => (
        <Marker key={index} position={[marker.latitude, marker.longitude]} icon={customIcon}>
          <Popup>
            {marker.username} <br />
            Latitude: {marker.latitude}, Longitude: {marker.longitude}
          </Popup>
        </Marker>
      ))}

      {/* Render user's own location */}
      {userLocation && 'lat' in userLocation && 'lng' in userLocation && (
  <Marker position={userLocation} icon={customIcon}>
    <Popup>
      Your location <br />
      Latitude: {userLocation.lat}, Longitude: {userLocation.lng}
    </Popup>
  </Marker>
)}
    </MapContainer>
  )
}

export default OpenStreetmap
