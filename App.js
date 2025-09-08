import React, {useState} from 'react';
import {SafeAreaView, StyleSheet, View} from 'react-native';
import {AppBar} from '@react-native-material/core';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Import screens
import Track from './src/screens/Track';
import Map from './src/screens/Map';
import History from './src/screens/History';

const App = () => {
  const [activeTab, setActiveTab] = useState(0);

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

      <View style={styles.bottomNav}>
        {['target', 'map', 'history'].map((icon, index) => (
          <MaterialCommunityIcons
            key={icon}
            name={icon}
            size={24}
            color={activeTab === index ? '#2196F3' : '#757575'}
            onPress={() => setActiveTab(index)}
            style={styles.icon}
          />
        ))}
      </View>
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
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  icon: {
    padding: 12,
  },
});

export default App;
