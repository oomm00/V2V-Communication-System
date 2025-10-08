
import React, { useState, useEffect } from 'react';
import VehicleCard from '../components/VehicleCard';

// Mock initial data for vehicles (can be moved to a shared file later)
const initialVehicles = [
  { id: 'Vehicle-Alpha-01', speed: 60, location: { lat: 34.0522, lon: -118.2437 }, connectionStatus: 'Active', alertStatus: 'Normal' },
  { id: 'Vehicle-Bravo-02', speed: 85, location: { lat: 34.0550, lon: -118.2450 }, connectionStatus: 'Active', alertStatus: 'Normal' },
  { id: 'Vehicle-Charlie-03', speed: 0, location: { lat: 34.0500, lon: -118.2400 }, connectionStatus: 'Inactive', alertStatus: 'Normal' },
  { id: 'Vehicle-Delta-04', speed: 110, location: { lat: 34.0580, lon: -118.2500 }, connectionStatus: 'Active', alertStatus: 'Normal' },
  { id: 'Vehicle-Echo-05', speed: 75, location: { lat: 34.0535, lon: -118.2465 }, connectionStatus: 'Active', alertStatus: 'Normal' },
];

const Vehicles = () => {
  const [vehicles, setVehicles] = useState(initialVehicles);

  // Simulate real-time vehicle data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles(prevVehicles =>
        prevVehicles.map(v => {
          if (v.connectionStatus === 'Active') {
            return {
              ...v,
              speed: Math.max(0, v.speed + Math.floor(Math.random() * 11) - 5),
              location: {
                lat: v.location.lat + (Math.random() - 0.5) * 0.001,
                lon: v.location.lon + (Math.random() - 0.5) * 0.001,
              },
            };
          }
          return v;
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleSendAlert = (vehicleId) => {
    setVehicles(prevVehicles =>
      prevVehicles.map(v =>
        v.id === vehicleId ? { ...v, alertStatus: 'Alert' } : v
      )
    );
    // In a real app, you would also send this to a backend API
    console.log(`Alert sent from ${vehicleId}`);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">All Vehicles</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {vehicles.map(vehicle => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} onSendAlert={handleSendAlert} />
        ))}
      </div>
    </div>
  );
};

export default Vehicles;
