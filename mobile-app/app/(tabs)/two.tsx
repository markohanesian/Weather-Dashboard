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
import { signInWithGoogle, signInWithApple } from '@/services/socialAuthService';

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

export default function AccountScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle(auth);
    } catch (e) {
      console.error(e);
      Alert.alert('Google Sign-In Error', 'Failed to sign in with Google.');
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    try {
      await signInWithApple(auth);
    } catch (e) {
      console.error(e);
      Alert.alert('Apple Sign-In Error', 'Failed to sign in with Apple.');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
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
              if (user) {
                await syncUserData(user.uid, {
                  savedCities: [],
                  units: 'Imperial',
                  isPro: false
                });
              }
              Alert.alert('Success', 'Local data has been reset.');
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
        <Text style={styles.sectionTitle}>Account</Text>
        {!user ? (
          <View style={styles.authContainer}>
            <TouchableOpacity 
              style={[styles.socialButton, styles.appleButton]} 
              onPress={handleAppleLogin}
            >
              <FontAwesome name="apple" size={20} color="#fff" />
              <Text style={styles.socialButtonText}>Sign in with Apple</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.socialButton, styles.googleButton]} 
              onPress={handleGoogleLogin}
            >
              <FontAwesome name="google" size={18} color="#444" />
              <Text style={[styles.socialButtonText, { color: '#444' }]}>Sign in with Google</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loggedInContainer}>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user.displayName ? user.displayName[0] : (user.email ? user.email[0] : 'U')}</Text>
              </View>
              <Text style={styles.welcomeText}>Hello, {user.displayName || (user.email ? user.email.split('@')[0] : 'User')}</Text>
              <Text style={styles.userEmail}>{user.email || 'Anonymous Guest'}</Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout from Account</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        <TouchableOpacity style={styles.settingRow} onPress={clearData}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: '#ff3b30' }]}>Reset Local App Data</Text>
            <Text style={styles.settingDescription}>Remove all saved locations and local preferences.</Text>
          </View>
        </TouchableOpacity>
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
    paddingVertical: 30,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007aff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  userEmail: {
    fontSize: 14,
    color: '#8e8e93',
    marginTop: 4,
  },
  logoutButton: {
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#c6c6c8',
    marginTop: 10,
  },
  logoutButtonText: {
    color: '#ff3b30',
    fontSize: 17,
    fontWeight: '400',
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
