
import React, { useState, useEffect } from 'react';
import VehicleCard from '../components/VehicleCard';
import { FaMap } from 'react-icons/fa';

// Mock initial data for vehicles
const initialVehicles = [
  { id: 'Vehicle-Alpha-01', speed: 60, location: { lat: 34.0522, lon: -118.2437 }, connectionStatus: 'Active', alertStatus: 'Normal' },
  { id: 'Vehicle-Bravo-02', speed: 85, location: { lat: 34.0550, lon: -118.2450 }, connectionStatus: 'Active', alertStatus: 'Normal' },
  { id: 'Vehicle-Charlie-03', speed: 0, location: { lat: 34.0500, lon: -118.2400 }, connectionStatus: 'Inactive', alertStatus: 'Normal' },
  { id: 'Vehicle-Delta-04', speed: 110, location: { lat: 34.0580, lon: -118.2500 }, connectionStatus: 'Active', alertStatus: 'Normal' },
];

const Dashboard = () => {
  const [vehicles, setVehicles] = useState(initialVehicles);

  // Simulate real-time vehicle data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles(prevVehicles =>
        prevVehicles.map(v => {
          // Only update active vehicles
          if (v.connectionStatus === 'Active') {
            return {
              ...v,
              speed: Math.max(0, v.speed + Math.floor(Math.random() * 11) - 5), // Fluctuate speed
              location: {
                lat: v.location.lat + (Math.random() - 0.5) * 0.001,
                lon: v.location.lon + (Math.random() - 0.5) * 0.001,
              },
            };
          }
          return v;
        })
      );
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  // Handler to send an alert from a vehicle
  const handleSendAlert = (vehicleId) => {
    setVehicles(prevVehicles =>
      prevVehicles.map(v =>
        v.id === vehicleId ? { ...v, alertStatus: 'Alert' } : v
      )
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Vehicle Dashboard</h1>
        <div className="flex items-center space-x-2">
          <FaMap className="text-blue-500" />
          <span className="text-gray-600">Live Map View</span>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="mb-8 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl h-96 flex items-center justify-center">
        <p className="text-gray-500">Map Visualization Area</p>
      </div>

      {/* Vehicle Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map(vehicle => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            onSendAlert={handleSendAlert}
          />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
