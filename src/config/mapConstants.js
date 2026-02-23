/**
 * Leaflet (OpenStreetMap) and pub crawl configuration.
 * No API keys required - uses free open-source services.
 */

export const MAP = {
  defaultCenter: { lat: 51.5074, lng: -0.1278 }, // London
  defaultZoom: 15,
  searchRadius: 500, // meters
};

export const PLACES = {
  keyword: 'pub',
  radiusMeters: 500,
  maxPubsDefault: 5,
};
