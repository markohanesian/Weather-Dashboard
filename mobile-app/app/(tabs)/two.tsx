import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

// Platform-agnostic Alert helper
const crossPlatformAlert = (title: string, message: string, buttons: { text: string, style?: string, onPress?: () => void }[]) => {
  if (Platform.OS === 'web') {
    const result = window.confirm(`${title}\n\n${message}`);
    if (result) {
      // Execute the "confirm" action (usually the last button in our case, or the non-cancel one)
      const confirmButton = buttons.find(b => b.style !== 'cancel');
      if (confirmButton && confirmButton.onPress) confirmButton.onPress();
    }
  } else {
    Alert.alert(title, message, buttons as any);
  }
};

export default function SettingsScreen() {
  const [unit, setUnit] = useState('Imperial');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  const loadSettings = async () => {
    try {
      const savedUnit = await AsyncStorage.getItem('settings_units');
      if (savedUnit !== null) setUnit(savedUnit);
      const auth = await AsyncStorage.getItem('is_logged_in');
      if (auth !== null) setIsLoggedIn(JSON.parse(auth));
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

  const handleLogin = async () => {
    if (isLoggedIn) {
      crossPlatformAlert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Logout', 
            style: 'destructive',
            onPress: async () => {
              setIsLoggedIn(false);
              await AsyncStorage.setItem('is_logged_in', 'false');
            } 
          }
        ]
      );
    } else {
      crossPlatformAlert(
        'Sign In',
        'Choose a provider to continue (Demo: Click OK to sign in)',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Continue', 
            onPress: async () => {
              setIsLoggedIn(true);
              await AsyncStorage.setItem('is_logged_in', 'true');
            } 
          }
        ]
      );
    }
  };

  const clearData = () => {
    crossPlatformAlert(
      'Clear All Data',
      'Are you sure you want to delete all saved cities and reset settings?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['saved_cities', 'settings_units', 'is_logged_in', 'settings_daily_report', 'settings_sudden_alerts']);
              setUnit('Imperial');
              setIsLoggedIn(false);
            } catch (e) {
              console.error('Failed to clear data', e);
            }
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
        {!isLoggedIn ? (
          <View style={styles.authContainer}>
            <TouchableOpacity 
              style={[styles.socialButton, styles.appleButton]} 
              onPress={handleLogin}
            >
              <FontAwesome name="apple" size={20} color="#fff" />
              <Text style={styles.socialButtonText}>Sign in with Apple</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.socialButton, styles.googleButton]} 
              onPress={handleLogin}
            >
              <FontAwesome name="google" size={18} color="#444" />
              <Text style={[styles.socialButtonText, { color: '#444' }]}>Sign in with Google</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogin}>
            <Text style={styles.logoutButtonText}>Logout from Account</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.helperText}>
          {isLoggedIn ? 'Your settings are synced!' : 'Sign in to sync your cities across all your devices.'}
        </Text>
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
  authContainer: {
    marginVertical: 20,
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  appleButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  logoutButton: {
    marginVertical: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#ff3b30',
    fontSize: 17,
    fontWeight: '400',
  },
  helperText: {
    fontSize: 12,
    color: '#8e8e93',
    marginBottom: 20,
    textAlign: 'center',
  },
  footer: {
    marginTop: 40,
    marginBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#8e8e93',
  },
});
