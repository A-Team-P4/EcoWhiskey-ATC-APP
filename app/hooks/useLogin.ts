import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AuthResponse, LoginCredentials } from '@/interfaces/user';
import { notifyAuthTokenChange } from '@/lib/authTokenEvents';
import { CURRENT_USER_QUERY_KEY } from '@/query_hooks/useUserProfile';
import { loginUser } from '@/services/apiClient';

const AUTH_TOKEN_STORAGE_KEY = '@auth_token';
const AUTH_USER_STORAGE_KEY = '@auth_user';

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, unknown, LoginCredentials>({
    mutationFn: (credentials) => loginUser(credentials),
    onSuccess: async (data) => {
      if (data?.accessToken) {
        try {
          await AsyncStorage.setItem(AUTH_TOKEN_STORAGE_KEY, data.accessToken);
          await AsyncStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(data.user));
          queryClient.setQueryData(CURRENT_USER_QUERY_KEY, data.user);
          notifyAuthTokenChange(true);
        } catch (error) {
          
        }
      }
    },
    onError: (error) => {
     
    },
  });
};
