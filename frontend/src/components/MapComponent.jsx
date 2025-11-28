import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getMarkerIcon, validateCoordinates } from '../utils/mapUtils';

/**
 * MapComponent - Interactive map visualization for hazard alerts
 * @param {Object} props - Component props
 * @param {Array} props.alerts - Array of hazard alert objects
 * @param {Array} props.center - Map center coordinates [lat, lng]
 * @param {number} props.zoom - Initial zoom level
 */
const MapComponent = ({ alerts = [], center = [40.7128, -74.0060], zoom = 13 }) => {
  // Handle empty or invalid alerts array
  if (!Array.isArray(alerts)) {
    console.warn('MapComponent: alerts prop is not an array. Expected array, received:', typeof alerts);
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <p className="text-yellow-700">Unable to display map: Invalid data format</p>
      </div>
    );
  }
  
  // Handle empty alerts array gracefully
  if (alerts.length === 0) {
    console.info('MapComponent: No alerts to display on map');
  }
  
  // Filter alerts to only include those with valid coordinates
  const validAlerts = alerts.filter(alert => {
    // Handle missing alert properties with optional chaining
    if (!alert || typeof alert !== 'object') {
      console.warn('MapComponent: Invalid alert object (not an object):', alert);
      return false;
    }
    
    // Check for missing required properties
    if (alert?.latitude === undefined || alert?.longitude === undefined) {
      console.warn('MapComponent: Alert missing coordinates. Alert ID:', alert?.id || 'unknown');
      return false;
    }
    
    // Validate coordinates
    const isValid = validateCoordinates(alert.latitude, alert.longitude);
    if (!isValid) {
      console.warn('MapComponent: Invalid coordinates for alert ID:', alert?.id || 'unknown', 
                   'Coordinates:', alert.latitude, alert.longitude);
    }
    
    return isValid;
  });
  
  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      className="h-[300px] md:h-[400px] lg:h-[500px] w-full"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Render markers for each valid alert */}
      {validAlerts.map(alert => (
        <Marker
          key={alert?.id || `alert-${alert?.latitude}-${alert?.longitude}`}
          position={[alert.latitude, alert.longitude]}
          icon={getMarkerIcon(alert?.hazard_type)}
        >
          <Popup>
            <div className="text-sm">
              <h3 className="font-bold mb-1 capitalize">{alert?.hazard_type || 'Unknown'}</h3>
              <p className="text-gray-700">
                <span className="font-semibold">Location:</span> {alert?.latitude?.toFixed(4) || 'N/A'}, {alert?.longitude?.toFixed(4) || 'N/A'}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Confidence:</span> {((alert?.confidence || 0) * 100).toFixed(0)}%
              </p>
              <p className="text-gray-500 text-xs mt-1">
                {alert?.verified_at ? new Date(alert.verified_at).toLocaleString() : 'No timestamp'}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

// Wrap component with React.memo for performance optimization
// Custom comparison function to prevent unnecessary re-renders
export default React.memo(MapComponent, (prevProps, nextProps) => {
  // Handle missing props with optional chaining
  const prevAlerts = prevProps?.alerts || [];
  const nextAlerts = nextProps?.alerts || [];
  
  // Only re-render if alerts array actually changed
  // Compare length first for quick check
  if (prevAlerts.length !== nextAlerts.length) {
    return false; // Props are different, re-render
  }
  
  // Compare center and zoom with optional chaining
  const prevCenter = prevProps?.center || [40.7128, -74.0060];
  const nextCenter = nextProps?.center || [40.7128, -74.0060];
  const prevZoom = prevProps?.zoom || 13;
  const nextZoom = nextProps?.zoom || 13;
  
  if (prevCenter[0] !== nextCenter[0] || 
      prevCenter[1] !== nextCenter[1] ||
      prevZoom !== nextZoom) {
    return false; // Props are different, re-render
  }
  
  // Deep comparison of alerts array
  // Check if alert IDs and key properties changed
  for (let i = 0; i < prevAlerts.length; i++) {
    const prevAlert = prevAlerts[i];
    const nextAlert = nextAlerts[i];
    
    if (prevAlert?.id !== nextAlert?.id ||
        prevAlert?.latitude !== nextAlert?.latitude ||
        prevAlert?.longitude !== nextAlert?.longitude ||
        prevAlert?.hazard_type !== nextAlert?.hazard_type) {
      return false; // Props are different, re-render
    }
  }
  
  return true; // Props are the same, skip re-render
});
