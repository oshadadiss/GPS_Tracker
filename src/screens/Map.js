import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Text} from '@react-native-material/core';
import MapView from 'react-native-maps';

const Map = () => {
  const initialRegion = {
    latitude: 7.2513,
    longitude: 80.3464,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={initialRegion} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
});

export default Map;
