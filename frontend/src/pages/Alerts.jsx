
import React, { useState, useEffect } from 'react';
import VehicleCard from '../components/VehicleCard';
import { FaInfoCircle } from 'react-icons/fa';

// Mock initial data for vehicles
const initialVehicles = [
  { id: 'Vehicle-Alpha-01', speed: 60, location: { lat: 34.0522, lon: -118.2437 }, connectionStatus: 'Active', alertStatus: 'Normal' },
  { id: 'Vehicle-Bravo-02', speed: 85, location: { lat: 34.0550, lon: -118.2450 }, connectionStatus: 'Active', alertStatus: 'Alert' }, // Start with one alert
  { id: 'Vehicle-Charlie-03', speed: 0, location: { lat: 34.0500, lon: -118.2400 }, connectionStatus: 'Inactive', alertStatus: 'Normal' },
  { id: 'Vehicle-Delta-04', speed: 110, location: { lat: 34.0580, lon: -118.2500 }, connectionStatus: 'Active', alertStatus: 'Normal' },
];

const Alerts = () => {
  const [vehicles, setVehicles] = useState(initialVehicles);

  // This simulation is just for demo purposes on this page.
  // In a real app, this state would be shared globally (e.g., via Context or Redux).
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
  };

  const alertedVehicles = vehicles.filter(v => v.alertStatus === 'Alert');

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Active Alerts</h1>
      {alertedVehicles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {alertedVehicles.map(vehicle => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} onSendAlert={handleSendAlert} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center bg-white p-10 rounded-lg shadow-md">
          <FaInfoCircle className="text-5xl text-green-500 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700">No Active Alerts</h2>
          <p className="text-gray-500 mt-2">All systems are normal. Any new alerts will appear here.</p>
        </div>
      )}
    </div>
  );
};

export default Alerts;
