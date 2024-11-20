import React, { useState } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import Map from './Map';

// Libraries required for Google Maps
const libraries = ['places'];

const App = () => {
  // Load the Google Maps API
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY, // API key from environment
    libraries,
  });

  // State for location, map coordinates, pub limit, and route toggle
  const [location, setLocation] = useState(''); // User-entered location
  const [coordinates, setCoordinates] = useState(null); // Coordinates of the location
  const [maxPubs, setMaxPubs] = useState(5); // Maximum pubs to display
  const [generateRoute, setGenerateRoute] = useState(false); // Flag to trigger route generation

  // **New state for mode selection**
  const [mode, setMode] = useState('single'); // 'single' for single location, 'double' for two locations
  const [startLocation, setStartLocation] = useState(''); // Start location for 'double' mode
  const [endLocation, setEndLocation] = useState(''); // End location for 'double' mode

  // Handle location geocoding and route generation
  const handleGenerateCrawl = () => {
    if (!window.google) {
      console.error('Google Maps API is not loaded');
      return;
    }

    const geocoder = new window.google.maps.Geocoder(); // Geocoder instance

    if (mode === 'single') {
      // Single location mode
      geocoder.geocode({ address: location }, (results, status) => {
        if (status === 'OK') {
          const { lat, lng } = results[0].geometry.location; // Extract coordinates
          setCoordinates({ lat: lat(), lng: lng() }); // Set coordinates
          setGenerateRoute(true); // Trigger route generation
        } else {
          console.error('Geocode was not successful:', status);
        }
      });
    } else if (mode === 'double') {
      // Double location mode: Geocode both start and end locations
      const locations = [startLocation, endLocation];

      Promise.all(
        locations.map((loc) =>
          new Promise((resolve, reject) => {
            geocoder.geocode({ address: loc }, (results, status) => {
              if (status === 'OK') {
                resolve({
                  lat: results[0].geometry.location.lat(),
                  lng: results[0].geometry.location.lng(),
                });
              } else {
                reject(`Geocoding failed for ${loc}: ${status}`);
              }
            });
          })
        )
      )
        .then(([startCoords, endCoords]) => {
          setCoordinates({ start: startCoords, end: endCoords });
          setGenerateRoute(true); // Trigger route generation
        })
        .catch((error) => console.error(error));
    }
  };

  if (!isLoaded) return <div>Loading...</div>; // Show a loading message until the API is ready

  return (
    <div>
      <h1>Pub Crawl Route Map</h1>
      {/* Mode selection */}
      <div>
        <label>
          <input
            type="radio"
            value="single"
            checked={mode === 'single'}
            onChange={() => setMode('single')}
          />
          Single Location
        </label>
        <label>
          <input
            type="radio"
            value="double"
            checked={mode === 'double'}
            onChange={() => setMode('double')}
          />
          Two Locations
        </label>
      </div>

      {/* Inputs for single or double location mode */}
      <div>
        {mode === 'single' ? (
          <input
            type="text"
            placeholder="Enter a location (e.g., Holborn)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        ) : (
          <>
            <input
              type="text"
              placeholder="Enter Start Location"
              value={startLocation}
              onChange={(e) => setStartLocation(e.target.value)}
            />
            <input
              type="text"
              placeholder="Enter End Location"
              value={endLocation}
              onChange={(e) => setEndLocation(e.target.value)}
            />
          </>
        )}
      </div>

      <div>
        <label>Max Pubs to Display: </label>
        <input
          type="number"
          min="1"
          value={maxPubs}
          onChange={(e) => setMaxPubs(Number(e.target.value))}
        />
      </div>
      <button onClick={handleGenerateCrawl}>Generate Crawl</button>

      {/* Render the Map component if coordinates are set */}
      {coordinates && (
        <Map
          center={
            mode === 'single'
              ? coordinates // Use single coordinates for single mode
              : coordinates.start // Use start coordinates for two location mode
          }
          maxPubs={maxPubs}
          generateRoute={generateRoute}
        />
      )}
    </div>
  );
};

export default App;
