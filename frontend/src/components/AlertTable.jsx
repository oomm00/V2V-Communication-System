import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiAlertTriangle, 
  FiMapPin, 
  FiClock,
  FiTrendingUp,
  FiFilter
} from 'react-icons/fi';

const getHazardIcon = (hazardType) => {
  const icons = {
    road_block: '⚠️',
    ice_patch: '❄️',
    accident: '🚗',
    construction: '🚺',
    animal_crossing: '🐾'
  };
  return icons[hazardType] || '⚠️';
};

const getHazardColor = (hazardType) => {
  const colors = {
    road_block: 'text-red-400',
    ice_patch: 'text-blue-400',
    accident: 'text-orange-400',
    construction: 'text-yellow-400',
    animal_crossing: 'text-green-400'
  };
  return colors[hazardType] || 'text-gray-400';
};

const AlertRow = ({ alert, index, isNew }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatCoordinate = (coord) => {
    return parseFloat(coord).toFixed(6);
  };

  return (
    <motion.tr
      initial={isNew ? { opacity: 0, x: -20, backgroundColor: 'rgba(34, 197, 94, 0.1)' } : { opacity: 1 }}
      animate={{ opacity: 1, x: 0, backgroundColor: 'transparent' }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors duration-200"
    >
      <td className="px-4 py-3">
        <div className="flex items-center space-x-3">
          <span className="text-lg">{getHazardIcon(alert.hazard_type)}</span>
          <div>
            <p className={`font-medium ${getHazardColor(alert.hazard_type)}`}>
              {alert.hazard_type?.replace('_', ' ').toUpperCase()}
            </p>
            <p className="text-xs text-gray-500">ID: {alert.id}</p>
          </div>
        </div>
      </td>
      
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <FiMapPin className="w-4 h-4 text-gray-400" />
          <span className="text-gray-300 font-mono text-sm">
            {formatCoordinate(alert.latitude)}
          </span>
        </div>
      </td>
      
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <FiMapPin className="w-4 h-4 text-gray-400" />
          <span className="text-gray-300 font-mono text-sm">
            {formatCoordinate(alert.longitude)}
          </span>
        </div>
      </td>
      
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <FiTrendingUp className="w-4 h-4 text-gray-400" />
          <span className={`font-medium ${
            alert.confidence >= 80 ? 'text-green-400' :
            alert.confidence >= 60 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {alert.confidence}%
          </span>
        </div>
      </td>
      
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <FiClock className="w-4 h-4 text-gray-400" />
          <span className="text-gray-300 text-sm">
            {formatTime(alert.timestamp)}
          </span>
        </div>
      </td>
    </motion.tr>
  );
};

const AlertTable = ({ alerts, newAlertIds }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.hazard_type === filter;
  });

  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    
    if (sortBy === 'timestamp') {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    }
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  const hazardTypes = [...new Set(alerts.map(alert => alert.hazard_type))];

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <FiAlertTriangle className="w-5 h-5 text-red-400" />
            <span>Live Alerts</span>
          </h2>
          
          <div className="flex items-center space-x-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              {hazardTypes.map(type => (
                <option key={type} value={type}>
                  {getHazardIcon(type)} {type.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center space-x-1 px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white hover:bg-gray-600 transition-colors"
            >
              <FiFilter className="w-4 h-4" />
              <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-900/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Hazard Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Latitude
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Longitude
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Confidence
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Timestamp
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {sortedAlerts.length > 0 ? (
                sortedAlerts.map((alert, index) => (
                  <AlertRow
                    key={alert.id}
                    alert={alert}
                    index={index}
                    isNew={newAlertIds.includes(alert.id)}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <FiAlertTriangle className="w-8 h-8 text-gray-600" />
                      <p>No alerts found</p>
                      <p className="text-sm">Waiting for incoming alerts...</p>
                    </div>
                  </td>
                </tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      
      {/* Footer */}
      {sortedAlerts.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-700 bg-gray-900/30">
          <p className="text-sm text-gray-400">
            Showing {sortedAlerts.length} of {alerts.length} alerts
          </p>
        </div>
      )}
    </div>
  );
};

export default AlertTable;