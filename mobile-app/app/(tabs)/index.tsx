import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  TextInput, 
  View, 
  ActivityIndicator, 
  Text, 
  TouchableOpacity, 
  Modal, 
  SafeAreaView,
  StatusBar
} from 'react-native';
import { WeatherCard } from '@/components/WeatherCard';
import { fetchWeatherByCity, fetchWeatherByCoords, searchCity } from '@/services/weatherService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import PagerView from '@/components/PagerView';
import { FontAwesome } from '@expo/vector-icons';

interface CityWeather {
  id: string;
  name: string;
  lat?: number;
  lon?: number;
  data: any;
  isCurrentLocation?: boolean;
}

export default function WeatherDashboard() {
  const [cities, setCities] = useState<CityWeather[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activePage, setActivePage] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      let currentCity: CityWeather | null = null;
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const weather = await fetchWeatherByCoords(location.coords.latitude, location.coords.longitude);
        currentCity = {
          id: 'current',
          name: weather.name,
          lat: location.coords.latitude,
          lon: location.coords.longitude,
          data: weather,
          isCurrentLocation: true
        };
      }

      const savedCitiesJson = await AsyncStorage.getItem('saved_cities');
      let savedCities: CityWeather[] = [];
      if (savedCitiesJson) {
        const parsed = JSON.parse(savedCitiesJson);
        const refreshed = await Promise.all(parsed.map(async (city: any) => {
          try {
            const data = await fetchWeatherByCity(city.name);
            return { ...city, data };
          } catch (e) {
            return city;
          }
        }));
        savedCities = refreshed;
      }

      const allCities = currentCity ? [currentCity, ...savedCities] : savedCities;
      setCities(allCities);
    } catch (err) {
      console.error(err);
      setError('Failed to load weather data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length > 2) {
      const results = await searchCity(text);
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  };

  const addCity = async (location: any) => {
    setLoading(true);
    setSearchModalVisible(false);
    try {
      const weather = await fetchWeatherByCity(`${location.name},${location.country}`);
      const newCity: CityWeather = {
        id: Date.now().toString(),
        name: location.name,
        lat: location.lat,
        lon: location.lon,
        data: weather
      };

      const updatedCities = [...cities, newCity];
      setCities(updatedCities);

      const toSave = updatedCities.filter(c => !c.isCurrentLocation);
      await AsyncStorage.setItem('saved_cities', JSON.stringify(toSave));

      setTimeout(() => {
        pagerRef.current?.setPage(updatedCities.length - 1);
        setActivePage(updatedCities.length - 1);
      }, 100);

    } catch (err) {
      setError('Could not add city.');
    } finally {
      setLoading(false);
      setQuery('');
      setSuggestions([]);
    }
  };

  if (loading && cities.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007aff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <View style={{ width: 40 }} /> 
        <Text style={styles.headerTitle}>Weather</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setSearchModalVisible(true)}
        >
          <FontAwesome name="plus" size={20} color="#007aff" />
        </TouchableOpacity>
      </View>

      {cities.length > 0 ? (
        <View style={styles.pagerWrapper}>
          <PagerView 
            style={styles.pager} 
            initialPage={0} 
            ref={pagerRef}
            onPageSelected={(e) => setActivePage(e.nativeEvent.position)}
          >
            {cities.map((city) => (
              <View key={city.id} style={styles.page}>
                <WeatherCard
                  name={city.name}
                  temp={city.data.main.temp}
                  description={city.data.weather[0].description}
                  humidity={city.data.main.humidity}
                  windSpeed={city.data.wind.speed}
                  isCurrentLocation={city.isCurrentLocation}
                />
              </View>
            ))}
          </PagerView>

          {/* Pagination Dots */}
          {cities.length > 1 && (
            <View style={styles.paginationDots}>
              {cities.map((_, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.dot, 
                    activePage === index ? styles.activeDot : styles.inactiveDot
                  ]} 
                />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error || 'No locations added yet.'}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => setSearchModalVisible(true)}
          >
            <Text style={styles.retryText}>Add a City</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={searchModalVisible}
        animationType="slide"
        transparent={false}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a city"
              value={query}
              onChangeText={handleSearch}
              autoFocus
            />
            <TouchableOpacity onPress={() => setSearchModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.resultsContainer}>
            {suggestions.map((loc, index) => (
              <TouchableOpacity 
                key={`${loc.lat}-${loc.lon}-${index}`} 
                style={styles.resultItem} 
                onPress={() => addCity(loc)}
              >
                <Text style={styles.resultText}>
                  {loc.name}, {loc.state ? `${loc.state}, ` : ''}{loc.country}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 50,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  addButton: {
    padding: 10,
  },
  pagerWrapper: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 40,
    width: '100%',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: '#333',
  },
  inactiveDot: {
    backgroundColor: '#ccc',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 15,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#eee',
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
  },
  cancelText: {
    color: '#007aff',
    fontSize: 16,
  },
  resultsContainer: {
    paddingHorizontal: 20,
  },
  resultItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultText: {
    fontSize: 16,
  },
  errorText: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007aff',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
});
