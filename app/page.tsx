"use client"

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const OpenStreetmap = dynamic(() => import('./component/OpenStreetMap/ostm'), {
  ssr: false,
});

const Index: React.FC = () => {
  const [markers, setMarkers] = useState<{ student_id: string; latitude: number; longitude: number }[]>([]);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3000'); // Ensure this URL matches your backend WebSocket URL

    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data); // Parse the received data
      console.log('Received location update:', data); // Log the data to verify

      // Update markers state
      setMarkers((prevMarkers) => {
        const existingMarker = prevMarkers.find((marker) => marker.student_id === data.student_id);
        if (existingMarker) {
          return prevMarkers.map((marker) =>
            marker.student_id === data.student_id
              ? { ...marker, latitude: data.latitude, longitude: data.longitude }
              : marker
          );
        } else {
          return [...prevMarkers, data]; // Add new marker if not already present
        }
      });
    };

    socket.onerror = (error) => {
      console.log('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      socket.close();
      console.log('WebSocket disconnected');
    };
  }, []);

  return (
    <>
      <h1 className="text-center">OpenStreetMap</h1>
      <OpenStreetmap markers={markers} />
    </>
  );
};

export default Index;
