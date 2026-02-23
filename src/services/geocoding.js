/**
 * Geocoding service. Uses Photon (Komoot) – OSM-based, works from the browser (CORS-friendly).
 * Nominatim blocks browser requests (no CORS), so we use Photon instead.
 * Free, no API key required.
 */

const PHOTON_BASE_URL = 'https://photon.komoot.io/api/';

/**
 * Geocode an address to coordinates.
 * @param {string} address - Address or location name (e.g., "Holborn, London")
 * @param {{lat: number, lng: number}} [bias] - Optional. Bias results to this location (e.g. London) so "Greenwich" → London, not Connecticut
 * @returns {Promise<{lat: number, lng: number, displayName?: string}>}
 */
export const geocodeAddress = async (address, bias) => {
  const url = new URL(PHOTON_BASE_URL);
  url.searchParams.set('q', address);
  url.searchParams.set('limit', bias ? '5' : '1');
  url.searchParams.set('lang', 'en');
  if (bias) {
    url.searchParams.set('lat', bias.lat.toString());
    url.searchParams.set('lon', bias.lng.toString());
  }

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data.features || data.features.length === 0) {
      throw new Error(`No results found for "${address}"`);
    }

    // With bias, pick the result closest to the bias point (so "Greenwich" → London, not Greenwich CT)
    let feature = data.features[0];
    if (bias && data.features.length > 1) {
      const biasLat = bias.lat;
      const biasLng = bias.lng;
      let best = data.features[0];
      let bestD = Infinity;
      for (const f of data.features) {
        const [lon, lat] = f.geometry.coordinates;
        const d = (lat - biasLat) ** 2 + (lon - biasLng) ** 2;
        if (d < bestD) {
          bestD = d;
          best = f;
        }
      }
      feature = best;
    } else {
      feature = data.features[0];
    }
    const [lng, lat] = feature.geometry.coordinates;
    const displayName =
      feature.properties?.name ||
      [feature.properties?.street, feature.properties?.city, feature.properties?.country]
        .filter(Boolean)
        .join(', ') ||
      address;

    return {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      displayName,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
};

/**
 * Reverse geocode coordinates to an address.
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>} Display name/address
 */
export const reverseGeocode = async (lat, lng) => {
  const url = new URL('https://photon.komoot.io/reverse');
  url.searchParams.set('lon', lng.toString());
  url.searchParams.set('lat', lat.toString());
  url.searchParams.set('limit', '1');

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data.features || data.features.length === 0) {
      return `${lat}, ${lng}`;
    }

    const f = data.features[0].properties;
    return [f?.name, f?.street, f?.city, f?.country].filter(Boolean).join(', ') || `${lat}, ${lng}`;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
};
