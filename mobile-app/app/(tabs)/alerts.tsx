import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Switch, Text, View, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { registerWeatherCheckTask, unregisterWeatherCheckTask } from '@/services/backgroundService';
import { cancelAllNotifications, requestNotificationPermissions } from '@/services/notificationService';
import { auth } from '@/services/firebaseConfig';
import { syncUserData } from '@/services/userService';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyReportEnabled, setDailyReportEnabled] = useState(false);
  const [severeWeatherEnabled, setSevereWeatherEnabled] = useState(false);
  const [unit, setUnit] = useState('Imperial');
  const [isPro, setIsPro] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  const loadSettings = async () => {
    try {
      const on = await AsyncStorage.getItem('settings_notifications_on');
      const daily = await AsyncStorage.getItem('settings_daily_report');
      const sudden = await AsyncStorage.getItem('settings_sudden_alerts');
      const pro = await AsyncStorage.getItem('is_pro_user');
      const savedUnit = await AsyncStorage.getItem('settings_units');

      if (on !== null) setNotificationsEnabled(JSON.parse(on));
      if (daily !== null) setDailyReportEnabled(JSON.parse(daily));
      if (sudden !== null) setSevereWeatherEnabled(JSON.parse(sudden));
      if (pro !== null) setIsPro(JSON.parse(pro));
      if (savedUnit !== null) setUnit(savedUnit);
    } catch (e) {
      console.error(e);
    }
  };

  const syncToCloud = async (data: any) => {
    const user = auth.currentUser;
    if (user) {
      try {
        await syncUserData(user.uid, data);
      } catch (e) {
        console.error('Failed to sync settings to cloud', e);
      }
    }
  };

  const toggleUnit = async () => {
    const newUnit = unit === 'Imperial' ? 'Metric' : 'Imperial';
    setUnit(newUnit);
    try {
      await AsyncStorage.setItem('settings_units', newUnit);
      await syncToCloud({ units: newUnit });
    } catch (e) {
      console.error('Failed to save units', e);
    }
  };

  const toggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('settings_notifications_on', JSON.stringify(value));
    await syncToCloud({ notificationsOn: value });
    
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted && Platform.OS !== 'web') {
        Alert.alert('Permission Required', 'Please enable notifications in your system settings.');
        setNotificationsEnabled(false);
        await AsyncStorage.setItem('settings_notifications_on', 'false');
        await syncToCloud({ notificationsOn: false });
        return;
      }
      if (isPro && severeWeatherEnabled) {
        await registerWeatherCheckTask();
      }
    } else {
      await cancelAllNotifications();
      await unregisterWeatherCheckTask();
    }
  };

  const toggleDailyReport = async (value: boolean) => {
    setDailyReportEnabled(value);
    await AsyncStorage.setItem('settings_daily_report', JSON.stringify(value));
    await syncToCloud({ dailyReport: value });
  };

  const toggleSevereWeather = async (value: boolean) => {
    if (!isPro) {
      handleProAction();
      return;
    }
    setSevereWeatherEnabled(value);
    await AsyncStorage.setItem('settings_sudden_alerts', JSON.stringify(value));
    await syncToCloud({ suddenAlerts: value });
    
    if (value && notificationsEnabled) {
      await registerWeatherCheckTask();
    } else {
      await unregisterWeatherCheckTask();
    }
  };

  const handleProAction = async () => {
    Alert.alert(
      "Upgrade to Pro",
      "Dynamic notifications (Snow, Rain, High Winds) are only available in the Pro version. Upgrade for a one-time fee of $4.99?",
      [
        { text: "Maybe Later", style: "cancel" },
        { 
          text: "Upgrade Now", 
          onPress: async () => {
            if (Platform.OS === 'web') {
              setIsPro(true);
              await AsyncStorage.setItem('is_pro_user', 'true');
              await syncToCloud({ isPro: true });
              Alert.alert("Success", "Web-simulated upgrade complete!");
              return;
            }

            try {
              const { initializePayment, openPaymentSheet } = require('@/services/paymentService');
              const initialized = await initializePayment(499);
              if (!initialized) {
                Alert.alert("Payment Error", "Could not initialize payment sheet. Please try again later.");
                return;
              }

              const success = await openPaymentSheet();
              if (success) {
                setIsPro(true);
                await AsyncStorage.setItem('is_pro_user', 'true');
                await syncToCloud({ isPro: true });
              }
            } catch (err) {
              console.error('Stripe Flow Error:', err);
              Alert.alert("Error", "Something went wrong with the payment process.");
            }
          } 
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General Preferences</Text>
        <TouchableOpacity style={styles.row} onPress={toggleUnit}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Temperature Units</Text>
            <Text style={styles.subLabel}>{unit}</Text>
          </View>
          <FontAwesome name="exchange" size={16} color="#8e8e93" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weather Alerts</Text>
        <View style={[styles.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#c6c6c8' }]}>
          <Text style={styles.label}>Enable Notifications</Text>
          <Switch 
            value={notificationsEnabled} 
            onValueChange={toggleNotifications}
            trackColor={{ false: "#767577", true: "#34C759" }}
            thumbColor={notificationsEnabled ? "#fff" : "#f4f3f4"}
          />
        </View>

        <View style={[styles.row, !notificationsEnabled && styles.disabled]}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Daily Weather Report</Text>
            <Text style={styles.subLabel}>Morning summary of the day's forecast</Text>
          </View>
          <Switch 
            value={dailyReportEnabled} 
            onValueChange={toggleDailyReport}
            disabled={!notificationsEnabled}
          />
        </View>
      </View>

      <View style={[styles.section, !notificationsEnabled && styles.disabled]}>
        <View style={styles.headerWithBadge}>
          <Text style={styles.sectionTitle}>Pro Features</Text>
          {!isPro && <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRO</Text></View>}
        </View>
        
        <TouchableOpacity 
          style={styles.row} 
          disabled={!notificationsEnabled}
          onPress={!isPro ? handleProAction : undefined}
        >
          <View style={styles.labelContainer}>
            <Text style={[styles.label, !isPro && styles.lockedLabel]}>Dynamic Alerts</Text>
            <Text style={styles.subLabel}>Warnings for snow, rain, or high winds</Text>
          </View>
          {isPro ? (
            <Switch 
              value={severeWeatherEnabled} 
              onValueChange={toggleSevereWeather}
              disabled={!notificationsEnabled}
            />
          ) : (
            <FontAwesome name="lock" size={20} color="#8e8e93" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          {Platform.OS === 'web' 
            ? "Notifications are simulated on the web."
            : `Notifications are delivered at 8:00 AM based on your primary saved location.`
          }
        </Text>
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
    marginVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#c6c6c8',
  },
  sectionTitle: {
    fontSize: 13,
    color: '#6e6e73',
    textTransform: 'uppercase',
    paddingVertical: 10,
    fontWeight: '600',
  },
  headerWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  proBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: 17,
    color: '#000',
  },
  subLabel: {
    fontSize: 13,
    color: '#8e8e93',
    marginTop: 2,
  },
  lockedLabel: {
    color: '#8e8e93',
  },
  disabled: {
    opacity: 0.5,
  },
  infoBox: {
    padding: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#8e8e93',
    lineHeight: 20,
    textAlign: 'center',
  },
});
