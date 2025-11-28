import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Map, Maximize2, Minimize2, Layers, AlertTriangle, Loader } from 'lucide-react';
import { useData } from '../context/DataContext';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const getSeverityColor = (severity) => {
  switch (severity) {
    case 'critical': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#eab308';
    case 'low': return '#3b82f6';
    default: return '#6b7280';
  }
};

const createAlertIcon = (severity) => {
  const color = getSeverityColor(severity);
  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: alertPulse 2s infinite;
      ">
        <div style="color: white; font-size: 14px; font-weight: bold;">!</div>
      </div>
    `,
    className: 'custom-alert-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};

const createVehicleIcon = () => {
  return L.divIcon({
    html: `
      <div style="
        background: #10b981;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="color: white; font-size: 12px;">🚗</div>
      </div>
    `,
    className: 'custom-vehicle-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

export default function MapPage() {
  const { alerts, vehicles } = useData();
  const [showVehicles, setShowVehicles] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // Debug logging
  console.log('MapPage - Alerts:', alerts.length, alerts);
  console.log('MapPage - Vehicles:', vehicles.length, vehicles);

  // Ensure map loads properly
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMapReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Calculate center based on all markers
  const getMapCenter = () => {
    const allMarkers = [
      ...(showAlerts ? alerts : []),
      ...(showVehicles ? vehicles : [])
    ];
    
    if (allMarkers.length === 0) {
      console.log('No markers, using default center');
      return [30.3165, 78.0322]; // Default to Dehradun, Uttarakhand
    }
    
    const avgLat = allMarkers.reduce((sum, item) => sum + item.lat, 0) / allMarkers.length;
    const avgLng = allMarkers.reduce((sum, item) => sum + item.lng, 0) / allMarkers.length;
    console.log('Map center calculated:', [avgLat, avgLng], 'from', allMarkers.length, 'markers');
    return [avgLat, avgLng];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold neon-text mb-1">Live Map</h1>
          <p className="text-sm text-slate-500">Real-time visualization of alerts and vehicles</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              showAlerts
                ? 'bg-red-500 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setShowVehicles(!showVehicles)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              showVehicles
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'
            }`}
          >
            🚗 Vehicles ({vehicles.filter(v => v.status === 'active').length})
          </button>
        </div>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'Total Alerts', value: alerts.length, color: 'red' },
          { label: 'Active Vehicles', value: vehicles.filter(v => v.status === 'active').length, color: 'emerald' },
          { label: 'Critical Alerts', value: alerts.filter(a => a.severity === 'critical').length, color: 'orange' },
          { label: 'Map Markers', value: (showAlerts ? alerts.length : 0) + (showVehicles ? vehicles.length : 0), color: 'blue' }
        ].map((stat, idx) => (
          <div key={idx} className="glass rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Map Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`glass rounded-2xl overflow-hidden ${
          isFullscreen ? 'fixed inset-4 z-50' : ''
        }`}
      >
        {/* Map Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-slate-200">Interactive Map</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-slate-200"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Map */}
        <div 
          className="relative bg-slate-800" 
          style={{ 
            height: isFullscreen ? 'calc(100vh - 200px)' : '600px',
            width: '100%',
            minHeight: '400px'
          }}
        >
          {!isMapReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 z-[1000]">
              <div className="text-center">
                <Loader className="w-12 h-12 text-emerald-400 mx-auto mb-3 animate-spin" />
                <p className="text-slate-300">Loading map...</p>
              </div>
            </div>
          )}
          {isMapReady && (
            <MapContainer
            key="main-map"
            center={getMapCenter()}
            zoom={13}
            style={{ width: '100%', height: '100%' }}
            scrollWheelZoom={true}
            whenReady={() => {
              console.log('Map is ready!');
            }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
            
            {/* Alert Markers */}
            {showAlerts && alerts.map(alert => {
              if (!alert.lat || !alert.lng) {
                console.warn('Alert missing coordinates:', alert);
                return null;
              }
              console.log('Rendering marker for alert:', alert.id, 'at', [alert.lat, alert.lng]);
              try {
                return (
                <Marker
                  key={`alert-${alert.id}`}
                  position={[alert.lat, alert.lng]}
                >
                <Popup>
                  <div className="p-3 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className={`w-5 h-5 ${
                        alert.severity === 'critical' ? 'text-red-500' :
                        alert.severity === 'high' ? 'text-orange-500' :
                        alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                      }`} />
                      <h3 className="font-bold text-gray-800">{alert.type}</h3>
                    </div>
                    <div className="space-y-1 text-sm text-gray-700">
                      <p><strong>Location:</strong> {alert.location}</p>
                      <p><strong>Vehicle:</strong> {alert.vehicle}</p>
                      <p><strong>Severity:</strong> <span className="capitalize">{alert.severity}</span></p>
                      <p><strong>Time:</strong> {new Date(alert.timestamp).toLocaleTimeString()}</p>
                      {alert.blockchainTxId && (
                        <p className="text-xs text-gray-500 font-mono">TX: {alert.blockchainTxId}</p>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
                );
              } catch (error) {
                console.error('Error rendering marker for alert:', alert.id, error);
                return null;
              }
            })}

            {/* Vehicle Markers */}
            {showVehicles && vehicles.filter(v => v.status === 'active').map(vehicle => (
              <Marker
                key={`vehicle-${vehicle.id}`}
                position={[vehicle.lat, vehicle.lng]}
                icon={createVehicleIcon()}
              >
                <Popup>
                  <div className="p-3">
                    <h3 className="font-bold text-gray-800 mb-2">{vehicle.id}</h3>
                    <div className="space-y-1 text-sm text-gray-700">
                      <p><strong>Location:</strong> {vehicle.location}</p>
                      <p><strong>Speed:</strong> {vehicle.speed} km/h</p>
                      <p><strong>Status:</strong> <span className="text-green-600 capitalize">{vehicle.status}</span></p>
                      <p className="text-xs text-gray-500">
                        Last seen: {new Date(vehicle.lastSeen).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 glass rounded-xl p-4 z-[1000]">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-semibold text-slate-200">Legend</h4>
            </div>
            <div className="space-y-2">
              {showAlerts && (
                <>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
                    <span>Critical Alert</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white"></div>
                    <span>High Alert</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white"></div>
                    <span>Medium Alert</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
                    <span>Low Alert</span>
                  </div>
                </>
              )}
              {showVehicles && (
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"></div>
                  <span>Active Vehicle</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
