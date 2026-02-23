import React, { useState } from 'react';
import PubCrawlMap from './Map';
import { geocodeAddress } from './services/geocoding';
import { MAP } from './config/mapConstants';
import './style.css';

const App = () => {
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [maxPubs, setMaxPubs] = useState(5);
  const [generateRoute, setGenerateRoute] = useState(null);
  const [showPubs, setShowPubs] = useState(false);
  const [mode, setMode] = useState('single');
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateCrawl = async () => {
    setError(null);
    setIsGeocoding(true);

    try {
      if (mode === 'single') {
        if (!location.trim()) {
          setError('Please enter a location');
          setIsGeocoding(false);
          return;
        }

        const coords = await geocodeAddress(location, MAP.defaultCenter);
        setCoordinates({ lat: coords.lat, lng: coords.lng });
        setGenerateRoute({ mode: 'single', data: null });
        setShowPubs(true);
      } else if (mode === 'double') {
        if (!startLocation.trim() || !endLocation.trim()) {
          setError('Please enter both start and end locations');
          setIsGeocoding(false);
          return;
        }

        const [startCoords, endCoords] = await Promise.all([
          geocodeAddress(startLocation, MAP.defaultCenter),
          geocodeAddress(endLocation, MAP.defaultCenter),
        ]);

        setCoordinates({ start: startCoords, end: endCoords });
        setGenerateRoute({
          mode: 'double',
          data: { start: startCoords, end: endCoords, evenlyDistribute: true },
        });
        setShowPubs(true);
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      setError(err.message || 'Failed to find location. Please try a different address.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const mapCenter =
    coordinates?.start ?? (coordinates && 'lat' in coordinates ? coordinates : null) ?? MAP.defaultCenter;

  return (
    <div className="app-container">
      <header className="header">
        <h1>Pub Crawl Route Map</h1>
      </header>
      <div className="map-container">
        <div className="form-overlay">
          {error && (
            <div className="form-overlay__error" role="alert">
              {error}
            </div>
          )}

          <div className="form-overlay__row">
            <label className="form-overlay__label">
              <input
                type="radio"
                name="mode"
                value="single"
                checked={mode === 'single'}
                onChange={() => {
                  setMode('single');
                  setError(null);
                }}
              />
              Single Location
            </label>
            <label className="form-overlay__label">
              <input
                type="radio"
                name="mode"
                value="double"
                checked={mode === 'double'}
                onChange={() => {
                  setMode('double');
                  setError(null);
                }}
              />
              Two Locations
            </label>
          </div>

          <div className="form-overlay__row">
            {mode === 'single' ? (
              <input
                type="text"
                placeholder="Enter a location (e.g., Holborn, London)"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleGenerateCrawl();
                  }
                }}
                aria-label="Location"
                disabled={isGeocoding}
              />
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Enter start location"
                  value={startLocation}
                  onChange={(e) => {
                    setStartLocation(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleGenerateCrawl();
                    }
                  }}
                  aria-label="Start location"
                  disabled={isGeocoding}
                />
                <input
                  type="text"
                  placeholder="Enter end location"
                  value={endLocation}
                  onChange={(e) => {
                    setEndLocation(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleGenerateCrawl();
                    }
                  }}
                  aria-label="End location"
                  disabled={isGeocoding}
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
              disabled={isGeocoding}
            />
          </div>
          <button
            type="button"
            className="form-overlay__button"
            onClick={handleGenerateCrawl}
            disabled={isGeocoding}
          >
            {isGeocoding ? 'Finding location...' : 'Generate Crawl'}
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
