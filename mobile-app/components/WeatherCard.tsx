import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface WeatherCardProps {
  name: string;
  temp: number;
  humidity: number;
  windSpeed: number;
  description: string;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({
  name,
  temp,
  humidity,
  windSpeed,
  description,
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.cityName}>{name}</Text>
      <Text style={styles.temp}>{Math.round(temp)}°F</Text>
      <Text style={styles.description}>{description}</Text>
      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Humidity</Text>
          <Text style={styles.detailValue}>{humidity}%</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Wind Speed</Text>
          <Text style={styles.detailValue}>{windSpeed} mph</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginVertical: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    alignItems: 'center',
  },
  cityName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  temp: {
    fontSize: 64,
    fontWeight: '300',
    color: '#ff8c00',
  },
  description: {
    fontSize: 18,
    textTransform: 'capitalize',
    color: '#666',
    marginBottom: 20,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 20,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});
