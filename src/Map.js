import React, { useState, useEffect } from 'react';
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
  DirectionsRenderer,
} from '@react-google-maps/api';

// Specify the libraries required for the Google Maps API
const libraries = ['places'];

// Define the size of the map container
const containerStyle = {
  width: '100%',
  height: '1000px',
};

// Custom map styles to hide points of interest and emphasize transit
const mapStyles = [
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'on' }],
  },
];

const PubCrawlMap = ({ center, maxPubs, generateRoute, showPubs }) => {
  // Load the Google Maps API script
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // State variables
  const [markers, setMarkers] = useState([]); // Stores details of pubs
  const [selectedMarker, setSelectedMarker] = useState(null); // Tracks selected pub
  const [directions, setDirections] = useState(null); // Stores directions for the route

  // Fetch pubs based on the center or generateRoute data
  useEffect(() => {
    if (showPubs && center) {
      if (generateRoute?.mode === 'double' && generateRoute.data) {
        fetchPubsAlongRoute(generateRoute.data.start, generateRoute.data.end);
      } else {
        fetchPubs(center);
      }
    }
  }, [showPubs, center, generateRoute]);

  // Generate the route once pubs (markers) and generateRoute details are available
  useEffect(() => {
    if (generateRoute && markers.length > 1) {
      generateRouteHandler();
    }
  }, [generateRoute, markers]);

  // Utility function to calculate distance between two coordinates
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    return Math.sqrt((lat2 - lat1) ** 2 + (lng2 - lng1) ** 2);
  };

  // Fetch pubs near a specific location
  const fetchPubs = (location) => {
    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    const request = {
      location,
      radius: 500, // Search within a 500-meter radius
      keyword: 'pub',
    };

    service.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        const pubsWithDistance = results.map((place) => {
          const distance = calculateDistance(
            location.lat,
            location.lng,
            place.geometry.location.lat(),
            place.geometry.location.lng()
          );
          return {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            name: place.name,
            rating: place.rating,
            address: place.vicinity,
            distance,
          };
        });

        const sortedPubs = pubsWithDistance
          .sort((a, b) => a.distance - b.distance) // Sort pubs by proximity
          .slice(0, maxPubs); // Limit to the specified number of pubs

        setMarkers(sortedPubs); // Update the state with sorted pubs
      } else {
        console.error('Places API Error:', status);
      }
    });
  };

  // Fetch pubs along a route defined by a start and end point
  const fetchPubsAlongRoute = (start, end) => {
    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(start);
    bounds.extend(end);

    const request = {
      bounds, // Define the search area using bounds
      keyword: 'pub',
    };

    service.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        const pubs = results.map((place) => ({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          name: place.name,
          rating: place.rating,
          address: place.vicinity,
        }));
        setMarkers(pubs.slice(0, maxPubs)); // Limit results to maxPubs
      } else {
        console.error('Places API Error:', status);
      }
    });
  };

  // Generate a walking route connecting the pubs
  const generateRouteHandler = () => {
    const directionsService = new window.google.maps.DirectionsService();

    // Define the starting and ending points dynamically
    const origin = generateRoute.mode === 'double' ? generateRoute.data.start : markers[0];
    const destination = generateRoute.mode === 'double' ? generateRoute.data.end : markers[markers.length - 1];

    // Add intermediate pubs as waypoints
    const waypoints = markers.slice(1, -1).map((marker) => ({
      location: { lat: marker.lat, lng: marker.lng },
      stopover: true,
    }));

    const routeRequest = {
      origin: { lat: origin.lat, lng: origin.lng },
      destination: { lat: destination.lat, lng: destination.lng },
      waypoints,
      travelMode: window.google.maps.TravelMode.WALKING,
      optimizeWaypoints: true, // Optimize the waypoint order
    };

    directionsService.route(routeRequest, (result, status) => {
      if (status === window.google.maps.DirectionsStatus.OK) {
        setDirections(result); // Save the directions result to state
      } else {
        console.error('Directions request failed:', status);
      }
    });
  };

  // Display a loading message if the Google Maps API is not ready
  if (!isLoaded) return <div>Loading...</div>;

  return (
    <GoogleMap
      className="google-map"
      mapContainerStyle={containerStyle}
      center={center} // Center the map on the provided coordinates
      zoom={15} // Set the zoom level
      options={{ styles: mapStyles }} // Apply custom styles
    >
      {markers.map((marker, index) => (
        <Marker
          key={index} // Unique key for each marker
          position={{ lat: marker.lat, lng: marker.lng }} // Marker position
          label={String.fromCharCode(65 + index)} // Assign labels (A, B, C...)
          onClick={() => setSelectedMarker(marker)} // Show info window on click
        />
      ))}

      {selectedMarker && (
        <InfoWindow
          position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
          onCloseClick={() => setSelectedMarker(null)} // Close the info window
        >
          <div>
            <h2>{selectedMarker.name}</h2>
            <p>Rating: {selectedMarker.rating || 'No rating available'}</p>
            <p>Address: {selectedMarker.address || 'No address available'}</p>
          </div>
        </InfoWindow>
      )}

      {directions && (
        <DirectionsRenderer
          directions={directions} // Render the directions
          options={{ suppressMarkers: true }} // Suppress default markers
        />
      )}
    </GoogleMap>
  );
};

export default PubCrawlMap;
