// services/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';
import { AuthResponse, LoginCredentials, RegistrationData } from '../interfaces/user';

// Get the correct base URL based on platform
const getBaseURL = () => {
  if (__DEV__) {
    // Development mode
    if (Platform.OS === 'web') {
     
      return 'http://localhost:8000';
    } else if (Platform.OS === 'android') {

      return 'http://10.0.2.2:8000';
    } else {
      
      return 'http://200.105.99.71:8000'; //Aqui pongan su IP si estan usando IOS
    }
  } else {
    // Production mode
    return 'https://your-production-api.com/api';
  }
};

const API_BASE_URL = getBaseURL();

// Create Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('@auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log requests in development
    if (__DEV__) {
      console.log(`🚀 API: ${config.method?.toUpperCase()} ${config.url}`);
      console.log(`📍 Base URL: ${API_BASE_URL}`);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`✅ SUCCESS API: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    if (__DEV__) {
      console.error(`❌ ERROR API:`, error.response?.data || error.message);
      if (error.message === 'Network Error') {
        console.error(`🔌 Network Error - Check if backend is running at ${API_BASE_URL}`);
      }
    }

    // Handle common errors
    if (error.response?.status === 401) {
      // Token expired - you might want to redirect to login
      AsyncStorage.removeItem('@auth_token');
    }

    return Promise.reject(error);
  }
);

// Registration function
export const registerUser = async (userData: RegistrationData) => {
  const response = await apiClient.post('/users', userData);
  return response.data;
};

// Login function
export const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
  return response.data;
};

// Audio interaction function
export const sendAudioForAnalysis = async (audioUri: string) => {
  const formData = new FormData();
  formData.append('audio', {
    uri: audioUri,
    name: 'recording.m4a',
    type: 'audio/m4a',
  } as any);

  const response = await apiClient.post('/audio/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 30000, 
  });

  return response.data;
};

export default apiClient;