import React, { useState } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import Map from './Map';

const libraries = ['places']; // Include the Places library

const App = () => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [location, setLocation] = useState(''); // Store user-entered location
  const [coordinates, setCoordinates] = useState(null); // Store lat/lng of location
  const [maxPubs, setMaxPubs] = useState(5); // Default max number of pubs to display
  const [pubs, setPubs] = useState([]); // Store fetched pub data

  const handleRouteGeneration = () => {
    if (!window.google) {
      console.error('Google Maps API is not loaded');
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: location }, (results, status) => {
      if (status === 'OK') {
        const { lat, lng } = results[0].geometry.location;
        const center = { lat: lat(), lng: lng() };

        // Pass the center to fetch nearby pubs
        fetchPubs(center);
      } else {
        console.error('Geocode was not successful:', status);
      }
    });
  };

  const fetchPubs = (center) => {
    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    const request = {
      location: center,
      radius: 500, // 0.5km radius
      keyword: 'pub',
    };
  
    service.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        const pubsWithDistance = results
          .map((place) => ({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            name: place.name,
            address: place.vicinity,
          }))
          .filter(
            (pub, index, self) =>
              index === self.findIndex((p) => p.lat === pub.lat && p.lng === pub.lng) // Ensure unique locations
          )
          .slice(0, maxPubs); // Limit the number of pubs
  
        setCoordinates(center); // Set map center
        setPubs(pubsWithDistance); // Update pubs array
      } else {
        console.error('Places API Error:', status);
      }
    });
  };
  

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div>
      <h1>Pub Crawl Route Map</h1>
      <div>
        <input
          type="text"
          placeholder="Enter a location (e.g., Holborn)"
          value={location}
          onChange={(e) => setLocation(e.target.value)} // Update location state
        />
        <label>Max Pubs to Display: </label>
        <input
          type="number"
          min="1"
          value={maxPubs}
          onChange={(e) => setMaxPubs(Number(e.target.value))} // Update max pubs state
        />
        <button onClick={handleRouteGeneration}>Generate Crawl</button>
      </div>
      {coordinates && <Map center={coordinates} pubs={pubs} />} {/* Pass pubs and center */}
    </div>
  );
};

export default App;
