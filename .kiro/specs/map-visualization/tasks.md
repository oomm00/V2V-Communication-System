# Implementation Plan

- [x] 1. Install required dependencies





  - Install leaflet and react-leaflet packages in frontend directory
  - Verify installation by checking package.json
  - _Requirements: 1.1, 1.3_

- [x] 2. Create map utility functions




  - [x] 2.1 Create mapUtils.js file with icon generation function


    - Implement getMarkerIcon function that returns Leaflet divIcon based on hazard type
    - Define color mapping for accident (red), ice (blue), debris (amber), and default (gray)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 2.2 Create coordinate validation function

    - Implement validateCoordinates function to check latitude and longitude ranges
    - Add console warning for invalid coordinates
    - _Requirements: 5.2_

- [x] 3. Create MapComponent




  - [x] 3.1 Create MapComponent.jsx file with basic structure


    - Import Leaflet, React-Leaflet components, and CSS
    - Define component with props interface (alerts, center, zoom)
    - Set default center to [40.7128, -74.0060] and zoom to 13


    - _Requirements: 1.1, 1.3, 1.4_
  - [x] 3.2 Implement MapContainer with TileLayer




    - Add MapContainer with center, zoom, and style props


    - Add OpenStreetMap TileLayer with proper attribution
    - Set minimum height to 400px
    - _Requirements: 1.1, 1.3, 1.4_


  - [x] 3.3 Implement marker rendering logic




    - Filter alerts using coordinate validation
    - Map over valid alerts to create Marker components


    - Apply custom icons using getMarkerIcon utility
    - _Requirements: 1.2, 3.1, 3.2, 3.3, 3.4, 3.5, 5.2_
  - [x] 3.4 Implement popup content


    - Add Popup component inside each Marker
    - Display hazard type, coordinates, confidence, and timestamp
    - Style popup content with Tailwind classes
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 3.5 Add error handling





    - Handle empty alerts array gracefully
    - Add console warnings for invalid data
    - Handle missing alert properties with optional chaining
    - _Requirements: 5.1, 5.2, 5.4_
  - [x] 3.6 Add React.memo optimization




    - Wrap component with React.memo
    - Implement custom comparison function for alerts prop
    - _Requirements: 4.3_

- [x] 4. Integrate MapComponent into Dashboard






  - [x] 4.1 Import MapComponent in Dashboard.jsx

    - Add import statement for MapComponent
    - Import Leaflet CSS in Dashboard or MapComponent
    - _Requirements: 1.1_
  - [x] 4.2 Add map section to Dashboard layout


    - Create new section between metrics cards and alerts table
    - Add container with title "Hazard Map"
    - Apply consistent styling with other dashboard sections
    - _Requirements: 1.1_

  - [x] 4.3 Pass alerts data to MapComponent

    - Pass alerts state as prop to MapComponent
    - Map component will automatically update when alerts change due to existing polling
    - _Requirements: 1.2, 4.1, 4.2_
  - [x] 4.4 Add error boundary for map failures


    - Wrap MapComponent in try-catch or error boundary
    - Display fallback UI if map fails to load
    - _Requirements: 5.3_

- [x] 5. Add responsive styling





  - [x] 5.1 Implement responsive height breakpoints


    - Use Tailwind responsive classes for map container height
    - Set mobile (300px), tablet (400px), desktop (500px) heights
    - _Requirements: 5.5_
  - [x] 5.2 Ensure map width is responsive


    - Set map width to 100% of container
    - Test on different screen sizes
    - _Requirements: 5.5_

- [x] 6. Manual testing and validation





  - Test map loads with OpenStreetMap tiles
  - Test markers appear at correct coordinates
  - Test popup displays correct information
  - Test color-coded markers for different hazard types
  - Test map with empty alerts array
  - Test map with invalid coordinates
  - Test zoom and pan controls
  - Test automatic updates when alerts change
  - Test responsive behavior on mobile, tablet, desktop
  - _Requirements: All_
