import React, { useState, useEffect } from 'react';
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
  DirectionsRenderer,
} from '@react-google-maps/api';

const libraries = ['places'];

const containerStyle = {
  width: '100%',
  height: '500px',
};

const mapStyles = [
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }], // Hide all POIs
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'on' }], // Show transit markers
  },
];

const Map = ({ center, pubs }) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [selectedMarker, setSelectedMarker] = useState(null);
  const [directions, setDirections] = useState(null);

  // Clear previous directions when pubs change
  useEffect(() => {
    setDirections(null); // Reset the route
    setSelectedMarker(null); // Clear any selected marker
    generateRoute();
  }, [pubs]);

  const generateRoute = () => {
    if (pubs.length > 1) {
      const directionsService = new window.google.maps.DirectionsService();
      const waypoints = pubs.slice(1).map((pub) => ({
        location: { lat: pub.lat, lng: pub.lng },
        stopover: true,
      }));

      directionsService.route(
        {
          origin: { lat: pubs[0].lat, lng: pubs[0].lng }, // Start at the first pub
          destination: { lat: pubs[0].lat, lng: pubs[0].lng }, // End at the first pub (loop)
          waypoints: waypoints,
          travelMode: window.google.maps.TravelMode.WALKING,
          optimizeWaypoints: true, // Optimize waypoint order
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirections(result);
          } else {
            console.error('Directions request failed due to ', status);
          }
        }
      );
    }
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={15}
      options={{ styles: mapStyles }}
    >
      {/* Render markers */}
      {pubs.map((pub, index) => (
        <Marker
          key={`${pub.lat}-${pub.lng}-${index}`} // Use unique keys to force re-rendering
          position={{ lat: pub.lat, lng: pub.lng }}
          label={String.fromCharCode(65 + index)} // A, B, C, etc.
          title={pub.name} // Tooltip showing pub name
          onClick={() => setSelectedMarker(pub)}
        />
      ))}

      {/* InfoWindow for selected marker */}
      {selectedMarker && (
        <InfoWindow
          position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
          onCloseClick={() => setSelectedMarker(null)}
        >
          <div>
            <h2>{selectedMarker.name}</h2>
            <p>Address: {selectedMarker.address || 'No address available'}</p>
          </div>
        </InfoWindow>
      )}

      {/* DirectionsRenderer for the route */}
      {directions && <DirectionsRenderer directions={directions} />}
    </GoogleMap>
  );
};

export default Map;
