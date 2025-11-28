import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Loader } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

const createCustomIcon = (severity) => {
  const color = getSeverityColor(severity);
  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        animation: pulse 2s infinite;
      "></div>
    `,
    className: 'custom-marker-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

export default function MapModal({ alert, isOpen, onClose }) {
  const [isMapReady, setIsMapReady] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      console.log('MapModal opened with alert:', alert);
      const timer = setTimeout(() => {
        setIsMapReady(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsMapReady(false);
    }
  }, [isOpen, alert]);

  if (!isOpen || !alert) {
    console.log('MapModal not rendering:', { isOpen, hasAlert: !!alert });
    return null;
  }

  if (!alert.lat || !alert.lng) {
    console.error('Alert missing coordinates:', alert);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
        <div className="glass rounded-2xl p-6 text-center">
          <p className="text-red-400">Alert is missing coordinates</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-emerald-500 rounded-xl">Close</button>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="glass rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${
                alert.severity === 'critical' ? 'bg-red-500/10 text-red-400' :
                alert.severity === 'high' ? 'bg-orange-500/10 text-orange-400' :
                alert.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                'bg-blue-500/10 text-blue-400'
              }`}>
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-100">{alert.type}</h2>
                <p className="text-sm text-slate-400">{alert.location}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors text-slate-400 hover:text-slate-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Alert Details */}
          <div className="p-6 border-b border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Severity</p>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                alert.severity === 'critical' ? 'text-red-400 bg-red-500/10 border-red-500/30' :
                alert.severity === 'high' ? 'text-orange-400 bg-orange-500/10 border-orange-500/30' :
                alert.severity === 'medium' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' :
                'text-blue-400 bg-blue-500/10 border-blue-500/30'
              }`}>
                {alert.severity}
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Vehicle</p>
              <p className="text-sm font-medium text-slate-200">{alert.vehicle}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Coordinates</p>
              <p className="text-sm font-mono text-slate-200">
                {alert.lat?.toFixed(4)}, {alert.lng?.toFixed(4)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Time</p>
              <p className="text-sm text-slate-200">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* Map */}
          <div className="relative" style={{ height: '500px', width: '100%' }}>
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
              key={`modal-map-${alert.id}`}
              center={[alert.lat, alert.lng]}
              zoom={15}
              style={{ width: '100%', height: '100%' }}
              scrollWheelZoom={true}
              whenReady={() => {
                console.log('Modal map is ready!');
              }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
              <Marker
                position={[alert.lat, alert.lng]}
                icon={createCustomIcon(alert.severity)}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold mb-1">{alert.type}</h3>
                    <p className="text-sm text-gray-700">{alert.location}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>


      </motion.div>
    </AnimatePresence>
  );
}
