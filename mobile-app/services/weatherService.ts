import axios from 'axios';

const API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const ONECALL_URL = 'https://api.openweathermap.org/data/3.0/onecall';

export const fetchWeatherByCity = async (city: string, units: string = 'imperial') => {
  try {
    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        q: city,
        units,
        appid: API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching weather:', error);
    throw error;
  }
};

export const fetchWeatherByCoords = async (lat: number, lon: number, units: string = 'imperial') => {
  try {
    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        lat,
        lon,
        units,
        appid: API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching weather by coords:', error);
    throw error;
  }
};

export const fetchForecastByCity = async (city: string, units: string = 'imperial') => {
  try {
    const response = await axios.get(`${BASE_URL}/forecast`, {
      params: {
        q: city,
        units,
        appid: API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching forecast:', error);
    throw error;
  }
};

export const fetchForecastByCoords = async (lat: number, lon: number, units: string = 'imperial') => {
  try {
    const response = await axios.get(`${BASE_URL}/forecast`, {
      params: {
        lat,
        lon,
        units,
        appid: API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching forecast by coords:', error);
    throw error;
  }
};

export const fetchOneCallWeather = async (lat: number, lon: number, units: string = 'imperial') => {
  try {
    const response = await axios.get(ONECALL_URL, {
      params: {
        lat,
        lon,
        exclude: 'minutely',
        units,
        appid: API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching onecall weather:', error);
    throw error;
  }
};

export const searchCity = async (query: string) => {
  try {
    const response = await axios.get(`https://api.openweathermap.org/geo/1.0/direct`, {
      params: {
        q: query,
        limit: 5,
        appid: API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error searching city:', error);
    throw error;
  }
};
