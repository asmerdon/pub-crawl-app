import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GoogleMap,
  Marker,
  InfoWindow,
  DirectionsRenderer,
} from '@react-google-maps/api';
import { MAP, PLACES } from './config/mapConstants';

/**
 * Pub crawl map: shows pubs and walking route. Google Maps script must already be loaded (by App).
 */
const PubCrawlMap = ({ center, maxPubs, generateRoute, showPubs }) => {
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [directions, setDirections] = useState(null);
  const placesServiceRef = useRef(null);

  const getPlacesService = useCallback(() => {
    if (!placesServiceRef.current && typeof window !== 'undefined' && window.google?.maps?.places) {
      const div = document.createElement('div');
      placesServiceRef.current = new window.google.maps.places.PlacesService(div);
    }
    return placesServiceRef.current;
  }, []);

  const calculateDistance = useCallback((lat1, lng1, lat2, lng2) => {
    return Math.sqrt((lat2 - lat1) ** 2 + (lng2 - lng1) ** 2);
  }, []);

  const fetchPubs = useCallback(
    (location) => {
      const service = getPlacesService();
      if (!service) return;

      service.nearbySearch(
        {
          location,
          radius: PLACES.radiusMeters,
          keyword: PLACES.keyword,
        },
        (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            const pubsWithDistance = results.map((place) => {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              return {
                lat,
                lng,
                name: place.name,
                rating: place.rating,
                address: place.vicinity,
                distance: calculateDistance(location.lat, location.lng, lat, lng),
              };
            });
            const sorted = pubsWithDistance
              .sort((a, b) => a.distance - b.distance)
              .slice(0, maxPubs);
            setMarkers(sorted);
          } else {
            console.error('Places API Error:', status);
          }
        }
      );
    },
    [getPlacesService, calculateDistance, maxPubs]
  );

  const fetchPubsAlongRoute = useCallback(
    (start, end) => {
      const service = getPlacesService();
      if (!service) return;

      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(start);
      bounds.extend(end);

      service.nearbySearch(
        { bounds, keyword: PLACES.keyword },
        (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            const pubs = results.map((place) => ({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              name: place.name,
              rating: place.rating,
              address: place.vicinity,
            }));
            setMarkers(pubs.slice(0, maxPubs));
          } else {
            console.error('Places API Error:', status);
          }
        }
      );
    },
    [getPlacesService, maxPubs]
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
    if (!generateRoute || markers.length < 2) return;

    const directionsService = new window.google.maps.DirectionsService();
    const origin =
      generateRoute.mode === 'double' ? generateRoute.data.start : markers[0];
    const destination =
      generateRoute.mode === 'double' ? generateRoute.data.end : markers[markers.length - 1];
    const waypoints = markers.slice(1, -1).map((m) => ({
      location: { lat: m.lat, lng: m.lng },
      stopover: true,
    }));

    directionsService.route(
      {
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        waypoints,
        travelMode: window.google.maps.TravelMode.WALKING,
        optimizeWaypoints: true,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          console.error('Directions request failed:', status);
        }
      }
    );
  }, [generateRoute, markers]);

  return (
    <div className="map-wrapper">
      <GoogleMap
        className="google-map"
        mapContainerStyle={MAP.containerStyle}
      center={center}
      zoom={MAP.defaultZoom}
      options={{ styles: MAP.styles }}
    >
      {markers.map((marker, index) => (
        <Marker
          key={`${marker.lat}-${marker.lng}-${marker.name ?? index}`}
          position={{ lat: marker.lat, lng: marker.lng }}
          label={String.fromCharCode(65 + index)}
          onClick={() => setSelectedMarker(marker)}
        />
      ))}

      {selectedMarker && (
        <InfoWindow
          position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
          onCloseClick={() => setSelectedMarker(null)}
        >
          <div className="info-window">
            <h2>{selectedMarker.name}</h2>
            <p>Rating: {selectedMarker.rating ?? 'No rating available'}</p>
            <p>Address: {selectedMarker.address ?? 'No address available'}</p>
          </div>
        </InfoWindow>
      )}

      {directions && (
        <DirectionsRenderer directions={directions} options={{ suppressMarkers: true }} />
      )}
      </GoogleMap>
    </div>
  );
};

export default PubCrawlMap;
