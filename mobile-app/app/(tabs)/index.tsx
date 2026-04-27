import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  TextInput, 
  View, 
  ActivityIndicator, 
  Text, 
  TouchableOpacity, 
  Modal, 
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions
} from 'react-native';
import { WeatherCard } from '@/components/WeatherCard';
import { 
  fetchWeatherByCity, 
  fetchWeatherByCoords, 
  searchCity,
  fetchForecastByCity,
  fetchForecastByCoords
} from '@/services/weatherService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import PagerView from '@/components/PagerView';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { auth } from '@/services/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { fetchUserData, syncUserData } from '@/services/userService';

const { width } = Dimensions.get('window');

interface CityWeather {
  id: string;
  name: string;
  lat?: number;
  lon?: number;
  data: any;
  forecast: any[];
  isCurrentLocation?: boolean;
}

export default function WeatherDashboard() {
  const router = useRouter();
  const [cities, setCities] = useState<CityWeather[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activePage, setActivePage] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [units, setUnits] = useState('imperial');
  const pagerRef = useRef<PagerView>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadInitialData(units, currentUser);
      } else {
        loadInitialData(units, null);
      }
    });
    return () => unsubscribe();
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkAppStatus();
    }, [units, user])
  );

  const checkAppStatus = async () => {
    try {
      const savedUnit = await AsyncStorage.getItem('settings_units');
      const normalizedUnit = savedUnit?.toLowerCase() || 'imperial';
      
      if (normalizedUnit !== units) {
        setUnits(normalizedUnit);
        loadInitialData(normalizedUnit, user); 
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadInitialData = async (currentUnits: string, currentUser: User | null) => {
    setLoading(true);
    setError('');
    try {
      let currentCity: CityWeather | null = null;
      
      try {
        const { status } = await Promise.race([
          Location.requestForegroundPermissionsAsync(),
          new Promise<{status: string}>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ]) as any;

        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
          const weather = await fetchWeatherByCoords(location.coords.latitude, location.coords.longitude, currentUnits);
          const forecast = await fetchForecastByCoords(location.coords.latitude, location.coords.longitude, currentUnits);
          
          currentCity = {
            id: 'current',
            name: weather.name,
            lat: location.coords.latitude,
            lon: location.coords.longitude,
            data: weather,
            forecast: processForecast(forecast.list),
            isCurrentLocation: true
          };
        }
      } catch (locErr) {
        console.warn('Location access skipped or timed out:', locErr);
      }

      let savedCities: CityWeather[] = [];
      
      if (currentUser) {
        // Load from Firebase if logged in
        const cloudData = await fetchUserData(currentUser.uid);
        if (cloudData && cloudData.savedCities) {
          savedCities = cloudData.savedCities;
        } else {
            // If no cloud data, try local storage
            const savedCitiesJson = await AsyncStorage.getItem('saved_cities');
            if (savedCitiesJson) {
              savedCities = JSON.parse(savedCitiesJson);
            }
        }
      } else {
        // Load from LocalStorage if guest
        const savedCitiesJson = await AsyncStorage.getItem('saved_cities');
        if (savedCitiesJson) {
          savedCities = JSON.parse(savedCitiesJson);
        }
      }

      // Refresh weather data for all saved cities
      const refreshed = await Promise.all(savedCities.map(async (city: any) => {
        try {
          const data = await fetchWeatherByCity(city.name, currentUnits);
          const forecast = await fetchForecastByCity(city.name, currentUnits);
          return { 
            ...city, 
            data, 
            forecast: processForecast(forecast.list) 
          };
        } catch (e) {
          return city;
        }
      }));
      
      const allCities = currentCity ? [currentCity, ...refreshed] : refreshed;
      setCities(allCities);
    } catch (err) {
      console.error(err);
      setError('Could not load data. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const processForecast = (list: any[]) => {
    const dailyData: { [key: string]: number[] } = {};
    
    list.forEach(item => {
      const date = item.dt_txt.split(' ')[0];
      if (!dailyData[date]) dailyData[date] = [];
      dailyData[date].push(item.main.temp);
    });

    return Object.keys(dailyData).slice(0, 5).map(date => {
      const temps = dailyData[date];
      const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
      const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
      const minimalDay = dayName.startsWith('Th') ? 'Th' : (dayName.startsWith('Su') ? 'Su' : (dayName.startsWith('Sa') ? 'S' : dayName[0]));
      
      return {
        day: minimalDay,
        avgTemp: Math.round(avg)
      };
    });
  };

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length > 2) {
      try {
        const results = await searchCity(text);
        setSuggestions(results);
      } catch (e) {
        console.error(e);
      }
    } else {
      setSuggestions([]);
    }
  };

  const addCity = async (location: any) => {
    setLoading(true);
    setSearchModalVisible(false);
    try {
      const weather = await fetchWeatherByCity(`${location.name},${location.country}`, units);
      const forecast = await fetchForecastByCity(`${location.name},${location.country}`, units);
      
      const newCity: CityWeather = {
        id: Date.now().toString(),
        name: location.name,
        lat: location.lat,
        lon: location.lon,
        data: weather,
        forecast: processForecast(forecast.list)
      };

      const updatedCities = [...cities, newCity];
      setCities(updatedCities);

      const toSave = updatedCities.filter(c => !c.isCurrentLocation);
      
      // Save locally
      await AsyncStorage.setItem('saved_cities', JSON.stringify(toSave));
      
      // Sync to cloud if logged in
      if (user) {
        await syncUserData(user.uid, { savedCities: toSave });
      }

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
        <Text style={{ marginTop: 20, color: '#666' }}>Fetching local weather...</Text>
      </View>
    );
  }

  const unitLabel = units === 'imperial' ? 'F' : 'C';

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

      {cities.length > 0 ? (
        <View style={styles.mainContent}>
          <PagerView 
            style={styles.pager} 
            initialPage={0} 
            ref={pagerRef}
            onPageSelected={(e) => setActivePage(e.nativeEvent.position)}
          >
            {cities.map((city) => (
              <ScrollView key={city.id} style={styles.page} showsVerticalScrollIndicator={false}>
                <WeatherCard
                  name={city.name}
                  temp={city.data.main.temp}
                  unit={unitLabel}
                  description={city.data.weather[0].description}
                  humidity={city.data.main.humidity}
                  windSpeed={city.data.wind.speed}
                  isCurrentLocation={city.isCurrentLocation}
                />
                
                <View style={styles.minimalForecastSection}>
                  {city.forecast.map((item, idx) => (
                    <View key={idx} style={styles.forecastColumn}>
                      <Text style={styles.minimalForecastDay}>{item.day}</Text>
                      <Text style={styles.minimalForecastTemp}>{item.avgTemp}°</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            ))}
          </PagerView>
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

      {!user && (
        <TouchableOpacity 
          style={styles.incentiveBanner} 
          onPress={() => router.push('/two')}
        >
          <View style={styles.bannerContent}>
            <FontAwesome name="cloud-upload" size={18} color="#fff" />
            <Text style={styles.bannerText}>Sign in to sync your cities across devices</Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
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
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    backgroundColor: '#333',
  },
  inactiveDot: {
    backgroundColor: '#ccc',
  },
  mainContent: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  minimalForecastSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    margin: 15,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  forecastColumn: {
    alignItems: 'center',
    gap: 8,
  },
  minimalForecastDay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  minimalForecastTemp: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  incentiveBanner: {
    backgroundColor: '#007aff',
    margin: 15,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#007aff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
