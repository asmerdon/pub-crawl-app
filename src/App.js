import React, { useState } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import Map from './Map';
import './style.css';

const libraries = ['places'];

const App = () => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [maxPubs, setMaxPubs] = useState(5);
  const [generateRoute, setGenerateRoute] = useState(false);
  const [mode, setMode] = useState('single');
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');

  const defaultCenter = { lat: 51.5074, lng: -0.1278 };

  const handleGenerateCrawl = () => {
    if (!window.google) {
      console.error('Google Maps API is not loaded');
      return;
    }

    const geocoder = new window.google.maps.Geocoder();

    if (mode === 'single') {
      geocoder.geocode({ address: location }, (results, status) => {
        if (status === 'OK') {
          const { lat, lng } = results[0].geometry.location;
          setCoordinates({ lat: lat(), lng: lng() });
          setGenerateRoute({ mode: 'single', data: null });
        } else {
          console.error('Geocode was not successful:', status);
        }
      });
    } else if (mode === 'double') {
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
          setGenerateRoute({ mode: 'double', data: { start: startCoords, end: endCoords } });
        })
        .catch((error) => console.error(error));
    }
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="app-container">
      <header className="header">
        <h1>Pub Crawl Route Map</h1>
      </header>
      <div className="map-container">
        <div className="form-overlay">
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
        </div>

        <Map
          center={coordinates?.start || coordinates || defaultCenter}
          maxPubs={maxPubs}
          generateRoute={generateRoute}
        />
      </div>
    </div>
  );
};

export default App;
