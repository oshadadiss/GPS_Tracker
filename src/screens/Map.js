import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import History from '../components/History';
import { getRegionForCoordinates } from '../utils/MapUtils';

const Map = () => {
  const mapRef = useRef(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showHistory, setShowHistory] = useState(true);

  useEffect(() => {
    const watchId = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
        
        if (activeSession) {
          // Add point to active session
          const newPoint = { latitude, longitude, timestamp: Date.now() };
          setActiveSession(prev => ({
            ...prev,
            coordinates: [...prev.coordinates, newPoint]
          }));
          
          // Animate to new location
          mapRef.current?.animateCamera({
            center: { latitude, longitude },
            zoom: 16
          });
        }
      },
      (error) => console.error(error),
      { enableHighAccuracy: true, distanceFilter: 10, interval: 5000 }
    );

    return () => Geolocation.clearWatch(watchId);
  }, [activeSession]);

  useEffect(() => {
    if (currentLocation && !activeSession && !selectedSession) {
      mapRef.current?.animateCamera({
        center: currentLocation,
        zoom: 15
      });
    }
  }, [currentLocation, activeSession, selectedSession]);

  const handleSessionSelect = (session) => {
    setSelectedSession(session);
    setShowHistory(false);
    
    const region = getRegionForCoordinates(session.coordinates);
    if (region) {
      mapRef.current?.animateToRegion(region, 1000);
    }
  };

  const handleStartSession = async () => {
    if (currentLocation) {
      const newSession = {
        startTime: Date.now(),
        coordinates: [{ ...currentLocation, timestamp: Date.now() }]
      };
      setActiveSession(newSession);
      setSelectedSession(null);
      setShowHistory(false);
    }
  };

  const handleStopSession = async () => {
    if (activeSession) {
      const completedSession = {
        ...activeSession,
        endTime: Date.now(),
        distance: calculateTotalDistance(activeSession.coordinates)
      };
      
      try {
        await AsyncStorage.setItem(
          `session_${completedSession.startTime}`,
          JSON.stringify(completedSession)
        );
      } catch (error) {
        console.error('Error saving session:', error);
      }
      
      setActiveSession(null);
      setShowHistory(true);
    }
  };

  const calculateTotalDistance = (coordinates) => {
    let distance = 0;
    for (let i = 1; i < coordinates.length; i++) {
      const lat1 = coordinates[i - 1].latitude;
      const lon1 = coordinates[i - 1].longitude;
      const lat2 = coordinates[i].latitude;
      const lon2 = coordinates[i].longitude;
      
      // Haversine formula
      const R = 6371e3; // Earth's radius in meters
      const φ1 = lat1 * Math.PI / 180;
      const φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - lat1) * Math.PI / 180;
      const Δλ = (lon2 - lon1) * Math.PI / 180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      distance += R * c;
    }
    return distance;
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        showsUserLocation
        followsUserLocation
      >
        {activeSession?.coordinates && (
          <Polyline
            coordinates={activeSession.coordinates}
            strokeColor="#FF0000"
            strokeWidth={3}
          />
        )}
        {selectedSession?.coordinates && (
          <Polyline
            coordinates={selectedSession.coordinates}
            strokeColor="#0000FF"
            strokeWidth={3}
          />
        )}
      </MapView>
      
      {showHistory ? (
        <View style={styles.historyContainer}>
          <History onSessionSelect={handleSessionSelect} />
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          {!activeSession ? (
            <TouchableOpacity
              style={[styles.button, styles.startButton]}
              onPress={handleStartSession}
            >
              <Text style={styles.buttonText}>Start Tracking</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={handleStopSession}
            >
              <Text style={styles.buttonText}>Stop Tracking</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  historyContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  button: {
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Map;
