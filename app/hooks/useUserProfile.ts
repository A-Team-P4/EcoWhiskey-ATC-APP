import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import {
  changeUserPassword,
  getCurrentUser,
  getSchoolById,
  getSchools,
  getUserById,
  updateUserProfile,
  updateUserSchool,
} from '../services/apiClient';
import {
  ChangePasswordPayload,
  SchoolsResponse,
  SuccessResponse,
  UpdateUserPayload,
  UpdateUserSchoolPayload,
  User,
} from '../interfaces/user';

const USER_STORAGE_KEY = '@auth_user';

export const CURRENT_USER_QUERY_KEY = ['user', 'me'] as const;
export const USER_QUERY_KEY = (userId: string) => ['user', userId] as const;
export const SCHOOLS_QUERY_KEY = ['schools'] as const;
export const SCHOOL_QUERY_KEY = (schoolId: string) => ['schools', schoolId] as const;

const persistUser = async (user: User) => {
  try {
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.warn('Failed to persist user profile', error);
  }
};

interface HydrateFromStorageConfig {
  queryClient: ReturnType<typeof useQueryClient>;
}

const useHydrateCurrentUserFromStorage = ({ queryClient }: HydrateFromStorageConfig) => {
  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (!storedValue) return;

        const parsedUser: User = JSON.parse(storedValue);
        if (isMounted) {
          queryClient.setQueryData(CURRENT_USER_QUERY_KEY, parsedUser);
          queryClient.setQueryData(USER_QUERY_KEY(parsedUser.id), parsedUser);
        }
      } catch (error) {
        console.warn('Failed to hydrate user profile from storage', error);
      }
    };

    hydrate();

    return () => {
      isMounted = false;
    };
  }, [queryClient]);
};

export const useCurrentUser = () => {
  const queryClient = useQueryClient();
  useHydrateCurrentUserFromStorage({ queryClient });

  return useQuery<User>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: async () => {
      const user = await getCurrentUser();
      await persistUser(user);
      return user;
    },
  });
};

export const useUserById = (userId?: string) =>
  useQuery<User>({
    queryKey: userId ? USER_QUERY_KEY(userId) : ['user', 'detail'],
    queryFn: () => getUserById(userId as string),
    enabled: Boolean(userId),
  });

export const useSchools = () =>
  useQuery<SchoolsResponse>({
    queryKey: SCHOOLS_QUERY_KEY,
    queryFn: getSchools,
  });

export const useSchoolById = (schoolId?: string) =>
  useQuery<SchoolsResponse[number]>({
    queryKey: schoolId ? SCHOOL_QUERY_KEY(schoolId) : ['schools', 'detail'],
    queryFn: () => getSchoolById(schoolId as string),
    enabled: Boolean(schoolId),
  });

interface UpdateUserVariables {
  userId: string;
  payload: UpdateUserPayload;
}

interface UpdateUserSchoolVariables {
  userId: string;
  payload: UpdateUserSchoolPayload;
}

interface ChangePasswordVariables {
  userId: string;
  payload: ChangePasswordPayload;
}

const useUserCacheUpdater = () => {
  const queryClient = useQueryClient();

  return async (user: User) => {
    queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
    queryClient.setQueryData(USER_QUERY_KEY(user.id), user);
    await persistUser(user);
  };
};

export const useUpdateUserProfile = () => {
  const updateCache = useUserCacheUpdater();

  return useMutation<User, unknown, UpdateUserVariables>({
    mutationFn: ({ userId, payload }) => updateUserProfile(userId, payload),
    onSuccess: async (updatedUser) => {
      await updateCache(updatedUser);
    },
  });
};

export const useUpdateUserSchool = () => {
  const updateCache = useUserCacheUpdater();

  return useMutation<User, unknown, UpdateUserSchoolVariables>({
    mutationFn: ({ userId, payload }) => updateUserSchool(userId, payload),
    onSuccess: async (updatedUser) => {
      await updateCache(updatedUser);
    },
  });
};

export const useChangeUserPassword = () =>
  useMutation<SuccessResponse, unknown, ChangePasswordVariables>({
    mutationFn: ({ userId, payload }) => changeUserPassword(userId, payload),
  });
