import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { fetchWeatherByCity } from './weatherService';
import { sendInstantWeatherAlert } from './notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const WEATHER_CHECK_TASK = 'weather-check-task';

TaskManager.defineTask(WEATHER_CHECK_TASK, async () => {
  try {
    const isAlertsEnabled = await AsyncStorage.getItem('settings_sudden_alerts');
    if (isAlertsEnabled === 'false') return BackgroundFetch.BackgroundFetchResult.NoData;

    const savedCity = await AsyncStorage.getItem('lastSearchedCity');
    if (!savedCity) return BackgroundFetch.BackgroundFetchResult.NoData;

    const weatherData = await fetchWeatherByCity(savedCity);
    const mainCondition = weatherData.weather[0].main.toLowerCase();

    // Sudden condition logic
    if (mainCondition.includes('storm') || mainCondition.includes('rain')) {
      await sendInstantWeatherAlert(
        `Weather Alert for ${savedCity}! ⛈️`,
        `Sudden ${mainCondition} detected. Stay safe!`
      );
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

  return BackgroundFetch.registerTaskAsync(WEATHER_CHECK_TASK, {
    minimumInterval: 60 * 60 * 2, // 2 hours
    stopOnTerminate: false, // android only
    startOnBoot: true, // android only
  });
}
