import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { searchPubsNearby, searchPubsAlongRoute } from './services/pubSearch';
import { getRoute } from './services/routing';
import { MAP } from './config/mapConstants';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/**
 * Component to update map view when center changes.
 */
function MapViewUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], zoom);
    }
  }, [center, zoom, map]);
  return null;
}

/**
 * Pub crawl map using Leaflet (OpenStreetMap).
 */
const PubCrawlMap = ({ center, maxPubs, generateRoute, showPubs }) => {
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [routeGeometry, setRouteGeometry] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPubs = useCallback(
    async (location) => {
      setIsLoading(true);
      try {
        const pubs = await searchPubsNearby(location, MAP.searchRadius, maxPubs);
        setMarkers(pubs);
      } catch (error) {
        console.error('Failed to fetch pubs:', error);
        setMarkers([]);
      } finally {
        setIsLoading(false);
      }
    },
    [maxPubs]
  );

  const fetchPubsAlongRoute = useCallback(
    async (start, end) => {
      setIsLoading(true);
      try {
        const pubs = await searchPubsAlongRoute(start, end, maxPubs);
        setMarkers(pubs);
      } catch (error) {
        console.error('Failed to fetch pubs along route:', error);
        setMarkers([]);
      } finally {
        setIsLoading(false);
      }
    },
    [maxPubs]
  );

  useEffect(() => {
    if (!showPubs || !center) return;
    if (generateRoute?.mode === 'double' && generateRoute?.data) {
      fetchPubsAlongRoute(generateRoute.data.start, generateRoute.data.end);
    } else {
      fetchPubs(center);
    }
  }, [showPubs, center, generateRoute, fetchPubs, fetchPubsAlongRoute]);

  useEffect(() => {
    if (!generateRoute) {
      setRouteGeometry(null);
      return;
    }
    if (generateRoute.mode === 'single' && markers.length < 2) {
      setRouteGeometry(null);
      return;
    }
    if (generateRoute.mode === 'double' && !generateRoute.data) {
      setRouteGeometry(null);
      return;
    }

    const generateRouteLine = async () => {
      try {
        let waypoints;
        let optimize;
        if (generateRoute.mode === 'double') {
          waypoints = [
            generateRoute.data.start,
            ...markers,
            generateRoute.data.end,
          ];
          optimize = false; // keep order: start → pubs → end
        } else {
          waypoints = markers;
          optimize = true;
        }

        const route = await getRoute(waypoints, optimize);
        setRouteGeometry(route.geometry);
      } catch (error) {
        console.error('Failed to generate route:', error);
        setRouteGeometry(null);
      }
    };

    generateRouteLine();
  }, [generateRoute, markers]);

  // Create custom markers with labels (A, B, C...)
  const createCustomIcon = (label) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div class="marker-label">${label}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  };

  return (
    <div className="map-wrapper">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={MAP.defaultZoom}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
      >
        <MapViewUpdater center={center} zoom={MAP.defaultZoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
        />

        {markers.map((marker, index) => {
          const label = String.fromCharCode(65 + index);
          return (
            <Marker
              key={`${marker.lat}-${marker.lng}-${marker.name ?? index}`}
              position={[marker.lat, marker.lng]}
              icon={createCustomIcon(label)}
              eventHandlers={{
                click: () => setSelectedMarker(marker),
              }}
            >
              <Popup>
                <div className="info-window">
                  <h2>{marker.name}</h2>
                  {marker.rating && <p>Rating: {marker.rating}</p>}
                  <p>Address: {marker.address || 'No address available'}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {routeGeometry && (
          <Polyline
            positions={routeGeometry}
            pathOptions={{
              color: '#ea580c',
              weight: 5,
              opacity: 0.8,
            }}
          />
        )}
      </MapContainer>
      {isLoading && (
        <div className="map-loading">
          <div className="map-loading__spinner">Loading pubs...</div>
        </div>
      )}
    </div>
  );
};

export default PubCrawlMap;
