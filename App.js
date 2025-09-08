import React, {useState} from 'react';
import {SafeAreaView, StyleSheet, View} from 'react-native';
import {AppBar, BottomNavigation} from '@react-native-material/core';

// Import screens
import Track from './src/screens/Track';
import Map from './src/screens/Map';
import History from './src/screens/History';

const App = () => {
  const [activeTab, setActiveTab] = useState(0);

  const routes = [
    {key: 'track', title: 'Track', icon: 'target'},
    {key: 'map', title: 'Map', icon: 'map'},
    {key: 'history', title: 'History', icon: 'history'},
  ];

  const renderScene = () => {
    switch (activeTab) {
      case 0:
        return <Track />;
      case 1:
        return <Map />;
      case 2:
        return <History />;
      default:
        return <Track />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppBar title="Tracker" />

      <View style={styles.content}>{renderScene()}</View>

      <BottomNavigation
        activeIndex={activeTab}
        onTabPress={index => setActiveTab(index)}
        style={styles.bottomNav}
        routes={routes}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    elevation: 8,
  },
});

export default App;
