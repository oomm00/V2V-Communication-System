# Design Document

## Overview

This design document outlines the implementation of an interactive map visualization feature for the V2V Communication System dashboard. The solution integrates Leaflet.js, a lightweight open-source mapping library, with the existing React-based dashboard to provide real-time geographic visualization of hazard alerts.

The map component will be embedded within the Dashboard page, displaying hazard markers that update automatically as new alerts are received from the backend API. The design prioritizes performance, user experience, and maintainability while leveraging existing infrastructure.

## Architecture

### Component Hierarchy

```
Dashboard (existing)
├── Metrics Cards (existing)
├── Map Component (new)
│   ├── MapContainer (Leaflet)
│   ├── TileLayer (OpenStreetMap)
│   └── HazardMarkers (custom)
│       ├── Marker (per alert)
│       └── Popup (per marker)
└── Alerts Table (existing)
```

### Data Flow

1. Dashboard component fetches alerts from `/alerts` API endpoint (existing)
2. Alerts state is passed as props to Map Component
3. Map Component renders markers based on alert coordinates
4. User interactions (clicks, zoom, pan) are handled by Leaflet
5. Map updates automatically when alerts state changes (via existing 5-second polling)

### Technology Stack

- **Leaflet.js** (v1.9.x): Core mapping library
- **React-Leaflet** (v4.x): React bindings for Leaflet
- **OpenStreetMap**: Free tile layer provider
- **Leaflet CSS**: Required styles for map controls and markers

## Components and Interfaces

### MapComponent

A new React component that encapsulates the Leaflet map functionality.

**Props Interface:**
```typescript
interface MapComponentProps {
  alerts: Array<{
    id: number;
    latitude: number;
    longitude: number;
    hazard_type: string;
    confidence: number;
    verified_at: string;
  }>;
  center?: [number, number];  // Default: [40.7128, -74.0060] (NYC)
  zoom?: number;              // Default: 13
}
```

**Component Structure:**
```jsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapComponent = ({ alerts, center = [40.7128, -74.0060], zoom = 13 }) => {
  // Custom icon logic
  // Marker rendering logic
  // Return JSX
};
```

### Custom Marker Icons

Create a utility function to generate color-coded icons based on hazard type.

**Icon Mapping:**
- `accident` → Red marker
- `ice` → Blue marker
- `debris` → Amber/Orange marker
- `default` → Gray marker

**Implementation Approach:**
Use Leaflet's `divIcon` to create custom HTML/CSS markers or use colored SVG icons.

```javascript
const getMarkerIcon = (hazardType) => {
  const colorMap = {
    accident: '#ef4444',  // red-500
    ice: '#3b82f6',       // blue-500
    debris: '#f59e0b',    // amber-500
    default: '#6b7280'    // gray-500
  };
  
  const color = colorMap[hazardType] || colorMap.default;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white;"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};
```

### Popup Content

Display formatted hazard information when a marker is clicked.

**Popup Structure:**
```jsx
<Popup>
  <div className="text-sm">
    <h3 className="font-bold mb-1">{hazard_type}</h3>
    <p>Location: {latitude.toFixed(4)}, {longitude.toFixed(4)}</p>
    <p>Confidence: {(confidence * 100).toFixed(0)}%</p>
    <p className="text-gray-500 text-xs mt-1">
      {new Date(verified_at).toLocaleString()}
    </p>
  </div>
</Popup>
```

## Data Models

### Alert Data Structure (Existing)

The map component consumes the existing alert data structure:

```typescript
interface HazardAlert {
  id: number;
  vehicle_id: string;
  hazard_type: string;
  latitude: number;
  longitude: number;
  confidence: number;
  verified_at: string;
  tx_hash?: string;
}
```

**Validation Requirements:**
- `latitude`: Must be between -90 and 90
- `longitude`: Must be between -180 and 180
- `hazard_type`: String, used for icon selection
- `confidence`: Number between 0 and 1

### Map State (Internal)

The map component maintains minimal internal state:

```typescript
interface MapState {
  // Leaflet manages zoom, center, and bounds internally
  // No additional state needed beyond props
}
```

## Error Handling

### Invalid Coordinates

**Strategy:** Filter out alerts with invalid coordinates before rendering markers.

```javascript
const validAlerts = alerts.filter(alert => {
  const isValidLat = alert.latitude >= -90 && alert.latitude <= 90;
  const isValidLng = alert.longitude >= -180 && alert.longitude <= 180;
  
  if (!isValidLat || !isValidLng) {
    console.warn(`Invalid coordinates for alert ${alert.id}:`, alert);
    return false;
  }
  
  return true;
});
```

### Missing Dependencies

**Strategy:** Wrap map component in error boundary and provide fallback UI.

```jsx
// In Dashboard.jsx
{mapError ? (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
    <p className="text-red-600">Map visualization unavailable</p>
    <p className="text-sm text-gray-600 mt-2">Please check console for details</p>
  </div>
) : (
  <MapComponent alerts={alerts} />
)}
```

### Leaflet CSS Not Loaded

**Strategy:** Import Leaflet CSS in the component file and verify in build process.

```javascript
import 'leaflet/dist/leaflet.css';
```

If CSS fails to load, map controls will be unstyled but functional. Add a check:

```javascript
useEffect(() => {
  const leafletLoaded = document.querySelector('.leaflet-container');
  if (!leafletLoaded) {
    console.error('Leaflet CSS may not be loaded properly');
  }
}, []);
```

### Empty Alerts Array

**Strategy:** Render empty map with default view. No special handling needed.

```jsx
// Map renders normally with no markers
<MapContainer center={center} zoom={zoom}>
  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
  {validAlerts.map(alert => (
    // Markers render here, empty if no alerts
  ))}
</MapContainer>
```

## Testing Strategy

### Unit Tests

**Component Rendering:**
- Test MapComponent renders without errors
- Test MapComponent renders with empty alerts array
- Test MapComponent renders with valid alerts
- Test custom icon generation for each hazard type

**Data Validation:**
- Test coordinate validation filters invalid data
- Test handling of missing alert properties
- Test handling of undefined/null props

**Example Test:**
```javascript
describe('MapComponent', () => {
  it('should render map with markers for valid alerts', () => {
    const alerts = [
      { id: 1, latitude: 40.7128, longitude: -74.0060, hazard_type: 'accident', confidence: 0.95, verified_at: '2024-01-01T12:00:00Z' }
    ];
    
    render(<MapComponent alerts={alerts} />);
    
    expect(screen.getByRole('region')).toBeInTheDocument();
    // Additional assertions
  });
  
  it('should filter out alerts with invalid coordinates', () => {
    const alerts = [
      { id: 1, latitude: 999, longitude: -74.0060, hazard_type: 'accident', confidence: 0.95, verified_at: '2024-01-01T12:00:00Z' }
    ];
    
    const consoleSpy = jest.spyOn(console, 'warn');
    render(<MapComponent alerts={alerts} />);
    
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid coordinates'));
  });
});
```

### Integration Tests

**Dashboard Integration:**
- Test map updates when alerts state changes
- Test map maintains position during data refresh
- Test map coexists with other dashboard components

**API Integration:**
- Test map displays markers after API fetch completes
- Test map handles API errors gracefully
- Test map updates on polling interval

### Manual Testing Checklist

- [ ] Map loads and displays OpenStreetMap tiles
- [ ] Markers appear at correct coordinates
- [ ] Clicking markers shows popups with correct data
- [ ] Different hazard types show different colored markers
- [ ] Map zoom and pan controls work
- [ ] Map updates when new alerts arrive
- [ ] Map handles empty alerts gracefully
- [ ] Map is responsive on different screen sizes
- [ ] Map performance is acceptable with 50+ markers
- [ ] Console shows no errors or warnings

## Performance Considerations

### Marker Optimization

For large numbers of alerts (100+), consider:
- Marker clustering using `react-leaflet-cluster`
- Viewport-based rendering (only show markers in view)
- Debouncing updates during rapid data changes

**Initial Implementation:** No optimization (suitable for <100 markers)

**Future Enhancement:** Add clustering if performance degrades

### Re-render Optimization

Use React.memo to prevent unnecessary re-renders:

```javascript
const MapComponent = React.memo(({ alerts, center, zoom }) => {
  // Component logic
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if alerts actually changed
  return JSON.stringify(prevProps.alerts) === JSON.stringify(nextProps.alerts);
});
```

### Tile Loading

OpenStreetMap tiles are cached by the browser. No additional optimization needed.

## Accessibility

- Map container has `role="region"` and `aria-label="Hazard alerts map"`
- Keyboard navigation supported by Leaflet (tab to controls, arrow keys to pan)
- Popup content is screen-reader accessible
- Color-coding supplemented with text labels in popups

## Responsive Design

The map component will adapt to different screen sizes:

```jsx
<div className="bg-white rounded-lg shadow mb-8">
  <div className="px-6 py-4 border-b border-gray-200">
    <h2 className="text-xl font-semibold text-gray-800">Hazard Map</h2>
  </div>
  <div className="p-4">
    <MapComponent 
      alerts={alerts} 
      style={{ height: '400px', width: '100%' }} 
    />
  </div>
</div>
```

**Breakpoints:**
- Mobile (<640px): Full width, 300px height
- Tablet (640px-1024px): Full width, 400px height
- Desktop (>1024px): Full width, 500px height

## Implementation Notes

### Leaflet Icon Fix

Leaflet's default marker icons may not load correctly in Vite/Webpack builds. Apply this fix:

```javascript
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;
```

However, since we're using custom icons, this may not be necessary.

### Dependency Installation

Add to `frontend/package.json`:
```json
{
  "dependencies": {
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1"
  }
}
```

### File Structure

```
v2v/frontend/src/
├── components/
│   └── MapComponent.jsx (new)
├── pages/
│   └── Dashboard.jsx (modified)
└── utils/
    └── mapUtils.js (new - icon helpers)
```

## Security Considerations

- OpenStreetMap tiles are loaded over HTTPS
- No user-generated content in map (only system data)
- Coordinate validation prevents injection attacks
- No external scripts loaded beyond Leaflet library

## Future Enhancements

1. **Real-time Updates:** WebSocket integration for instant marker updates
2. **Marker Clustering:** Group nearby markers for better performance
3. **Heatmap Layer:** Visualize hazard density
4. **Route Visualization:** Show vehicle paths
5. **Custom Tile Layers:** Dark mode, satellite view
6. **Geolocation:** Center map on user's location
7. **Export:** Download map as image
8. **Filtering:** Show/hide specific hazard types
