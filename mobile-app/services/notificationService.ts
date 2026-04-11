import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') {
    console.log('Push notifications are not configured for web.');
    return null;
  }

  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    // alert('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

export async function scheduleDailyWeatherNotification(hour: number, minute: number, weatherInfo: string) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Today's Weather Forecast 🌤️",
      body: weatherInfo,
      data: { data: 'goes here' },
    },
    trigger: {
      hour: hour,
      minute: minute,
      repeats: true,
    },
  });
}

export async function sendInstantWeatherAlert(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: title,
      body: body,
      data: { type: 'alert' },
    },
    trigger: null, // Send immediately
  });
}
