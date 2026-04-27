import React, { useState, useEffect } from 'react';
import { StyleSheet, Switch, Text, View, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerWeatherCheckTask, unregisterWeatherCheckTask } from '@/services/backgroundService';
import { cancelAllNotifications, requestNotificationPermissions } from '@/services/notificationService';
import { auth } from '@/services/firebaseConfig';
import { syncUserData } from '@/services/userService';

export default function AlertsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyReportEnabled, setDailyReportEnabled] = useState(false);
  const [severeWeatherEnabled, setSevereWeatherEnabled] = useState(false);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const on = await AsyncStorage.getItem('settings_notifications_on');
      const daily = await AsyncStorage.getItem('settings_daily_report');
      const sudden = await AsyncStorage.getItem('settings_sudden_alerts');
      const pro = await AsyncStorage.getItem('is_pro_user');

      if (on !== null) setNotificationsEnabled(JSON.parse(on));
      if (daily !== null) setDailyReportEnabled(JSON.parse(daily));
      if (sudden !== null) setSevereWeatherEnabled(JSON.parse(sudden));
      if (pro !== null) setIsPro(JSON.parse(pro));
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
        console.error('Failed to sync alerts to cloud', e);
      }
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
      // Re-register background task if pro and enabled
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

  const handleProAction = () => {
    Alert.alert(
      "Upgrade to Pro",
      "Dynamic notifications (Snow, Rain, High Winds) are only available in the Pro version. Would you like to upgrade?",
      [
        { text: "Maybe Later", style: "cancel" },
        { 
          text: "Upgrade Now", 
          onPress: async () => {
            setIsPro(true);
            await AsyncStorage.setItem('is_pro_user', 'true');
            await syncToCloud({ isPro: true });
          } 
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Notifications {notificationsEnabled ? 'On' : 'Off'}</Text>
          <Switch 
            value={notificationsEnabled} 
            onValueChange={toggleNotifications}
            trackColor={{ false: "#767577", true: "#34C759" }}
            thumbColor={notificationsEnabled ? "#fff" : "#f4f3f4"}
          />
        </View>
      </View>

      <View style={[styles.section, !notificationsEnabled && styles.disabled]}>
        <Text style={styles.sectionTitle}>Free Tier</Text>
        <View style={styles.row}>
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
          <Text style={styles.sectionTitle}>Pro Tier</Text>
          {!isPro && <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRO</Text></View>}
        </View>
        
        <TouchableOpacity 
          style={styles.row} 
          disabled={!notificationsEnabled}
          onPress={!isPro ? handleProAction : undefined}
        >
          <View style={styles.labelContainer}>
            <Text style={[styles.label, !isPro && styles.lockedLabel]}>Dynamic Alerts</Text>
            <Text style={styles.subLabel}>Warning for snow, rain, or high winds</Text>
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
            ? "Notifications are simulated on the web. Test on a physical device with Expo Go to see real background alerts."
            : "Notifications are delivered based on your primary saved location."
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
