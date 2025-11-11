import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AuthResponse, LoginCredentials } from '../interfaces/user';
import { loginUser } from '../services/apiClient';
import { decodeJWT, JWTPayload } from '../utils/jwt';

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, unknown, LoginCredentials>({
    mutationFn: (credentials) => loginUser(credentials),
    onSuccess: async (data) => {
      console.log(data);
      if (data?.accessToken) {
        try {
          await AsyncStorage.setItem('@auth_token', data.accessToken);

          const decoded = decodeJWT<JWTPayload>(data.accessToken);
          if (decoded?.user?.id) {
            await AsyncStorage.setItem('@user_id', decoded.user.id.toString());
            queryClient.invalidateQueries({ queryKey: ['user', decoded.user.id] });
            console.log('✅ User ID extracted:', decoded.user.id);
          }
        } catch (error) {
          console.warn('Failed to persist auth token or decode JWT', error);
        }
      }
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });
};
