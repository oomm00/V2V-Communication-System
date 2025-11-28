import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FiMap, FiMaximize2, FiMinimize2 } from 'react-icons/fi';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
    road_block: '#ef4444',
    ice_patch: '#3b82f6',
    accident: '#f97316',
    construction: '#eab308',
    animal_crossing: '#22c55e'
  };
  return colors[hazardType] || '#6b7280';
};

const createCustomIcon = (hazardType) => {
  const emoji = getHazardIcon(hazardType);
  const color = getHazardColor(hazardType);
  
  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        ${emoji}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

const MapView = ({ alerts, newAlertIds }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef(new Map());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current, {
      zoomControl: false
    }).setView([40.7128, -74.0060], 10); // Default to NYC

    // Add tile layer with dark theme
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors, © CARTO',
      maxZoom: 19
    }).addTo(map);

    // Add zoom control to top right
    L.control.zoom({
      position: 'topright'
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !alerts.length) return;

    const map = mapInstanceRef.current;
    
    // Clear existing markers
    markersRef.current.forEach(marker => {
      map.removeLayer(marker);
    });
    markersRef.current.clear();

    // Add markers for all alerts
    alerts.forEach(alert => {
      if (!alert.latitude || !alert.longitude) return;

      const marker = L.marker(
        [parseFloat(alert.latitude), parseFloat(alert.longitude)],
        { icon: createCustomIcon(alert.hazard_type) }
      );

      const isNew = newAlertIds.includes(alert.id);
      
      const popupContent = `
        <div class="p-3 min-w-[200px]">
          <div class="flex items-center space-x-2 mb-2">
            <span class="text-lg">${getHazardIcon(alert.hazard_type)}</span>
            <h3 class="font-bold text-gray-800">${alert.hazard_type.replace('_', ' ').toUpperCase()}</h3>
            ${isNew ? '<span class="bg-green-500 text-white text-xs px-2 py-1 rounded-full">NEW</span>' : ''}
          </div>
          <div class="space-y-1 text-sm text-gray-600">
            <p><strong>Coordinates:</strong> ${parseFloat(alert.latitude).toFixed(6)}, ${parseFloat(alert.longitude).toFixed(6)}</p>
            <p><strong>Confidence:</strong> <span class="font-medium ${
              alert.confidence >= 80 ? 'text-green-600' :
              alert.confidence >= 60 ? 'text-yellow-600' : 'text-red-600'
            }">${alert.confidence}%</span></p>
            <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
            ${alert.id ? `<p><strong>ID:</strong> ${alert.id}</p>` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup'
      });

      // Add pulsing animation for new alerts
      if (isNew) {
        marker.on('add', () => {
          const element = marker.getElement();
          if (element) {
            element.style.animation = 'pulse 2s infinite';
          }
        });
      }

      marker.addTo(map);
      markersRef.current.set(alert.id, marker);
    });

    // Auto-fit bounds if we have alerts
    if (alerts.length > 0) {
      const group = new L.featureGroup(Array.from(markersRef.current.values()));
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [alerts, newAlertIds]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // Trigger map resize after animation
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 300);
  };

  return (
    <motion.div
      layout
      className={`bg-gray-800 rounded-xl border border-gray-700 overflow-hidden ${
        isFullscreen ? 'fixed inset-4 z-50' : 'h-[600px]'
      }`}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gray-900/50">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <FiMap className="w-5 h-5 text-blue-400" />
            <span>Live Map</span>
          </h2>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">
              {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              {isFullscreen ? (
                <FiMinimize2 className="w-4 h-4 text-white" />
              ) : (
                <FiMaximize2 className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative flex-1">
        <div
          ref={mapRef}
          className={`w-full ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[540px]'}`}
        />
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 border border-gray-700">
          <h4 className="text-white font-medium mb-2 text-sm">Hazard Types</h4>
          <div className="space-y-1">
            {[
              { type: 'road_block', label: 'Road Block' },
              { type: 'ice_patch', label: 'Ice Patch' },
              { type: 'accident', label: 'Accident' },
              { type: 'construction', label: 'Construction' },
              { type: 'animal_crossing', label: 'Animal Crossing' }
            ].map(({ type, label }) => (
              <div key={type} className="flex items-center space-x-2 text-xs">
                <span>{getHazardIcon(type)}</span>
                <span className="text-gray-300">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Loading overlay */}
        {alerts.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50">
            <div className="text-center">
              <FiMap className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">Waiting for alerts to display...</p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        .custom-popup .leaflet-popup-content-wrapper {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .custom-popup .leaflet-popup-tip {
          background: white;
        }
      `}</style>
    </motion.div>
  );
};

export default MapView;