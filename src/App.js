import React, { useState } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import PubCrawlMap from './Map';
import { MAP } from './config/mapConstants';
import './style.css';

const GOOGLE_MAPS_LIBRARIES = ['places'];

const App = () => {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [maxPubs, setMaxPubs] = useState(5);
  const [generateRoute, setGenerateRoute] = useState(null);
  const [showPubs, setShowPubs] = useState(false);
  const [mode, setMode] = useState('single');
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');

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
          setShowPubs(true);
        } else {
          console.error('Geocode was not successful:', status);
        }
      });
    } else if (mode === 'double') {
      Promise.all(
        [startLocation, endLocation].map(
          (address) =>
            new Promise((resolve, reject) => {
              geocoder.geocode({ address }, (results, status) => {
                if (status === 'OK') {
                  resolve({
                    lat: results[0].geometry.location.lat(),
                    lng: results[0].geometry.location.lng(),
                  });
                } else {
                  reject(new Error(`Geocoding failed for "${address}": ${status}`));
                }
              });
            })
        )
      )
        .then(([startCoords, endCoords]) => {
          setCoordinates({ start: startCoords, end: endCoords });
          setGenerateRoute({
            mode: 'double',
            data: { start: startCoords, end: endCoords, evenlyDistribute: true },
          });
          setShowPubs(true);
        })
        .catch((err) => console.error(err));
    }
  };

  if (!apiKey) {
    return (
      <div className="app-container">
        <header className="header">
          <h1>Pub Crawl Route Map</h1>
        </header>
        <div className="map-container map-container--message">
          <p className="api-key-message">
            Add your Google Maps API key to run the app. Copy <code>.env.example</code> to{' '}
            <code>.env</code> and set <code>REACT_APP_GOOGLE_MAPS_API_KEY</code>. Enable Maps
            JavaScript API, Places API, and Directions API (and billing if you want to remove the
            development watermark).
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="app-container">
        <header className="header">
          <h1>Pub Crawl Route Map</h1>
        </header>
        <div className="map-container map-container--message">
          <p className="api-key-message">Failed to load Google Maps. Check your API key and console.</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="app-container">
        <header className="header">
          <h1>Pub Crawl Route Map</h1>
        </header>
        <div className="map-container map-container--message">
          <p className="api-key-message">Loading map…</p>
        </div>
      </div>
    );
  }

  const mapCenter =
    coordinates?.start ?? (coordinates && 'lat' in coordinates ? coordinates : null) ?? MAP.defaultCenter;

  return (
    <div className="app-container">
      <header className="header">
        <h1>Pub Crawl Route Map</h1>
      </header>
      <div className="map-container">
        <div className="form-overlay">
          <div className="form-overlay__row">
            <label className="form-overlay__label">
              <input
                type="radio"
                name="mode"
                value="single"
                checked={mode === 'single'}
                onChange={() => setMode('single')}
              />
              Single Location
            </label>
            <label className="form-overlay__label">
              <input
                type="radio"
                name="mode"
                value="double"
                checked={mode === 'double'}
                onChange={() => setMode('double')}
              />
              Two Locations
            </label>
          </div>

          <div className="form-overlay__row">
            {mode === 'single' ? (
              <input
                type="text"
                placeholder="Enter a location (e.g., Holborn)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                aria-label="Location"
              />
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Enter start location"
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                  aria-label="Start location"
                />
                <input
                  type="text"
                  placeholder="Enter end location"
                  value={endLocation}
                  onChange={(e) => setEndLocation(e.target.value)}
                  aria-label="End location"
                />
              </>
            )}
          </div>

          <div className="form-overlay__row">
            <label htmlFor="max-pubs">Max pubs to display</label>
            <input
              id="max-pubs"
              type="number"
              min={1}
              max={20}
              value={maxPubs}
              onChange={(e) => setMaxPubs(Number(e.target.value))}
            />
          </div>
          <button type="button" className="form-overlay__button" onClick={handleGenerateCrawl}>
            Generate Crawl
          </button>
        </div>

        <PubCrawlMap
          center={mapCenter}
          maxPubs={maxPubs}
          generateRoute={generateRoute}
          showPubs={showPubs}
        />
      </div>
    </div>
  );
};

export default App;
