import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { height } = Dimensions.get('window');

interface WeatherCardProps {
  name: string;
  temp: number;
  humidity: number;
  windSpeed: number;
  description: string;
  isCurrentLocation?: boolean;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({
  name,
  temp,
  humidity,
  windSpeed,
  description,
  isCurrentLocation
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.cityName}>{name}</Text>
        {isCurrentLocation && <Text style={styles.currentLocationLabel}>Current Location</Text>}
        <Text style={styles.temp}>{Math.round(temp)}°</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.detailCard}>
          <Text style={styles.detailLabel}>HUMIDITY</Text>
          <Text style={styles.detailValue}>{humidity}%</Text>
        </View>
        <View style={styles.detailCard}>
          <Text style={styles.detailLabel}>WIND</Text>
          <Text style={styles.detailValue}>{Math.round(windSpeed)} mph</Text>
        </View>
        {/* We can add more details here later like UV Index, Feels Like etc */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
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
  },
  temp: {
    fontSize: 96,
    fontWeight: '200',
    color: '#333',
    marginLeft: 15, // Optical centering for the degree symbol
  },
  description: {
    fontSize: 20,
    fontWeight: '500',
    color: '#666',
    textTransform: 'capitalize',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
    gap: 15,
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
    fontSize: 24,
    fontWeight: '500',
    color: '#333',
  },
});
