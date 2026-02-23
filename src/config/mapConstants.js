/**
 * Google Maps and pub crawl configuration.
 * API key is read from process.env.REACT_APP_GOOGLE_MAPS_API_KEY (see .env.example).
 */

export const MAP = {
  defaultCenter: { lat: 51.5074, lng: -0.1278 },
  defaultZoom: 15,
  containerStyle: {
    width: '100%',
    height: '100%',
    minHeight: '500px',
  },
  styles: [
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'on' }] },
  ],
};

export const PLACES = {
  keyword: 'pub',
  radiusMeters: 500,
  maxPubsDefault: 5,
};
