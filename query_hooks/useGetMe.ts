import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from 'react';
import { getUserById } from "../services/apiClient";

export const useGetUserById = (userId: number | string) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserById(userId),
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

  useEffect(() => {
    const loadUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('@user_id');
      setUserId(storedUserId);
    };
    loadUserId();
  }, []);

  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserById(userId!),
    enabled: !!userId, // Only fetch if userId exists
    staleTime: 10 * 60 * 1000, // 10 minutes - user data doesn't change often
  });
};
