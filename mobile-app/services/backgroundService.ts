import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { fetchWeatherByCity } from './weatherService';
import { sendInstantWeatherAlert } from './notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const WEATHER_CHECK_TASK = 'weather-check-task';

TaskManager.defineTask(WEATHER_CHECK_TASK, async () => {
  try {
    const isAlertsEnabled = await AsyncStorage.getItem('settings_notifications_on');
    if (isAlertsEnabled === 'false') return BackgroundFetch.BackgroundFetchResult.NoData;

    const isPro = await AsyncStorage.getItem('is_pro_user');
    const suddenAlertsEnabled = await AsyncStorage.getItem('settings_sudden_alerts');
    
    // Dynamic alerts are a PRO feature
    if (isPro !== 'true' || suddenAlertsEnabled !== 'true') {
        return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const savedCitiesJson = await AsyncStorage.getItem('saved_cities');
    let cityToCheck = 'London'; // Default fallback
    
    if (savedCitiesJson) {
        const cities = JSON.parse(savedCitiesJson);
        if (cities.length > 0) {
            cityToCheck = cities[0].name; // Check the primary saved city
        }
    }

    const weatherData = await fetchWeatherByCity(cityToCheck);
    const mainCondition = weatherData.weather[0].main.toLowerCase();
    const windSpeed = weatherData.wind.speed;

    let alertTriggered = false;
    let alertMessage = '';

    // Pro Tier: Dynamic alerts for significant changes
    if (mainCondition.includes('snow')) {
      alertMessage = `Significant snowfall detected in ${cityToCheck}! ❄️`;
      alertTriggered = true;
    } else if (mainCondition.includes('rain') || mainCondition.includes('storm')) {
      alertMessage = `Rain or storms expected in ${cityToCheck}. 🌧️`;
      alertTriggered = true;
    } else if (windSpeed > 25) { // High winds > 25mph
      alertMessage = `High winds detected in ${cityToCheck} (${Math.round(windSpeed)} mph). 💨`;
      alertTriggered = true;
    }

    if (alertTriggered) {
      await sendInstantWeatherAlert(`Weather Alert: ${cityToCheck}`, alertMessage);
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }

    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('Background task failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerWeatherCheckTask() {
  if (Platform.OS === 'web') return;

  try {
    const isPro = await AsyncStorage.getItem('is_pro_user');
    const suddenAlertsEnabled = await AsyncStorage.getItem('settings_sudden_alerts');
    const notificationsOn = await AsyncStorage.getItem('settings_notifications_on');

    if (isPro !== 'true' || suddenAlertsEnabled !== 'true' || notificationsOn === 'false') {
        console.log('Skipping weather task registration: Settings not met.');
        return;
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(WEATHER_CHECK_TASK);
    if (!isRegistered) {
        console.log('Registering Weather Check Task...');
        return BackgroundFetch.registerTaskAsync(WEATHER_CHECK_TASK, {
        minimumInterval: 60 * 60 * 3, // Check every 3 hours
        stopOnTerminate: false,
        startOnBoot: true,
        });
    }
  } catch (e) {
    console.error('Failed to register task:', e);
  }
}

export async function unregisterWeatherCheckTask() {
    if (Platform.OS === 'web') return;
    const isRegistered = await TaskManager.isTaskRegisteredAsync(WEATHER_CHECK_TASK);
    if (isRegistered) {
        return BackgroundFetch.unregisterTaskAsync(WEATHER_CHECK_TASK);
    }
}
