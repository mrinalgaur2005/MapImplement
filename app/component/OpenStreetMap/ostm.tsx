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
  address?: string // Added field for reverse geocoding results
}

const OpenStreetmap: React.FC = () => {
  const [center, setCenter] = useState<LatLngExpression>({ lat: 30.7652305, lng: 76.7846207 })
  const [userLocation, setUserLocation] = useState<LatLngExpression | null>(null)
  const [markers, setMarkers] = useState<MarkerData[]>([])
  const [studentId, setStudentId] = useState<string>('')
  const wsRef = useRef<WebSocket | null>(null)

  const ZOOM_LEVEL = 17
  const GEOAPIFY_API_KEY = 'fd046e839e5145f18458ebaefbe65a30'

  // Fetch address from Geoapify Reverse Geocoding API
  const fetchAddress = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=${GEOAPIFY_API_KEY}`
      )
      const result = await response.json()
      if (result.features && result.features.length > 0) {
        return result.features[0].properties.formatted // Return the formatted address
      }
      return 'Address not found'
    } catch (error) {
      console.error('Error fetching address:', error)
      return 'Error fetching address'
    }
  }

  // WebSocket setup
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3000')
    wsRef.current = socket

    socket.onopen = () => {
      console.log('Connected to WebSocket server')
    }

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'activeUsers') {
          const activeUserIds = data.activeUsers
          setMarkers((prevMarkers) =>
            prevMarkers.filter((marker) => activeUserIds.includes(marker.student_id))
          )
        }

        if (data.latitudeData && data.latitudeData.length !== 0) {
          const markersWithUUID = await Promise.all(
            data.latitudeData.map(async (marker: any) => {
              const address = await fetchAddress(marker.latitude, marker.longitude)
              return { ...marker, uuid: uuidv4(), address }
            })
          )

          setMarkers((prevMarkers) => {
            const newMarkers = markersWithUUID.filter(
              (newMarker) => !prevMarkers.some((prevMarker) => prevMarker.student_id === newMarker.student_id)
            )
            return [...prevMarkers, ...newMarkers]
          })
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
  }, [])

  // Handle user's geolocation with continuous updates
  useEffect(() => {
    const storedStudentId = localStorage.getItem('studentId') || '23104073'
    setStudentId(storedStudentId)

    const geoSuccess = (position: GeolocationPosition) => {
      const userLoc = { lat: position.coords.latitude, lng: position.coords.longitude }
      setUserLocation(userLoc)
      setCenter(userLoc)

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const locationData = {
          student_id: storedStudentId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
        wsRef.current.send(JSON.stringify(locationData))
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
  }, [studentId])

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

      {markers.map((marker) => (
        <Marker key={marker.uuid} position={[marker.latitude, marker.longitude]} icon={customIcon}>
          <Popup>
            Friend ID: {marker.student_id} <br />
            Latitude: {marker.latitude}, Longitude: {marker.longitude} <br />
            Address: {marker.address || 'Fetching...'}
          </Popup>
        </Marker>
      ))}

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
