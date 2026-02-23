/**
 * Routing service using OSRM (Open Source Routing Machine).
 * Uses public OSRM instance. Free, no API key required.
 * Note: For production, consider self-hosting or using a commercial service.
 */

const OSRM_BASE_URL = 'https://router.project-osrm.org';

/**
 * Get walking route between two points only (for getting path geometry).
 * @param {{lat: number, lng: number}} origin
 * @param {{lat: number, lng: number}} destination
 * @returns {Promise<Array<[number, number]>}>} Array of [lat, lng] along the path
 */
export const getRoutePath = async (origin, destination) => {
  const result = await getRoute([origin, destination], false);
  return result.geometry;
};

/**
 * Get walking route between points.
 * @param {Array<{lat: number, lng: number}>} waypoints - Array of coordinates
 * @param {boolean} optimize - Whether to optimize waypoint order (single-location mode only; use false for A→B→pubs order)
 * @returns {Promise<{geometry: Array, distance: number, duration: number}>}
 */
export const getRoute = async (waypoints, optimize = true) => {
  if (waypoints.length < 2) {
    throw new Error('At least 2 waypoints required');
  }

  // OSRM format: lng,lat (note: longitude first!)
  const coordinates = waypoints.map((wp) => `${wp.lng},${wp.lat}`).join(';');

  // Build URL
  const url = new URL(`${OSRM_BASE_URL}/route/v1/walking/${coordinates}`);
  url.searchParams.set('overview', 'full');
  url.searchParams.set('geometries', 'geojson');
  url.searchParams.set('steps', 'true');

  if (optimize && waypoints.length > 2) {
    // OSRM's trip service optimizes waypoint order (only for single-location crawl)
    return getOptimizedTrip(waypoints);
  }

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`OSRM routing error: ${response.status}`);
    }

    const data = await response.json();
    if (data.code !== 'Ok') {
      throw new Error(`OSRM error: ${data.code}`);
    }

    const route = data.routes[0];
    return {
      geometry: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]), // Convert to [lat, lng]
      distance: route.distance, // meters
      duration: route.duration, // seconds
      waypoints: data.waypoints.map((wp) => ({
        lat: wp.location[1],
        lng: wp.location[0],
      })),
    };
  } catch (error) {
    console.error('Routing error:', error);
    throw error;
  }
};

/**
 * Get optimized trip route (reorders waypoints for shortest path).
 * @param {Array<{lat: number, lng: number}>} waypoints
 * @returns {Promise<{geometry: Array, distance: number, duration: number, order: Array}>}
 */
async function getOptimizedTrip(waypoints) {
  const coordinates = waypoints.map((wp) => `${wp.lng},${wp.lat}`).join(';');
  const url = new URL(`${OSRM_BASE_URL}/trip/v1/walking/${coordinates}`);
  url.searchParams.set('overview', 'full');
  url.searchParams.set('geometries', 'geojson');
  url.searchParams.set('steps', 'true');

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`OSRM trip error: ${response.status}`);
    }

    const data = await response.json();
    if (data.code !== 'Ok') {
      throw new Error(`OSRM error: ${data.code}`);
    }

    const trip = data.trips[0];
    return {
      geometry: trip.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distance: trip.distance,
      duration: trip.duration,
      waypoints: data.waypoints.map((wp) => ({
        lat: wp.location[1],
        lng: wp.location[0],
      })),
      order: data.waypoints.map((wp) => wp.waypoint_index), // Optimized order
    };
  } catch (error) {
    console.error('Trip optimization error:', error);
    throw error;
  }
}
