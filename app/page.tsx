'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import AddMarkerForm from './component/AddMarkerForm'

const OpenStreetmap = dynamic(() => import('./component/OpenStreetMap/ostm'), {
  ssr: false,
})

const Index: React.FC = () => {
  const [markers, setMarkers] = useState<{ lat: number; lng: number }[]>([])

  const handleAddMarker = (lat: number, lng: number) => {
    setMarkers((prevMarkers) => [...prevMarkers, { lat, lng }])
  }

  const handleRemoveMarker = (index: number) => {
    setMarkers((prevMarkers) => prevMarkers.filter((_, i) => i !== index))
  }

  return (
    <>
      <h1 className="text-center">OpenStreetMap</h1>
      <AddMarkerForm onAddMarker={handleAddMarker} />
      <OpenStreetmap markers={markers} onMarkerAdd={handleAddMarker} onMarkerRemove={handleRemoveMarker} />
    </>
  )
}

export default Index
