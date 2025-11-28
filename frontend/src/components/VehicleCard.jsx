
import React from 'react';
import { FaCar, FaMapMarkerAlt, FaTachometerAlt, FaExclamationTriangle } from 'react-icons/fa';

const VehicleCard = ({ vehicle, onSendAlert }) => {
  const { id, speed, location, connectionStatus, alertStatus } = vehicle;

  const isAlert = alertStatus === 'Alert';
  const isConnected = connectionStatus === 'Active';

  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg ${isAlert ? 'ring-2 ring-red-500' : 'ring-1 ring-gray-200'}`}>
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <FaCar className={`text-2xl mr-3 ${isAlert ? 'text-red-500' : 'text-blue-500'}`} />
            <h3 className="text-lg font-bold text-gray-800">{id}</h3>
          </div>
          <div className={`flex items-center px-2 py-1 text-xs font-semibold rounded-full ${isConnected ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
            <span className={`h-2 w-2 rounded-full mr-1.5 ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            {connectionStatus}
          </div>
        </div>

        <div className="mt-4 space-y-3 text-sm text-gray-600">
          <div className="flex items-center">
            <FaTachometerAlt className="mr-2 text-gray-400" />
            <span>Speed: <strong>{speed} km/h</strong></span>
          </div>
          <div className="flex items-center">
            <FaMapMarkerAlt className="mr-2 text-gray-400" />
            <span>Location: <strong>{location.lat.toFixed(4)}, {location.lon.toFixed(4)}</strong></span>
          </div>
        </div>

        <div className="mt-5 flex justify-between items-center">
          <div className="flex items-center">
            {isAlert && (
              <div className="flex items-center text-red-500 animate-blink">
                <FaExclamationTriangle className="mr-2" />
                <span className="font-bold">ALERT ACTIVE</span>
              </div>
            )}
            {!isAlert && (
              <div className="text-green-600 font-semibold">
                <span>Status: Normal</span>
              </div>
            )}
          </div>
          <button
            onClick={() => onSendAlert(id)}
            disabled={isAlert}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Send Alert
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
