import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from 'react';
import { getUserById } from "../services/apiClient";

export const useGetUserById = (userId: number | string) => {
  const normalizedId = String(userId);
  return useQuery({
    queryKey: ['user', normalizedId],
    queryFn: () => getUserById(normalizedId),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, 
  });
};

/**
 * Hook to get the current logged-in user's data
 * Automatically reads user ID from AsyncStorage and fetches user details
 */
export const useGetMe = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const loadAuthData = async () => {
      const [storedUserId, token] = await Promise.all([
        AsyncStorage.getItem('@user_id'),
        AsyncStorage.getItem('@auth_token')
      ]);

      // Only set userId if we have a valid token
      if (token && storedUserId) {
        setUserId(storedUserId);
        setHasToken(true);
      } else {
        // Clear stale user data if token is missing
        if (storedUserId && !token) {
          await AsyncStorage.multiRemove(['@user_id', '@auth_user']);
        }
        setUserId(null);
        setHasToken(false);
      }
    };
    loadAuthData();
  }, []);

  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {

      const userData = await getUserById(userId!);

      return userData;
    },
    enabled: !!userId && hasToken, // Only fetch if userId exists AND we have a valid token
    staleTime: 10 * 60 * 1000, // 10 minutes - user data doesn't change often
  });
};
