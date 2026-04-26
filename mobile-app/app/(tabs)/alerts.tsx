import React, { useState, useEffect } from 'react';
import { StyleSheet, Switch, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export default function AlertsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyReportEnabled, setDailyReportEnabled] = useState(false);
  const [severeWeatherEnabled, setSevereWeatherEnabled] = useState(false);
  const [isPro, setIsPro] = useState(false); // Tier state

  const handleProAction = () => {
    Alert.alert(
      "Upgrade to Pro",
      "Dynamic notifications (Snow, Rain, High Winds) are only available in the Pro version. Would you like to upgrade?",
      [
        { text: "Maybe Later", style: "cancel" },
        { text: "Upgrade Now", onPress: () => setIsPro(true) }
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
            onValueChange={setNotificationsEnabled}
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
            onValueChange={setDailyReportEnabled}
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
              onValueChange={setSevereWeatherEnabled}
              disabled={!notificationsEnabled}
            />
          ) : (
            <FontAwesome name="lock" size={20} color="#8e8e93" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Notifications are delivered based on your saved locations. You will receive alerts for the city currently displayed on your home screen.
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
