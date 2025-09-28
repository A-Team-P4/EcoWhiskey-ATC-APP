import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from '@tanstack/react-query';

import { AuthResponse, LoginCredentials } from '../interfaces/user';
import { loginUser } from '../services/apiClient';

export const useLogin = () => {
  return useMutation<AuthResponse, unknown, LoginCredentials>({
    mutationFn: (credentials) => loginUser(credentials),
    onSuccess: async (data) => {
      if (data?.token) {
        try {
          await AsyncStorage.setItem('@auth_token', data.token);
        } catch (error) {
          console.warn('Failed to persist auth token', error);
        }
      }
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });
};
