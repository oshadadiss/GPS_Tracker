import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Share, Platform } from 'react-native';
import { Text, Button, Divider } from '@react-native-material/core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { formatDate, formatDistance, formatDuration } from '../utils/MapUtils';

const ACCURACY_PRESETS = {
  battery: {
    enableHighAccuracy: false,
    distanceFilter: 50, // meters
    interval: 10000, // 10 seconds
    description: 'Optimized for battery life. Updates every 10s with 50m minimum movement.'
  },
  balanced: {
    enableHighAccuracy: true,
    distanceFilter: 20,
    interval: 5000,
    description: 'Balanced accuracy and battery usage. Updates every 5s with 20m minimum movement.'
  },
  accuracy: {
    enableHighAccuracy: true,
    distanceFilter: 5,
    interval: 1000,
    description: 'Highest accuracy with frequent updates. Updates every 1s with 5m minimum movement.'
  }
};

const Analytics = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [settings, setSettings] = useState(ACCURACY_PRESETS.balanced);

  useEffect(() => {
    loadSessions();
    loadSettings();
  }, []);

  const loadSessions = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const sessionKeys = keys.filter(key => key.startsWith('session_'));
      const sessionsData = await AsyncStorage.multiGet(sessionKeys);
      const parsedSessions = sessionsData
        .map(([key, value]) => JSON.parse(value))
        .sort((a, b) => b.startTime - a.startTime);
      setSessions(parsedSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('tracking_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('tracking_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const calculateStats = (session) => {
    if (!session?.coordinates || session.coordinates.length < 2) return null;

    const movingTime = session.endTime - session.startTime;
    const avgSpeed = (session.distance / movingTime) * 3.6; // m/s to km/h

    let topSpeed = 0;
    for (let i = 1; i < session.coordinates.length; i++) {
      const timeDiff = session.coordinates[i].timestamp - session.coordinates[i-1].timestamp;
      const distance = calculateDistance(
        session.coordinates[i-1].latitude,
        session.coordinates[i-1].longitude,
        session.coordinates[i].latitude,
        session.coordinates[i].longitude
      );
      const speed = (distance / timeDiff) * 3.6; // m/s to km/h
      topSpeed = Math.max(topSpeed, speed);
    }

    return {
      totalDistance: session.distance,
      duration: movingTime,
      avgSpeed: avgSpeed,
      topSpeed: topSpeed
    };
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const exportToCSV = async (session) => {
    const header = 'Timestamp,Latitude,Longitude\n';
    const rows = session.coordinates.map(coord => 
      `${new Date(coord.timestamp).toISOString()},${coord.latitude},${coord.longitude}`
    ).join('\n');
    const csv = header + rows;

    const fileName = `track_${session.startTime}.csv`;
    const path = `${RNFS.CachesDirectoryPath}/${fileName}`;

    try {
      await RNFS.writeFile(path, csv, 'utf8');
      await Share.share({
        url: Platform.OS === 'android' ? `file://${path}` : path,
        type: 'text/csv',
        title: 'Export Track Data'
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const exportToGPX = async (session) => {
    const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="TrackerNew">
  <trk>
    <name>Track ${formatDate(session.startTime)}</name>
    <trkseg>
      ${session.coordinates.map(coord => 
        `      <trkpt lat="${coord.latitude}" lon="${coord.longitude}">
        <time>${new Date(coord.timestamp).toISOString()}</time>
      </trkpt>`
      ).join('\n')}
    </trkseg>
  </trk>
</gpx>`;

    const fileName = `track_${session.startTime}.gpx`;
    const path = `${RNFS.CachesDirectoryPath}/${fileName}`;

    try {
      await RNFS.writeFile(path, gpx, 'utf8');
      await Share.share({
        url: Platform.OS === 'android' ? `file://${path}` : path,
        type: 'application/gpx+xml',
        title: 'Export GPX Track'
      });
    } catch (error) {
      console.error('Error exporting GPX:', error);
    }
  };

  const renderSessionStats = () => {
    if (!selectedSession) return null;

    const stats = calculateStats(selectedSession);
    if (!stats) return null;

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Session Analysis</Text>
        <Text>Date: {formatDate(selectedSession.startTime)}</Text>
        <Text>Total Distance: {formatDistance(stats.totalDistance)}</Text>
        <Text>Duration: {formatDuration(stats.duration)}</Text>
        <Text>Average Speed: {stats.avgSpeed.toFixed(1)} km/h</Text>
        <Text>Top Speed: {stats.topSpeed.toFixed(1)} km/h</Text>

        <View style={styles.buttonContainer}>
          <Button
            title="Export CSV"
            onPress={() => exportToCSV(selectedSession)}
            style={styles.button}
          />
          <Button
            title="Export GPX"
            onPress={() => exportToGPX(selectedSession)}
            style={styles.button}
          />
        </View>

        <Text style={styles.pointsTitle}>Track Points</Text>
        <ScrollView style={styles.pointsList}>
          {selectedSession.coordinates.map((coord, index) => (
            <Text key={coord.timestamp} style={styles.pointText}>
              {formatDate(coord.timestamp)} - 
              {coord.latitude.toFixed(6)}, {coord.longitude.toFixed(6)}
            </Text>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderSettings = () => (
    <View style={styles.settingsContainer}>
      <Text style={styles.settingsTitle}>Tracking Settings</Text>
      {Object.entries(ACCURACY_PRESETS).map(([key, preset]) => (
        <TouchableOpacity
          key={key}
          style={[styles.presetButton, settings === preset && styles.selectedPreset]}
          onPress={() => saveSettings(preset)}
        >
          <Text style={styles.presetTitle}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
          <Text style={styles.presetDescription}>{preset.description}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.sessionsContainer}>
        <Text style={styles.title}>Saved Sessions</Text>
        {sessions.map(session => (
          <TouchableOpacity
            key={session.startTime}
            style={[styles.sessionButton, selectedSession === session && styles.selectedSession]}
            onPress={() => setSelectedSession(session)}
          >
            <Text>{formatDate(session.startTime)}</Text>
            <Text>{formatDistance(session.distance)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Divider style={styles.divider} />
      {renderSessionStats()}
      <Divider style={styles.divider} />
      {renderSettings()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sessionsContainer: {
    padding: 16,
  },
  sessionButton: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedSession: {
    backgroundColor: '#e0e0e0',
  },
  divider: {
    marginVertical: 16,
  },
  statsContainer: {
    padding: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  button: {
    minWidth: 120,
  },
  pointsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  pointsList: {
    maxHeight: 200,
  },
  pointText: {
    fontSize: 12,
    marginBottom: 4,
  },
  settingsContainer: {
    padding: 16,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  presetButton: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedPreset: {
    backgroundColor: '#e0e0e0',
  },
  presetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  presetDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default Analytics;