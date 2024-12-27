'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'

const OpenStreetmap = dynamic(() => import('./component/OpenStreetMap/ostm'), {
  ssr: false,
})

const Index: React.FC = () => {
  const [markers, setMarkers] = useState<{ lat: number; lng: number }[]>([])
  const [loading, setLoading] = useState(false) // Add loading state

  const handleAddMarker = async (lat: number, lng: number) => {
    setMarkers((prevMarkers) => [...prevMarkers, { lat, lng }])
    setLoading(true) // Set loading to true when making the request
    try {
      const response = await fetch('/api/save-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lat, lng, username: 'User123' }),
      })
      if (!response.ok) {
        console.error('Failed to save location:', response.statusText)
        alert('Error saving location!')
      } else {
        console.log('Location saved successfully!')
      }
    } catch (error) {
      console.error('Error saving location:', error)
      alert('Error saving location!')
    } finally {
      setLoading(false) // Set loading to false after the request completes
    }
  }

  const handleRemoveMarker = (index: number) => {
    setMarkers((prevMarkers) => prevMarkers.filter((_, i) => i !== index))
  }

  return (
    <>
      <h1 className="text-center">OpenStreetMap</h1>
      {loading && <div className="loading">Saving location...</div>} {/* Add loading message */}
      <OpenStreetmap
        markers={markers}
        onMarkerAdd={handleAddMarker}
        onMarkerRemove={handleRemoveMarker}
      />
    </>
  )
}

export default Index
