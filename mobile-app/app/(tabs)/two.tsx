import React, { useState, useEffect } from 'react';
import { StyleSheet, Switch, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const [dailyReport, setDailyReport] = useState(false);
  const [suddenAlerts, setSuddenAlerts] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Load saved settings
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const daily = await AsyncStorage.getItem('settings_daily_report');
      const sudden = await AsyncStorage.getItem('settings_sudden_alerts');
      if (daily !== null) setDailyReport(JSON.parse(daily));
      if (sudden !== null) setSuddenAlerts(JSON.parse(sudden));
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  };

  const saveSetting = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save setting', e);
    }
  };

  const toggleDailyReport = (value: boolean) => {
    setDailyReport(value);
    saveSetting('settings_daily_report', value);
  };

  const toggleSuddenAlerts = (value: boolean) => {
    setSuddenAlerts(value);
    saveSetting('settings_sudden_alerts', value);
  };

  const handleLogin = () => {
    // Placeholder for Auth implementation
    Alert.alert('Authentication', 'Social login (Apple/Google) integration coming soon!');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login with Apple or Google</Text>
        </TouchableOpacity>
        <Text style={styles.helperText}>Login to sync your settings across devices.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Daily Weather Report</Text>
            <Text style={styles.settingDescription}>Receive a morning summary of today's forecast.</Text>
          </View>
          <Switch
            value={dailyReport}
            onValueChange={toggleDailyReport}
            trackColor={{ false: '#767577', true: '#ff8c00' }}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Sudden Weather Alerts</Text>
            <Text style={styles.settingDescription}>Get notified immediately about storms or bad weather.</Text>
          </View>
          <Switch
            value={suddenAlerts}
            onValueChange={toggleSuddenAlerts}
            trackColor={{ false: '#767577', true: '#ff8c00' }}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Weather Dashboard v1.0.0</Text>
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
