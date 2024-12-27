'use client'

import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvent } from 'react-leaflet'
import { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

interface MarkerData {
  lat: number
  lng: number
}

interface OpenStreetmapProps {
  markers: MarkerData[]
  onMarkerAdd: (lat: number, lng: number) => void
  onMarkerRemove: (index: number) => void
}

const MapClickHandler: React.FC<{ onClick: (lat: number, lng: number) => void }> = ({ onClick }) => {
  useMapEvent('click', (e) => {
    onClick(e.latlng.lat, e.latlng.lng)
  })
  return null
}

const OpenStreetmap: React.FC<OpenStreetmapProps> = ({ markers, onMarkerAdd, onMarkerRemove }) => {
  const [center, setCenter] = useState<LatLngExpression>({ lat: 30.7652305, lng: 76.7846207 }) // Default fallback location
  const [userLocation, setUserLocation] = useState<LatLngExpression | null>(null)
  const ZOOM_LEVEL = 17

  useEffect(() => {
    if (navigator.geolocation) {
      // Function to get and update device location
      const updateLocation = () => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation = { lat: position.coords.latitude, lng: position.coords.longitude }
            setUserLocation(newLocation) // Update user location state
            setCenter(newLocation) // Optionally, update map center to user location
          },
          (error) => {
            console.error('Error retrieving location:', error.message)
            alert('Unable to retrieve your location. Default location is set.')
            setUserLocation({ lat: 40.7128, lng: -74.0060 }) // New York as fallback
          }
        )
      }

      // Update location every 2 minutes
      const locationInterval = setInterval(updateLocation, 2 * 60 * 1000)

      // Get the initial location
      updateLocation()

      // Clear interval on cleanup
      return () => clearInterval(locationInterval)
    } else {
      console.error('Geolocation is not supported by your browser.')
      alert('Geolocation is not supported by your browser. Default location is set.')
      setUserLocation({ lat: 40.7128, lng: -74.0060 }) // New York as fallback
    }
  }, [])

  const customIcon = new L.Icon({
    iconUrl: 'https://www.maptive.com/wp-content/uploads/2020/10/Marker-Color-_-Grouping-Tool-2.svg',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, 32],
  })

  const handleMarkerClick = (index: number) => {
    onMarkerRemove(index)
  }

  return (
    <div className="container">
      <h1 className="text-center mt-5">OpenStreetMap Embedded</h1>
      <div className="row">
        <div className="col">
          <div className="container">
            <MapContainer
              center={center}
              zoom={ZOOM_LEVEL}
              style={{ height: '500px', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {/* Handle map clicks */}
              <MapClickHandler onClick={onMarkerAdd} />
              {markers.map((marker, index) => (
                <Marker
                  key={index}
                  position={[marker.lat, marker.lng]}
                  icon={customIcon}
                  eventHandlers={{
                    click: () => handleMarkerClick(index),
                  }}
                >
                  <Popup>
                    Latitude: {marker.lat}, Longitude: {marker.lng} <br />
                    Click to remove.
                  </Popup>
                </Marker>
              ))}
              {/* Marker for user's current location */}
              {userLocation && (
                <Marker position={userLocation} icon={customIcon}>
                  <Popup>Your current location</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OpenStreetmap
