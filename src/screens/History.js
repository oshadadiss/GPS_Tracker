import React from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Text, Surface} from '@react-native-material/core';

const History = () => {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text variant="h6" style={styles.emptyText}>
          No tracking history available
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 24,
    color: '#666',
  },
});

export default History;
