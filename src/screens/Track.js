import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Text} from '@react-native-material/core';
import Permissions from '../components/Permissions';

const Track = () => {
  return (
    <View style={styles.container}>
      <Permissions />
      <View style={styles.content}>
        <Text variant="h6">
          Tracking functionality will be implemented here
        </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
});

export default Track;
