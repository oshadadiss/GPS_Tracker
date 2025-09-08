import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDate, formatDuration, formatDistance } from '../utils/MapUtils';

const History = ({ onSessionSelect }) => {
  const [sessions, setSessions] = React.useState([]);

  React.useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const sessionKeys = keys.filter(key => key.startsWith('session_'));
      const sessionsData = await AsyncStorage.multiGet(sessionKeys);
      const parsedSessions = sessionsData
        .map(([key, value]) => JSON.parse(value))
        .sort((a, b) => b.startTime - a.startTime); // Most recent first
      setSessions(parsedSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const renderSessionCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => onSessionSelect(item)}
    >
      <Text style={styles.date}>{formatDate(item.startTime)}</Text>
      <View style={styles.stats}>
        <Text style={styles.stat}>
          Distance: {formatDistance(item.distance)}
        </Text>
        <Text style={styles.stat}>
          Duration: {formatDuration(item.endTime - item.startTime)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>History</Text>
      <FlatList
        data={sessions}
        renderItem={renderSessionCard}
        keyExtractor={item => String(item.startTime)}
        contentContainerStyle={styles.list}
      />
    </View>
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
    padding: 16,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  date: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    fontSize: 14,
    color: '#666',
  },
});

export default History;