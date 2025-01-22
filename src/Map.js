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
  height: '1000px',
};

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

const Map = ({ center, maxPubs, generateRoute }) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [directions, setDirections] = useState(null);

  useEffect(() => {
    if (generateRoute?.mode === 'double' && generateRoute.data) {
      fetchPubsAlongRoute(generateRoute.data.start, generateRoute.data.end);
    } else if (center) {
      fetchPubs(center);
    }
  }, [center, generateRoute]);

  useEffect(() => {
    if (generateRoute && markers.length > 1) {
      generateRouteHandler();
    }
  }, [generateRoute, markers]);

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    return Math.sqrt((lat2 - lat1) ** 2 + (lng2 - lng1) ** 2);
  };

  const fetchPubs = (location) => {
    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    const request = {
      location,
      radius: 500,
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
          .sort((a, b) => a.distance - b.distance)
          .slice(0, maxPubs);

        setMarkers(sortedPubs);
      } else {
        console.error('Places API Error:', status);
      }
    });
  };

  const fetchPubsAlongRoute = (start, end) => {
    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(start);
    bounds.extend(end);

    const request = {
      bounds,
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
        setMarkers(pubs.slice(0, maxPubs));
      } else {
        console.error('Places API Error:', status);
      }
    });
  };

  const generateRouteHandler = () => {
    const directionsService = new window.google.maps.DirectionsService();

    const waypoints = markers.map((marker) => ({
      location: { lat: marker.lat, lng: marker.lng },
      stopover: true,
    }));

    const routeRequest = {
      origin: generateRoute.mode === 'double' ? generateRoute.data.start : markers[0],
      destination: generateRoute.mode === 'double' ? generateRoute.data.end : markers[0],
      waypoints,
      travelMode: window.google.maps.TravelMode.WALKING,
      optimizeWaypoints: true,
    };

    directionsService.route(routeRequest, (result, status) => {
      if (status === window.google.maps.DirectionsStatus.OK) {
        setDirections(result);
      } else {
        console.error('Directions request failed:', status);
      }
    });
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <GoogleMap
      className="google-map"
      mapContainerStyle={containerStyle}
      center={center}
      zoom={15}
      options={{ styles: mapStyles }}
    >
      {markers.map((marker, index) => (
        <Marker
          key={index}
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
          <div>
            <h2>{selectedMarker.name}</h2>
            <p>Rating: {selectedMarker.rating || 'No rating available'}</p>
            <p>Address: {selectedMarker.address || 'No address available'}</p>
          </div>
        </InfoWindow>
      )}

      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{ suppressMarkers: true }}
        />
      )}
    </GoogleMap>
  );
};

export default Map;
