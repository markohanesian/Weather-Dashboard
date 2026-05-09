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
  Dimensions,
  useColorScheme
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Colors from '@/constants/Colors';
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
import { FontAwesome, Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { auth } from '@/services/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { fetchUserData, syncUserData } from '@/services/userService';

const { width } = Dimensions.get('window');

const getBackgroundColors = (condition: string = '', isDark: boolean): string[] => {
  const cond = condition.toLowerCase();
  if (isDark) {
    if (cond.includes('clear')) return ['#1a2a6c', '#b21f1f', '#fdbb2d']; // Sunset/Night
    if (cond.includes('cloud')) return ['#232526', '#414345'];
    if (cond.includes('rain')) return ['#0f2027', '#203a43', '#2c5364'];
    return ['#000000', '#434343'];
  } else {
    if (cond.includes('clear')) return ['#4facfe', '#00f2fe'];
    if (cond.includes('cloud')) return ['#bdc3c7', '#2c3e50'];
    if (cond.includes('rain')) return ['#4b6cb7', '#182848'];
    return ['#fff', '#eee'];
  }
};

interface CityWeather {
  id: string;
  name: string;
  lat?: number;
  lon?: number;
  data: any;
  forecast: any[];
  isCurrentLocation?: boolean;
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

export default function WeatherDashboard() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  
  const [cities, setCities] = useState<CityWeather[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activePage, setActivePage] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [units, setUnits] = useState('imperial');
  const [currentTime, setCurrentTime] = useState(new Date());
  const pagerRef = useRef<PagerView>(null);

  const activeCity = cities[activePage];
  const activeCondition = activeCity?.data?.weather[0]?.main || '';
  const backgroundColors = getBackgroundColors(activeCondition, isDark);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

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
        const cloudData = await fetchUserData(currentUser.uid);
        if (cloudData && cloudData.savedCities) {
          savedCities = cloudData.savedCities;
        } else {
            const savedCitiesJson = await AsyncStorage.getItem('saved_cities');
            if (savedCitiesJson) {
              savedCities = JSON.parse(savedCitiesJson);
            }
        }
      } else {
        const savedCitiesJson = await AsyncStorage.getItem('saved_cities');
        if (savedCitiesJson) {
          savedCities = JSON.parse(savedCitiesJson);
        }
      }

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
    const dailyData: { [key: string]: { temps: number[], condition: string } } = {};
    
    list.forEach(item => {
      const date = item.dt_txt.split(' ')[0];
      if (!dailyData[date]) dailyData[date] = { temps: [], condition: item.weather[0].main };
      dailyData[date].temps.push(item.main.temp);
    });

    return Object.keys(dailyData).slice(0, 5).map(date => {
      const { temps, condition } = dailyData[date];
      const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
      const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
      const minimalDay = dayName.startsWith('Th') ? 'Th' : (dayName.startsWith('Su') ? 'Su' : (dayName.startsWith('Sa') ? 'S' : dayName[0]));
      
      return {
        day: minimalDay,
        avgTemp: Math.round(avg),
        condition
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
      await AsyncStorage.setItem('saved_cities', JSON.stringify(toSave));
      
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
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
        <Text style={{ marginTop: 20, color: theme.text, opacity: 0.6 }}>Fetching local weather...</Text>
      </View>
    );
  }

  const unitLabel = units === 'imperial' ? 'F' : 'C';

  return (
    <View style={styles.container}>
      <LinearGradient colors={backgroundColors} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={[styles.dateTimeText, { color: theme.text }]}>
              {formattedDate} • {formattedTime}
            </Text>
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={() => setSearchModalVisible(true)}
            >
              <FontAwesome name="plus" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.naturalStatusText, { color: theme.text }]}>
            Here's the current weather in
          </Text>
        </View>

        {cities.length > 1 && (
          <View style={styles.paginationDots}>
            {cities.map((_, index) => (
              <View 
                key={index} 
                style={[
                  styles.dot, 
                  activePage === index 
                    ? { backgroundColor: theme.text } 
                    : { backgroundColor: theme.text, opacity: 0.3 }
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
                    feelsLike={city.data.main.feels_like}
                    tempMin={city.data.main.temp_min}
                    tempMax={city.data.main.temp_max}
                    pressure={city.data.main.pressure}
                    condition={city.data.weather[0].main}
                  />
                  
                  <BlurView intensity={isDark ? 40 : 60} tint={isDark ? "dark" : "light"} style={styles.minimalForecastSection}>
                    {city.forecast.map((item, idx) => (
                      <View key={idx} style={styles.forecastColumn}>
                        <Text style={[styles.minimalForecastDay, { color: theme.text, opacity: 0.6 }]}>{item.day}</Text>
                        <Feather 
                          name={getWeatherIcon(item.condition)} 
                          size={20} 
                          color={theme.text} 
                          style={{ marginVertical: 4 }}
                        />
                        <Text style={[styles.minimalForecastTemp, { color: theme.text }]}>{item.avgTemp}°</Text>
                      </View>
                    ))}
                  </BlurView>
                  <View style={{ height: 40 }} />
                </ScrollView>
              ))}
            </PagerView>
          </View>
        ) : (
          <View style={styles.centered}>
            <Text style={[styles.errorText, { color: theme.text }]}>{error || 'No locations added yet.'}</Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: theme.tint }]} 
              onPress={() => setSearchModalVisible(true)}
            >
              <Text style={[styles.retryText, { color: isDark ? '#000' : '#fff' }]}>Add a City</Text>
            </TouchableOpacity>
          </View>
        )}

        {!user && (
          <TouchableOpacity 
            style={[styles.incentiveBanner, { backgroundColor: theme.tint }]} 
            onPress={() => router.push('/two')}
          >
            <View style={styles.bannerContent}>
              <FontAwesome name="cloud-upload" size={18} color={isDark ? '#000' : '#fff'} />
              <Text style={[styles.bannerText, { color: isDark ? '#000' : '#fff' }]}>Sign in to sync your cities across devices</Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color={isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)'} />
          </TouchableOpacity>
        )}

        <Modal
          visible={searchModalVisible}
          animationType="slide"
          transparent={false}
        >
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <TextInput
                style={[styles.searchInput, { backgroundColor: isDark ? '#222' : '#eee', color: theme.text }]}
                placeholder="Search for a city"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={query}
                onChangeText={handleSearch}
                autoFocus
              />
              <TouchableOpacity onPress={() => setSearchModalVisible(false)}>
                <Text style={[styles.cancelText, { color: theme.tint }]}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.resultsContainer}>
              {suggestions.map((loc, index) => (
                <TouchableOpacity 
                  key={`${loc.lat}-${loc.lon}-${index}`} 
                  style={[styles.resultItem, { borderBottomColor: isDark ? '#333' : '#eee' }]} 
                  onPress={() => addCity(loc)}
                >
                  <Text style={[styles.resultText, { color: theme.text }]}>
                    {loc.name}, {loc.state ? `${loc.state}, ` : ''}{loc.country}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </View>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  dateTimeText: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  naturalStatusText: {
    fontSize: 16,
    fontWeight: '400',
    opacity: 0.7,
  },
  addButton: {
    padding: 5,
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
    margin: 15,
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
  },
  forecastColumn: {
    alignItems: 'center',
    gap: 2,
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
