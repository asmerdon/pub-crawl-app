import React, { useState, useEffect } from 'react';
import {
  GoogleMap, // Main component for rendering the map
  useLoadScript, // Hook to load the Google Maps API script
  Marker, // Component to display markers on the map
  InfoWindow, // Component to show additional info about markers
  DirectionsRenderer, // Component to render routes on the map
} from '@react-google-maps/api';

// Libraries needed for the Places API
const libraries = ['places'];

// CSS style for the map container
const containerStyle = {
  width: '100%', // Full width
  height: '500px', // 500px height
};

// Custom styles to control map appearance
const mapStyles = [
  {
    featureType: 'poi', // Points of Interest (e.g., shops, cafes)
    stylers: [{ visibility: 'off' }], // Hide POIs
  },
  {
    featureType: 'transit', // Transit markers (e.g., bus stops, stations)
    stylers: [{ visibility: 'on' }], // Show transit markers
  },
];

const Map = ({ center, maxPubs, generateRoute }) => {
  // Load the Google Maps API and required libraries
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY, // API key from environment variables
    libraries, // Include the Places library
  });

  // State to store markers, selected marker, and directions
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [directions, setDirections] = useState(null);

  // Fetch pubs whenever the `center` changes
  useEffect(() => {
    if (center) {
      fetchPubs(center);
    }
  }, [center]);

  // Generate the route whenever `generateRoute` is true and markers are set
  useEffect(() => {
    if (generateRoute && markers.length > 1) {
      generateRouteHandler();
    }
  }, [generateRoute, markers]);

  // Calculate distance between two coordinates (Euclidean approximation)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    return Math.sqrt((lat2 - lat1) ** 2 + (lng2 - lng1) ** 2);
  };

  // Fetch nearby pubs using the Places API
  const fetchPubs = (location) => {
    const service = new window.google.maps.places.PlacesService(document.createElement('div')); // Create a temporary DOM node
    const request = {
      location, // Center of the search
      radius: 500, // 500 meters radius
      keyword: 'pub', // Search for pubs
    };

    // Perform a nearby search
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
            name: place.name, // Pub name
            rating: place.rating, // Pub rating
            address: place.vicinity, // Pub address
            distance, // Distance from center
          };
        });

        // Sort pubs by distance and limit the results to `maxPubs`
        const sortedPubs = pubsWithDistance
          .sort((a, b) => a.distance - b.distance)
          .slice(0, maxPubs);

        setMarkers(sortedPubs); // Update markers state
      } else {
        console.error('Places API Error:', status);
      }
    });
  };

  // Generate a route between the markers
  const generateRouteHandler = () => {
    const directionsService = new window.google.maps.DirectionsService(); // Create DirectionsService instance

    // Convert markers into waypoints for the route
    const waypoints = markers.slice(1).map((marker) => ({
      location: { lat: marker.lat, lng: marker.lng },
      stopover: true, // Indicates this is a stop along the route
    }));

    // Request directions
    directionsService.route(
      {
        origin: { lat: markers[0].lat, lng: markers[0].lng }, // Starting point
        destination: { lat: markers[0].lat, lng: markers[0].lng }, // Loop back to the starting point
        waypoints,
        travelMode: window.google.maps.TravelMode.WALKING, // Walking route
        optimizeWaypoints: true, // Optimize the waypoint order
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result); // Update directions state with the result
        } else {
          console.error('Directions request failed due to ', status);
        }
      }
    );
  };

  if (!isLoaded) return <div>Loading...</div>; // Show a loading message until the API is ready

  return (
    <GoogleMap
      mapContainerStyle={containerStyle} // Map container styling
      center={center} // Center of the map
      zoom={15} // Zoom level
      options={{ styles: mapStyles }} // Apply custom styles
    >
      {/* Render a marker for each pub */}
      {markers.map((marker, index) => (
        <Marker
          key={index}
          position={{ lat: marker.lat, lng: marker.lng }} // Pub's coordinates
          label={String.fromCharCode(65 + index)} // Label markers as A, B, C, etc.
          onClick={() => setSelectedMarker(marker)} // Open info window on click
        />
      ))}

      {/* Show info about the selected marker */}
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

      {/* Render the route if directions are available */}
      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{
            suppressMarkers: true, // Hide route-generated markers
          }}
        />
      )}
    </GoogleMap>
  );
};

export default Map;
