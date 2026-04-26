import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';

export default function SettingsScreen() {
  const [unit, setUnit] = useState('Imperial'); // Imperial or Metric

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedUnit = await AsyncStorage.getItem('settings_units');
      if (savedUnit !== null) setUnit(savedUnit);
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  };

  const toggleUnit = async () => {
    const newUnit = unit === 'Imperial' ? 'Metric' : 'Imperial';
    setUnit(newUnit);
    try {
      await AsyncStorage.setItem('settings_units', newUnit);
    } catch (e) {
      console.error('Failed to save units', e);
    }
  };

  const handleLogin = () => {
    Alert.alert('Authentication', 'Social login (Apple/Google) integration coming soon!');
  };

  const clearData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all saved cities and reset settings?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive', 
          onPress: async () => {
            await AsyncStorage.clear();
            setUnit('Imperial');
            Alert.alert('Data Cleared', 'All app data has been reset.');
          } 
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <TouchableOpacity style={styles.settingRow} onPress={toggleUnit}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Temperature Units</Text>
            <Text style={styles.settingDescription}>{unit}</Text>
          </View>
          <FontAwesome name="exchange" size={16} color="#8e8e93" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System</Text>
        <TouchableOpacity style={styles.settingRow} onPress={clearData}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: '#ff3b30' }]}>Reset App Data</Text>
            <Text style={styles.settingDescription}>Remove all saved locations and settings.</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login with Apple or Google</Text>
        </TouchableOpacity>
        <Text style={styles.helperText}>Login to sync your settings across devices.</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Weather Dashboard v1.1.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#c6c6c8',
  },
  sectionTitle: {
    fontSize: 13,
    color: '#6e6e73',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#c6c6c8',
  },
  settingInfo: {
    flex: 1,
    paddingRight: 8,
  },
  settingLabel: {
    fontSize: 17,
    fontWeight: '400',
  },
  settingDescription: {
    fontSize: 13,
    color: '#8e8e93',
    marginTop: 2,
  },
  loginButton: {
    backgroundColor: '#007aff',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginVertical: 16,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: '#8e8e93',
    marginBottom: 16,
    textAlign: 'center',
  },
  footer: {
    marginTop: 40,
    marginBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#8e8e93',
  },
});
