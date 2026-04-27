import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

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
  return (
    <Animated.View 
      entering={FadeIn.duration(800)} 
      style={styles.container}
    >
      <Animated.View 
        entering={FadeInDown.delay(200).duration(800)} 
        style={styles.header}
      >
        <Text style={styles.cityName}>{name}</Text>
        {isCurrentLocation && <Text style={styles.currentLocationLabel}>Current Location</Text>}
        
        <View style={styles.iconContainer}>
          <Feather name={getWeatherIcon(condition)} size={64} color="#333" />
        </View>

        <View style={styles.tempContainer}>
          <Text style={styles.temp}>{Math.round(temp)}°</Text>
          <Text style={styles.unit}>{unit}</Text>
        </View>
        
        <Text style={styles.description}>{description}</Text>
        
        <View style={styles.highLowContainer}>
          <Text style={styles.highLowText}>H: {Math.round(tempMax)}°</Text>
          <Text style={styles.highLowText}>L: {Math.round(tempMin)}°</Text>
        </View>
      </Animated.View>

      <View style={styles.detailsGrid}>
        <DetailCard 
          label="FEELS LIKE" 
          value={`${Math.round(feelsLike)}°`} 
          delay={400} 
        />
        <DetailCard 
          label="HUMIDITY" 
          value={`${humidity}%`} 
          delay={500} 
        />
        <DetailCard 
          label="WIND" 
          value={`${Math.round(windSpeed)} ${unit === 'F' ? 'mph' : 'm/s'}`} 
          delay={600} 
        />
        <DetailCard 
          label="PRESSURE" 
          value={`${pressure} hPa`} 
          delay={700} 
        />
      </View>
    </Animated.View>
  );
};

const DetailCard = ({ label, value, delay }: { label: string; value: string; delay: number }) => (
  <Animated.View 
    entering={FadeInDown.delay(delay).duration(600)} 
    style={styles.detailCard}
  >
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </Animated.View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
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
    color: '#333',
    marginBottom: 4,
  },
  currentLocationLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  iconContainer: {
    marginVertical: 10,
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginLeft: 20,
  },
  temp: {
    fontSize: 96,
    fontWeight: '200',
    color: '#333',
  },
  unit: {
    fontSize: 24,
    fontWeight: '300',
    color: '#333',
    marginTop: 20,
  },
  description: {
    fontSize: 20,
    fontWeight: '500',
    color: '#666',
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
    color: '#333',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
    gap: 15,
    marginTop: 20,
  },
  detailCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 16,
    width: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 20,
    fontWeight: '500',
    color: '#333',
  },
});
