/**
 * Pub/POI search using Photon (Komoot) – same API as geocoding, CORS-friendly.
 * Overpass was causing 504 timeouts and 429 rate limits; Photon is more reliable from the browser.
 */

import { getRoutePath } from './routing';

const PHOTON_BASE_URL = 'https://photon.komoot.io/api/';

/** Short delay between multiple requests (e.g. along route) to be nice to the server. */
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const REQUEST_DELAY_MS = 500;

/**
 * Build address string from Photon feature properties.
 */
function buildAddress(props) {
  if (!props) return null;
  const parts = [
    props.street,
    props.housenumber,
    props.postcode,
    props.city,
    props.country,
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

/**
 * Search for pubs near a location using Photon (text search "pub" biased by lat/lon).
 * @param {{lat: number, lng: number}} center - Center coordinates
 * @param {number} radiusMeters - Ignored by Photon; kept for API compatibility
 * @param {number} maxResults - Maximum number of results
 * @returns {Promise<Array<{lat: number, lng: number, name: string, address?: string}>>}
 */
export const searchPubsNearby = async (center, radiusMeters = 500, maxResults = 20) => {
  const url = new URL(PHOTON_BASE_URL);
  url.searchParams.set('q', 'pub');
  url.searchParams.set('lat', center.lat.toString());
  url.searchParams.set('lon', center.lng.toString());
  url.searchParams.set('limit', Math.min(maxResults, 50).toString());
  url.searchParams.set('lang', 'en');

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Photon API error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.features || data.features.length === 0) {
      return [];
    }

    const pubs = data.features.map((feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      const props = feature.properties || {};
      return {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        name: props.name || 'Unnamed Pub',
        address: buildAddress(props),
        rating: null,
      };
    });

    return pubs.slice(0, maxResults);
  } catch (error) {
    console.error('Pub search error:', error);
    throw error;
  }
};

/**
 * Sample N points evenly along a path (by distance).
 */
function samplePathEvenly(path, count) {
  if (path.length < 2 || count < 1) return [];

  const distances = [0];
  for (let i = 1; i < path.length; i++) {
    const d = distanceBetween(path[i - 1], path[i]);
    distances[i] = distances[i - 1] + d;
  }
  const total = distances[distances.length - 1];
  if (total === 0) return [path[Math.floor(path.length / 2)]];

  const out = [];
  for (let k = 1; k <= count; k++) {
    const target = (total * k) / (count + 1);
    let i = 0;
    while (i < distances.length - 1 && distances[i + 1] < target) i++;
    const t =
      i === distances.length - 1 ? 1 : (target - distances[i]) / (distances[i + 1] - distances[i]);
    const lat = path[i][0] + t * (path[i + 1][0] - path[i][0]);
    const lng = path[i][1] + t * (path[i + 1][1] - path[i][1]);
    out.push([lat, lng]);
  }
  return out;
}

function distanceBetween(a, b) {
  const R = 6371e3;
  const φ1 = (a[0] * Math.PI) / 180;
  const φ2 = (b[0] * Math.PI) / 180;
  const Δφ = ((b[0] - a[0]) * Math.PI) / 180;
  const Δλ = ((b[1] - a[1]) * Math.PI) / 180;
  const x =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

/**
 * Find pubs evenly spaced along the walking route from start to end.
 * Uses Photon at each sampled point (with a short delay between requests).
 */
export const searchPubsAlongRoute = async (start, end, maxPubs) => {
  const path = await getRoutePath(start, end);
  const points = samplePathEvenly(path, maxPubs);
  const pubs = [];
  const seen = new Set();

  for (let i = 0; i < points.length; i++) {
    if (i > 0) await delay(REQUEST_DELAY_MS);
    const [lat, lng] = points[i];
    const nearby = await searchPubsNearby({ lat, lng }, 400, 15);
    for (const pub of nearby) {
      const key = `${pub.lat.toFixed(5)},${pub.lng.toFixed(5)}`;
      if (!seen.has(key)) {
        seen.add(key);
        pubs.push(pub);
        break;
      }
    }
  }

  return pubs;
};
