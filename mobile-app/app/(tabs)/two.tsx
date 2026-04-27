import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { auth } from '@/services/firebaseConfig';
import { 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { syncUserData, fetchUserData } from '@/services/userService';

// Platform-agnostic Alert helper
const crossPlatformAlert = (title: string, message: string, buttons: { text: string, style?: string, onPress?: () => void }[]) => {
  if (Platform.OS === 'web') {
    const result = window.confirm(`${title}\n\n${message}`);
    if (result) {
      const confirmButton = buttons.find(b => b.style !== 'cancel');
      if (confirmButton && confirmButton.onPress) confirmButton.onPress();
    }
  } else {
    Alert.alert(title, message, buttons as any);
  }
};

export default function SettingsScreen() {
  const [unit, setUnit] = useState('Imperial');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        AsyncStorage.setItem('is_logged_in', 'true');
        syncLocalDataToCloud(currentUser.uid);
      } else {
        AsyncStorage.setItem('is_logged_in', 'false');
      }
    });

    return () => unsubscribe();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  const loadSettings = async () => {
    try {
      const savedUnit = await AsyncStorage.getItem('settings_units');
      if (savedUnit !== null) setUnit(savedUnit);
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  };

  const syncLocalDataToCloud = async (userId: string) => {
    try {
      const savedCities = await AsyncStorage.getItem('saved_cities');
      const units = await AsyncStorage.getItem('settings_units');
      const notificationsOn = await AsyncStorage.getItem('settings_notifications_on');
      const isPro = await AsyncStorage.getItem('is_pro_user');

      await syncUserData(userId, {
        savedCities: savedCities ? JSON.parse(savedCities) : [],
        units: units || 'Imperial',
        notificationsOn: notificationsOn === 'true',
        isPro: isPro === 'true'
      });
    } catch (e) {
      console.error('Failed to sync local data to cloud', e);
    }
  };

  const toggleUnit = async () => {
    const newUnit = unit === 'Imperial' ? 'Metric' : 'Imperial';
    setUnit(newUnit);
    try {
      await AsyncStorage.setItem('settings_units', newUnit);
      if (user) {
        await syncUserData(user.uid, { units: newUnit });
      }
    } catch (e) {
      console.error('Failed to save units', e);
    }
  };

  const handleLogin = async () => {
    if (user) {
      crossPlatformAlert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Logout', 
            style: 'destructive',
            onPress: async () => {
              try {
                await signOut(auth);
              } catch (e) {
                Alert.alert('Error', 'Failed to sign out');
              }
            } 
          }
        ]
      );
    } else {
      setLoading(true);
      try {
        // For demo purposes, we use anonymous sign in
        // In a real app, you'd use Google/Apple/Email
        await signInAnonymously(auth);
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Failed to sign in. Please check your Firebase configuration.');
        setLoading(false);
      }
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
              await AsyncStorage.multiRemove(['saved_cities', 'settings_units', 'is_logged_in', 'settings_daily_report', 'settings_sudden_alerts', 'is_pro_user']);
              setUnit('Imperial');
              if (user) {
                await syncUserData(user.uid, {
                  savedCities: [],
                  units: 'Imperial',
                  isPro: false
                });
              }
            } catch (e) {
              console.error('Failed to clear data', e);
            }
          } 
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#007aff" />
      </View>
    );
  }

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
        {!user ? (
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
          <View style={styles.loggedInContainer}>
            <Text style={styles.userEmail}>Signed in as Guest ({user.uid.substring(0, 8)}...)</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogin}>
              <Text style={styles.logoutButtonText}>Logout from Account</Text>
            </TouchableOpacity>
          </View>
        )}
        <Text style={styles.helperText}>
          {user ? 'Your settings are synced!' : 'Sign in to sync your cities across all your devices.'}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Weather Dashboard v1.2.0</Text>
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
  loggedInContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  userEmail: {
    fontSize: 15,
    color: '#333',
    marginBottom: 10,
  },
  logoutButton: {
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
