import React, {useState, useEffect, useCallback} from 'react';
import {View, StyleSheet, Alert, Linking} from 'react-native';
import {Text, Button} from '@react-native-material/core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Permissions from '../components/Permissions';
import {startForegroundService, stopForegroundService} from '../services/TrackingService';

const Track = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentSession, setCurrentSession] = useState({
    points: [],
    distance: 0,
    currentSpeed: 0,
    averageSpeed: 0
  });

  // Load current session data from AsyncStorage
  const loadSessionData = useCallback(async () => {
    try {
      const sessions = await AsyncStorage.getItem('gps_sessions');
      if (sessions) {
        const parsedSessions = JSON.parse(sessions);
        if (parsedSessions.length > 0) {
          const latestSession = parsedSessions[parsedSessions.length - 1];
          setCurrentSession({
            points: latestSession.points,
            distance: latestSession.distance,
            currentSpeed: 0,
            averageSpeed: latestSession.distance / ((latestSession.endTime - latestSession.startTime) / 1000 / 3600)
          });
        }
      }
    } catch (error) {
      console.error('Error loading session data:', error);
    }
  }, []);

  // Start tracking session
  const startTracking = useCallback(async () => {
    try {
      await startForegroundService();
      setIsTracking(true);
    } catch (error) {
      if (error.message === 'Background location permission not granted') {
        Alert.alert(
          'Background Location Required',
          'This app needs background location access to track your route. Please enable it in Settings.',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Open Settings', onPress: () => Linking.openSettings()}
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to start tracking. Please try again.');
      }
    }
  }, []);

  // Stop tracking session
  const stopTracking = useCallback(async () => {
    try {
      await stopForegroundService();
      setIsTracking(false);
      loadSessionData(); // Reload the latest session data
    } catch (error) {
      console.error('Error stopping tracking:', error);
      Alert.alert('Error', 'Failed to stop tracking. Please try again.');
    }
  }, [loadSessionData]);

  // Load initial session data
  useEffect(() => {
    loadSessionData();
  }, [loadSessionData]);

  return (
    <View style={styles.container}>
      <Permissions />
      <View style={styles.content}>
        <View style={styles.stats}>
          <Text variant="h6" style={styles.statItem}>
            Distance: {(currentSession.distance / 1000).toFixed(2)} km
          </Text>
          <Text variant="h6" style={styles.statItem}>
            Average Speed: {currentSession.averageSpeed.toFixed(1)} km/h
          </Text>
          <Text variant="subtitle1" style={styles.statItem}>
            Points: {currentSession.points.length}
          </Text>
        </View>

        <Button
          title={isTracking ? 'Stop Tracking' : 'Start Tracking'}
          onPress={isTracking ? stopTracking : startTracking}
          style={styles.button}
          color={isTracking ? '#ff6b6b' : '#51cf66'}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
  },
  stats: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statItem: {
    marginVertical: 8,
  },
  button: {
    paddingVertical: 8,
    marginBottom: 16,
  }
});

export default Track;
