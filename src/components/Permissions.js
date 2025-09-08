import React, {useState, useEffect} from 'react';
import {View, StyleSheet, Linking} from 'react-native';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {Text, Button} from '@react-native-material/core';

const Permissions = () => {
  const [permissions, setPermissions] = useState({
    fineLocation: 'unknown',
    coarseLocation: 'unknown',
    backgroundLocation: 'unknown',
  });

  const permissionsList = [
    {
      name: 'fineLocation',
      permission: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      label: 'Precise Location',
    },
    {
      name: 'coarseLocation',
      permission: PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
      label: 'Approximate Location',
    },
    {
      name: 'backgroundLocation',
      permission: PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION,
      label: 'Background Location',
    },
  ];

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const status = {};
    for (const {name, permission} of permissionsList) {
      status[name] = await check(permission);
    }
    setPermissions(status);
  };

  const requestPermission = async (name, permission) => {
    try {
      const result = await request(permission);
      setPermissions(prev => ({...prev, [name]: result}));
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case RESULTS.GRANTED:
        return '#4CAF50';
      case RESULTS.DENIED:
        return '#FFC107';
      case RESULTS.BLOCKED:
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const renderPermissionItem = ({name, permission, label}) => {
    const status = permissions[name];
    const isBlocked = status === RESULTS.BLOCKED;

    return (
      <View key={name} style={styles.permissionItem}>
        <View style={styles.permissionHeader}>
          <Text variant="subtitle1" style={styles.permissionLabel}>
            {label}
          </Text>
          <View
            style={[
              styles.statusIndicator,
              {backgroundColor: getStatusColor(status)},
            ]}
          />
        </View>
        <Text variant="body2" style={styles.statusText}>
          {status.toLowerCase()}
        </Text>
        {status !== RESULTS.GRANTED && (
          <Button
            title={isBlocked ? 'Open Settings' : 'Request Permission'}
            onPress={() =>
              isBlocked
                ? Linking.openSettings()
                : requestPermission(name, permission)
            }
            style={styles.button}
            tintColor="#2196F3"
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text variant="h6" style={styles.title}>
        Required Permissions
      </Text>
      {permissionsList.map(renderPermissionItem)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    marginBottom: 16,
    color: '#333',
  },
  permissionItem: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  permissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionLabel: {
    color: '#333',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    color: '#666',
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
  },
});

export default Permissions;
