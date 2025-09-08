// Helper functions for map operations

/**
 * Calculate the bounding box for an array of coordinates
 * @param {Array} coordinates Array of {latitude, longitude} objects
 * @returns {Object} Bounding box with latitudeDelta and longitudeDelta
 */
export const getRegionForCoordinates = (coordinates) => {
  if (!coordinates || coordinates.length === 0) {
    return null;
  }

  let minLat = coordinates[0].latitude;
  let maxLat = coordinates[0].latitude;
  let minLng = coordinates[0].longitude;
  let maxLng = coordinates[0].longitude;

  coordinates.forEach(coord => {
    minLat = Math.min(minLat, coord.latitude);
    maxLat = Math.max(maxLat, coord.latitude);
    minLng = Math.min(minLng, coord.longitude);
    maxLng = Math.max(maxLng, coord.longitude);
  });

  const latitudeDelta = (maxLat - minLat) * 1.5; // Add 50% padding
  const longitudeDelta = (maxLng - minLng) * 1.5;

  return {
    latitude: (maxLat + minLat) / 2,
    longitude: (maxLng + minLng) / 2,
    latitudeDelta: latitudeDelta || 0.01, // Fallback if route is single point
    longitudeDelta: longitudeDelta || 0.01
  };
};

/**
 * Format a timestamp into a readable date string
 * @param {number} timestamp Unix timestamp
 * @returns {string} Formatted date string
 */
export const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString();
};

/**
 * Format duration in milliseconds to readable string
 * @param {number} duration Duration in milliseconds
 * @returns {string} Formatted duration string
 */
export const formatDuration = (duration) => {
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m ${seconds % 60}s`;
};

/**
 * Format distance in meters to readable string
 * @param {number} meters Distance in meters
 * @returns {string} Formatted distance string
 */
export const formatDistance = (meters) => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
};