'use client'

import React, { useState } from 'react'

interface AddMarkerFormProps {
  onAddMarker: (lat: number, lng: number) => void
}

const AddMarkerForm: React.FC<AddMarkerFormProps> = ({ onAddMarker }) => {
  const [latitude, setLatitude] = useState<number>(0)
  const [longitude, setLongitude] = useState<number>(0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddMarker(latitude, longitude)
    setLatitude(0) // Reset the form
    setLongitude(0)
  }

  return (
    <form onSubmit={handleSubmit} className='my-4'>
      <div className='form-group'>
        <label htmlFor='latitude'>Latitude</label>
        <input
          type='number'
          id='latitude'
          className='form-control'
          value={latitude}
          onChange={(e) => setLatitude(parseFloat(e.target.value))}
          required
        />
      </div>
      <div className='form-group'>
        <label htmlFor='longitude'>Longitude</label>
        <input
          type='number'
          id='longitude'
          className='form-control'
          value={longitude}
          onChange={(e) => setLongitude(parseFloat(e.target.value))}
          required
        />
      </div>
      <button type='submit' className='btn btn-primary mt-3'>
        Add Marker
      </button>
    </form>
  )
}

export default AddMarkerForm
