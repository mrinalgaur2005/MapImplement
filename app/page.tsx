'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import OpenStreetMap component with SSR disabled
const OpenStreetmap = dynamic(() => import('./component/OpenStreetMap/ostm'), {
  ssr: false,
})

const Index: React.FC = () => {
  const [markers, setMarkers] = useState<{ username: string; latitude: number; longitude: number }[]>([])


  return (
    <>
      <h1 className="text-center">OpenStreetMap</h1>
      <OpenStreetmap />
    </>
  )
}

export default Index
