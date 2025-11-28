import L from 'leaflet';

/**
 * Generates a custom Leaflet divIcon based on hazard type
 * @param {string} hazardType - The type of hazard (accident, ice, debris, etc.)
 * @returns {L.DivIcon} A Leaflet divIcon with color-coded styling
 */
export const getMarkerIcon = (hazardType) => {
  // Color mapping for different hazard types
  const colorMap = {
    accident: '#ef4444',  // red
    ice: '#3b82f6',       // blue
    debris: '#f59e0b',    // amber
    default: '#6b7280'    // gray
  };
  
  // Get color for hazard type, fallback to default if not found
  const color = colorMap[hazardType] || colorMap.default;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

/**
 * Validates geographic coordinates
 * @param {number} latitude - Latitude value to validate
 * @param {number} longitude - Longitude value to validate
 * @returns {boolean} True if coordinates are valid, false otherwise
 */
export const validateCoordinates = (latitude, longitude) => {
  const isValidLat = typeof latitude === 'number' && latitude >= -90 && latitude <= 90;
  const isValidLng = typeof longitude === 'number' && longitude >= -180 && longitude <= 180;
  
  if (!isValidLat || !isValidLng) {
    console.warn(`Invalid coordinates detected: latitude=${latitude}, longitude=${longitude}`);
    return false;
  }
  
  return true;
};
