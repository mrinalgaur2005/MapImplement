'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { v4 as uuidv4 } from 'uuid'

interface MarkerData {
  uuid: string
  student_id: string
  latitude: number
  longitude: number
}

const OpenStreetmap: React.FC = () => {
  const [center, setCenter] = useState<LatLngExpression>({ lat: 30.7652305, lng: 76.7846207 }) 
  const [userLocation, setUserLocation] = useState<LatLngExpression | null>(null)
  const [markers, setMarkers] = useState<MarkerData[]>([])
  const [studentId, setStudentId] = useState<string>('') 
  const wsRef = useRef<WebSocket | null>(null) 

  const userLocationRef = useRef<LatLngExpression | null>(null); // UseRef to store userLocation
  const ZOOM_LEVEL = 17

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3000')
    wsRef.current = socket 

    socket.onopen = () => {
      console.log('Connected to WebSocket server')
    }

    socket.onmessage = (event) => {
      try {
        console.log('Received data:', event.data)
        const data = JSON.parse(event.data)

        if (data.latitudeData.length !== 0) {
          const markersWithUUID = data.latitudeData.map((marker: any) => ({
            ...marker,
            uuid: uuidv4(),
          }))
          setMarkers((prevMarkers) => [...prevMarkers, ...markersWithUUID])

          console.log(`ws state is ${wsRef.current?.readyState}`);
          
          console.log(userLocation);

          // Ensure the location is available before sending
          if (wsRef.current?.readyState === WebSocket.OPEN && userLocationRef.current) {
            const locationData = {
              student_id: studentId,
              latitude: userLocationRef.current.lat,
              longitude: userLocationRef.current.lng,
            }
            wsRef.current.send(JSON.stringify(locationData))
            console.log('Sent location data after:', locationData)
          } else {
            console.log('User location is not yet available')
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    socket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close()
      }
    }
  }, [studentId]) 

  useEffect(() => {
    const storedStudentId = localStorage.getItem('studentId') || '23104073'
    setStudentId(storedStudentId)

    const geoSuccess = (position: GeolocationPosition) => {
      const userLoc = { lat: position.coords.latitude, lng: position.coords.longitude }
      console.log(userLoc)
      setUserLocation(userLoc)
      userLocationRef.current = userLoc; // Update the userLocationRef

      setCenter(userLoc)

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const locationData = {
          student_id: storedStudentId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
        wsRef.current.send(JSON.stringify(locationData))
        console.log('Sent location data:', locationData)
      }
    }

    const geoError = () => {
      setUserLocation({ lat: 0, lng: 0 })
    }

    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(geoSuccess, geoError, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      })
    }
  }, [])

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
      {markers.map((marker) => (
        <Marker key={marker.uuid} position={[marker.latitude, marker.longitude]} icon={customIcon}>
          <Popup>
            Friend ID: {marker.student_id} <br />
            Latitude: {marker.latitude}, Longitude: {marker.longitude}
          </Popup>
        </Marker>
      ))}

      {/* Render user's own location */}
      {userLocation && (
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
