import React, { useState, useEffect } from 'react';
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
  DirectionsRenderer,
} from '@react-google-maps/api';

// Libraries needed for the Places API
const libraries = ['places'];

// CSS style for the map container
const containerStyle = {
  width: '100%',
  height: '500px',
};

// Custom styles to control map appearance
const mapStyles = [
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }], // Hide POIs
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'on' }], // Show transit markers
  },
];

const Map = ({ center, maxPubs, generateRoute }) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY, // API key from environment variables
    libraries, // Include the Places library
  });

  const [markers, setMarkers] = useState([]); // Markers for pubs
  const [selectedMarker, setSelectedMarker] = useState(null); // Selected pub marker
  const [directions, setDirections] = useState(null); // Route directions

  // Fetch pubs whenever the `center` changes
  useEffect(() => {
    if (center && generateRoute?.mode === 'single') {
      fetchPubs(center);
    }
  }, [center]);

  // Generate the route whenever `generateRoute` changes
  useEffect(() => {
    if (generateRoute) {
      if (generateRoute.mode === 'single' && markers.length > 1) {
        generateRouteHandlerSingle();
      } else if (
        generateRoute.mode === 'double' &&
        generateRoute.data &&
        generateRoute.data.start &&
        generateRoute.data.end
      ) {
        fetchPubsAlongRoute(generateRoute.data.start, generateRoute.data.end);
      }
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

  // Fetch pubs along the route for two-location mode
  const fetchPubsAlongRoute = (start, end) => {
    const directionsService = new window.google.maps.DirectionsService();

    // Request directions between start and end
    directionsService.route(
      {
        origin: start,
        destination: end,
        travelMode: window.google.maps.TravelMode.WALKING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          const routePath = result.routes[0].overview_path; // Get the route path

          const placesService = new window.google.maps.places.PlacesService(
            document.createElement('div')
          );

          // Fetch pubs along the route
          const pubsAlongRoute = [];
          const requests = routePath.map((point) =>
            new Promise((resolve) => {
              placesService.nearbySearch(
                {
                  location: { lat: point.lat(), lng: point.lng() },
                  radius: 500, // 500m radius
                  keyword: 'pub',
                },
                (results, status) => {
                  if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                    resolve(results);
                  } else {
                    resolve([]); // Return empty if no pubs found
                  }
                }
              );
            })
          );

          Promise.all(requests).then((results) => {
            results.forEach((pubs) => {
              pubs.forEach((pub) => {
                pubsAlongRoute.push({
                  lat: pub.geometry.location.lat(),
                  lng: pub.geometry.location.lng(),
                  name: pub.name,
                  rating: pub.rating,
                  address: pub.vicinity,
                });
              });
            });

            // Deduplicate pubs and set as markers
            const uniquePubs = Array.from(
              new window.Map( // Explicitly use window.Map to avoid conflicts
                pubsAlongRoute.map((pub) => [
                  `${pub.lat},${pub.lng}`, // Use lat/lng as a unique key
                  pub,
                ])
              ).values()
            );

            setMarkers(uniquePubs); // Update markers along the route
            setDirections(result); // Update directions state
          });
        } else {
          console.error('Directions request failed:', status);
        }
      }
    );
  };

  // Generate a route for single location mode
  const generateRouteHandlerSingle = () => {
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
      mapContainerStyle={containerStyle}
      center={center}
      zoom={15}
      options={{ styles: mapStyles }}
    >
      {/* Render a marker for each pub */}
      {markers.map((marker, index) => (
        <Marker
          key={index}
          position={{ lat: marker.lat, lng: marker.lng }}
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
