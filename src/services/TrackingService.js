import ForegroundService from '@voximplant/react-native-foreground-service';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {PermissionsAndroid, Platform} from 'react-native';

// Configuration for the tracking service
const SERVICE_CONFIG = {
  id: 1,
  title: 'GPS Tracking',
  message: 'Tracking active',
  importance: 3, // IMPORTANCE_DEFAULT
  visibility: 1, // VISIBILITY_PUBLIC
  icon: 'ic_notification', // add this icon to android/app/src/main/res/drawable
  color: '#4CAF50',
  // Add to android/app/src/main/res/values/strings.xml:
  // <string name="channel_name">GPS Tracking</string>
  // <string name="channel_description">Background location tracking service</string>
  channelId: 'tracking_service',
  channelName: 'GPS Tracking',
  channelDescription: 'Background location tracking service',
};

// Configuration for location tracking
const LOCATION_CONFIG = {
  enableHighAccuracy: true,
  distanceFilter: 10,
  interval: 5000,
  fastestInterval: 3000,
};

// Configuration for data persistence
const STORAGE_CONFIG = {
  pointsBeforeFlush: 20,
  flushInterval: 30000,
  storageKey: 'gps_sessions',
};

let watchId = null;
let startTime = null;
let points = [];
let distance = 0;
let lastFlushTime = Date.now();

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Format elapsed time as mm:ss
const formatElapsedTime = () => {
  if (!startTime) return '00:00';
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
};

// Save tracking data to storage
const saveToStorage = async (force = false) => {
  const now = Date.now();
  if (
    !force &&
    points.length < STORAGE_CONFIG.pointsBeforeFlush &&
    now - lastFlushTime < STORAGE_CONFIG.flushInterval
  ) {
    return;
  }

  try {
    const existingSessions = await AsyncStorage.getItem(
      STORAGE_CONFIG.storageKey,
    );
    const sessions = existingSessions ? JSON.parse(existingSessions) : [];
    const sessionData = {
      startTime,
      endTime: now,
      points,
      distance,
    };
    sessions.push(sessionData);
    await AsyncStorage.setItem(
      STORAGE_CONFIG.storageKey,
      JSON.stringify(sessions),
    );
    lastFlushTime = now;
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

// Update notification content
const updateNotification = async () => {
  if (!startTime) return;

  await ForegroundService.update({
    ...SERVICE_CONFIG,
    message: `Tracking active — ${formatElapsedTime()} — ${(
      distance / 1000
    ).toFixed(2)} km`,
  });
};

// Handle location updates
const handleLocationUpdate = location => {
  const {latitude, longitude} = location.coords;
  const timestamp = location.timestamp;

  if (points.length > 0) {
    const lastPoint = points[points.length - 1];
    distance += calculateDistance(
      lastPoint.latitude,
      lastPoint.longitude,
      latitude,
      longitude,
    );
  }

  points.push({latitude, longitude, timestamp});
  saveToStorage();
  updateNotification();
};

// Check and request background location permission
const checkBackgroundPermission = async () => {
  if (Platform.OS !== 'android') return true;

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
      {
        title: 'Background Location Permission',
        message: 'This app needs access to location when in background.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.error('Error checking background permission:', err);
    return false;
  }
};

// Start the tracking service
export const startForegroundService = async (options = {}) => {
  // Check background permission
  const hasPermission = await checkBackgroundPermission();
  if (!hasPermission) {
    throw new Error('Background location permission not granted');
  }

  // Start foreground service
  await ForegroundService.createNotificationChannel(SERVICE_CONFIG);
  await ForegroundService.startService(SERVICE_CONFIG);

  // Initialize tracking state
  startTime = Date.now();
  points = [];
  distance = 0;
  lastFlushTime = Date.now();

  // Start location tracking
  watchId = Geolocation.watchPosition(
    handleLocationUpdate,
    error => console.error('Location error:', error),
    {...LOCATION_CONFIG, ...options},
  );

  // Initial notification update
  await updateNotification();
};

// Stop the tracking service
export const stopForegroundService = async () => {
  if (watchId !== null) {
    Geolocation.clearWatch(watchId);
    watchId = null;
  }

  await saveToStorage(true);
  await ForegroundService.stopService();

  // Reset tracking state
  startTime = null;
  points = [];
  distance = 0;
};
