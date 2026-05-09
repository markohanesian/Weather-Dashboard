import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, useColorScheme } from 'react-native';
import Animated, { 
  FadeInDown, 
  FadeIn, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence 
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Colors from '@/constants/Colors';

const { width } = Dimensions.get('window');

interface WeatherCardProps {
  name: string;
  temp: number;
  humidity: number;
  windSpeed: number;
  description: string;
  isCurrentLocation?: boolean;
  unit?: string;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  pressure: number;
  condition?: string;
}

const getWeatherIcon = (condition: string = '') => {
  const cond = condition.toLowerCase();
  if (cond.includes('clear')) return 'sun';
  if (cond.includes('cloud')) return 'cloud';
  if (cond.includes('rain')) return 'cloud-rain';
  if (cond.includes('drizzle')) return 'cloud-drizzle';
  if (cond.includes('thunderstorm')) return 'cloud-lightning';
  if (cond.includes('snow')) return 'cloud-snow';
  if (cond.includes('wind')) return 'wind';
  return 'cloud';
};

export const WeatherCard: React.FC<WeatherCardProps> = ({
  name,
  temp,
  humidity,
  windSpeed,
  description,
  isCurrentLocation,
  unit = 'F',
  feelsLike,
  tempMin,
  tempMax,
  pressure,
  condition
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const floatValue = useSharedValue(0);

  useEffect(() => {
    floatValue.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: floatValue.value }],
    };
  });

  return (
    <Animated.View 
      entering={FadeIn.duration(800)} 
      style={styles.container}
    >
      <Animated.View 
        entering={FadeInDown.delay(200).duration(800)} 
        style={styles.header}
      >
        <Text style={[styles.cityName, { color: theme.text }]}>{name}</Text>
        {isCurrentLocation && <Text style={[styles.currentLocationLabel, { color: theme.text, opacity: 0.6 }]}>Current Location</Text>}
        
        <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
          <Feather name={getWeatherIcon(condition)} size={100} color={theme.text} />
        </Animated.View>

        <View style={styles.tempContainer}>
          <Text style={[styles.temp, { color: theme.text }]}>{Math.round(temp)}°</Text>
          <Text style={[styles.unit, { color: theme.text }]}>{unit}</Text>
        </View>
        
        <Text style={[styles.description, { color: theme.text, opacity: 0.8 }]}>{description}</Text>
        
        <View style={styles.highLowContainer}>
          <Text style={[styles.highLowText, { color: theme.text }]}>H: {Math.round(tempMax)}°</Text>
          <Text style={[styles.highLowText, { color: theme.text }]}>L: {Math.round(tempMin)}°</Text>
        </View>
      </Animated.View>

      <View style={styles.detailsGrid}>
        <DetailCard 
          label="FEELS LIKE" 
          value={`${Math.round(feelsLike)}°`} 
          delay={400} 
          isDark={isDark}
          theme={theme}
        />
        <DetailCard 
          label="HUMIDITY" 
          value={`${humidity}%`} 
          delay={500} 
          isDark={isDark}
          theme={theme}
        />
        <DetailCard 
          label="WIND" 
          value={`${Math.round(windSpeed)} ${unit === 'F' ? 'mph' : 'm/s'}`} 
          delay={600} 
          isDark={isDark}
          theme={theme}
        />
        <DetailCard 
          label="PRESSURE" 
          value={`${pressure} hPa`} 
          delay={700} 
          isDark={isDark}
          theme={theme}
        />
      </View>
    </Animated.View>
  );
};

const DetailCard = ({ label, value, delay, isDark, theme }: { label: string; value: string; delay: number; isDark: boolean; theme: any }) => (
  <Animated.View 
    entering={FadeInDown.delay(delay).duration(600)} 
    style={styles.detailCardWrapper}
  >
    <BlurView intensity={isDark ? 40 : 60} tint={isDark ? "dark" : "light"} style={styles.detailCardBlur}>
      <Text style={[styles.detailLabel, { color: theme.text, opacity: 0.5 }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: theme.text }]}>{value}</Text>
    </BlurView>
  </Animated.View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    width: '100%',
  },
  cityName: {
    fontSize: 34,
    fontWeight: '400',
    marginBottom: 4,
  },
  currentLocationLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  iconContainer: {
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginLeft: 20,
  },
  temp: {
    fontSize: 96,
    fontWeight: '200',
  },
  unit: {
    fontSize: 24,
    fontWeight: '300',
    marginTop: 20,
  },
  description: {
    fontSize: 20,
    fontWeight: '500',
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  highLowContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  highLowText: {
    fontSize: 16,
    fontWeight: '500',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 15,
    gap: 12,
    marginTop: 20,
  },
  detailCardWrapper: {
    width: '46%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  detailCardBlur: {
    padding: 16,
    height: 100,
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 24,
    fontWeight: '300',
  },
});
