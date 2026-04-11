import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, View, ScrollView, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { WeatherCard } from '@/components/WeatherCard';
import { fetchWeatherByCity, searchCity } from '@/services/weatherService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function TabOneScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Placeholder for Auth state

  // Real-time autocomplete logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length > 2 && showSuggestions) {
        try {
          const locations = await searchCity(query);
          setSuggestions(locations || []);
        } catch (err) {
          console.error("Autocomplete error:", err);
        }
      } else {
        setSuggestions([]);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [query, showSuggestions]);

  const handleSelectCity = async (location: any) => {
    setQuery(`${location.name}${location.state ? `, ${location.state}` : ''}, ${location.country}`);
    setShowSuggestions(false);
    setSuggestions([]);
    getWeatherData(location);
  };

  const getWeatherData = async (location: any) => {
    setLoading(true);
    setError('');
    try {
      // Step 2: Fetch weather using exact name and country from geocoder
      const data = await fetchWeatherByCity(`${location.name},${location.country}`);
      setWeatherData(data);
      await AsyncStorage.setItem('lastSearchedCity', location.name);
    } catch (err) {
      setError('Could not fetch weather for this location.');
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = async () => {
    if (!query) return;
    setShowSuggestions(false);
    setLoading(true);
    setError('');
    try {
      if (suggestions.length > 0) {
        getWeatherData(suggestions[0]);
        return;
      }
      const locations = await searchCity(query);
      if (locations && locations.length > 0) {
        getWeatherData(locations[0]);
      } else {
        setError('City not found. Try being more specific (e.g. "Fresno, US").');
      }
    } catch (err) {
      setError('Search failed. Please check your API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.mainWrapper}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        
        {!isLoggedIn && (
          <View style={styles.loginIncentive}>
            <View style={styles.incentiveContent}>
              <Text style={styles.incentiveTitle}>Unlock Weather Alerts! 🔔</Text>
              <Text style={styles.incentiveText}>
                Sign in to save cities and receive daily reports & severe weather notifications.
              </Text>
              <TouchableOpacity 
                style={styles.incentiveButton} 
                onPress={() => router.push('/two')}
              >
                <Text style={styles.incentiveButtonText}>Sign In Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search city (e.g. Fresno)"
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                setShowSuggestions(true);
              }}
              onSubmitEditing={handleManualSearch}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleManualSearch}>
              <Text style={styles.searchButtonText}>GO</Text>
            </TouchableOpacity>
          </View>

          {suggestions.length > 0 && showSuggestions && (
            <View style={styles.suggestionsContainer}>
              {suggestions.map((loc, index) => (
                <TouchableOpacity 
                  key={`${loc.lat}-${loc.lon}-${index}`} 
                  style={styles.suggestionItem} 
                  onPress={() => handleSelectCity(loc)}
                >
                  <Text style={styles.suggestionText}>
                    {loc.name}, {loc.state ? `${loc.state}, ` : ''}{loc.country}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {loading && <ActivityIndicator size="large" color="#ff8c00" style={styles.loader} />}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {weatherData && !loading && (
          <WeatherCard
            name={weatherData.name}
            temp={weatherData.main.temp}
            humidity={weatherData.main.humidity}
            windSpeed={weatherData.wind.speed}
            description={weatherData.weather[0].description}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    padding: 20,
    paddingTop: 40,
  },
  loginIncentive: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee',
  },
  incentiveContent: {
    alignItems: 'center',
  },
  incentiveTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  incentiveText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  incentiveButton: {
    backgroundColor: '#007aff',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  incentiveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  searchSection: {
    zIndex: 100,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#ff8c00',
    justifyContent: 'center',
    paddingHorizontal: 25,
    borderRadius: 12,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  suggestionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
  },
  loader: {
    marginTop: 40,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});
