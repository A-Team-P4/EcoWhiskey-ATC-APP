import { subscribeToAuthTokenChanges } from '@/lib/authTokenEvents';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import {
  ChangePasswordPayload,
  SchoolCreateRequest,
  SchoolResponse,
  SchoolUpdateRequest,
  SchoolsResponse,
  SuccessResponse,
  UpdateUserPayload,
  UpdateUserSchoolPayload,
  User,
} from '../interfaces/user';
import {
  changeUserPassword,
  createSchool,
  deleteSchool,
  getCurrentUser,
  getSchoolById,
  getSchools,
  getStudentsBySchool,
  getUserById,
  updateSchool,
  updateUserProfile,
  updateUserSchool,
} from '../services/apiClient';

const USER_STORAGE_KEY = '@auth_user';
const AUTH_TOKEN_STORAGE_KEY = '@auth_token';

export const CURRENT_USER_QUERY_KEY = ['user', 'me'] as const;
export const USER_QUERY_KEY = (userId: string) => ['user', userId] as const;
export const SCHOOLS_QUERY_KEY = ['schools'] as const;
export const SCHOOL_QUERY_KEY = (schoolId: string) => ['schools', schoolId] as const;
export const SCHOOL_STUDENTS_QUERY_KEY = (schoolId: string | number) =>
  ['schools', schoolId, 'students'] as const;

const persistUser = async (user: User) => {
  try {
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
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

      }
    };

    hydrate();

    return () => {
      isMounted = false;
    };
  }, [queryClient]);
};

const useHasAuthToken = () => {
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
        if (isMounted) {
          setHasToken(!!token);
        }
      } catch (error) {
  
        if (isMounted) {
          setHasToken(false);
        }
      }
    };

    checkToken();
    const unsubscribe = subscribeToAuthTokenChanges((hasTokenValue) => {
      if (isMounted) {
        setHasToken(hasTokenValue);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return hasToken === true;
};

export const useCurrentUser = () => {
  const queryClient = useQueryClient();
  useHydrateCurrentUserFromStorage({ queryClient });
  const hasAuthToken = useHasAuthToken();

  return useQuery<User>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: async () => {
      const user = await getCurrentUser();
      await persistUser(user);
      return user;
    },
    enabled: hasAuthToken,
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

export const useStudentsBySchool = (schoolId?: string | number) =>
  useQuery<User[]>({
    queryKey: schoolId ? SCHOOL_STUDENTS_QUERY_KEY(schoolId) : ['schools', 'students', 'detail'],
    queryFn: () => getStudentsBySchool(schoolId as string | number),
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

interface UpdateSchoolMutationVariables {
  schoolId: string;
  payload: SchoolUpdateRequest;
}

interface DeleteSchoolVariables {
  schoolId: string;
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

export const useCreateSchool = () => {
  const queryClient = useQueryClient();

  return useMutation<SchoolResponse, unknown, SchoolCreateRequest>({
    mutationFn: (payload) => createSchool(payload),
    onSuccess: (school) => {
      queryClient.invalidateQueries({ queryKey: SCHOOLS_QUERY_KEY });
      queryClient.setQueryData(SCHOOL_QUERY_KEY(school.id), school);
    },
  });
};

export const useUpdateSchool = () => {
  const queryClient = useQueryClient();

  return useMutation<SchoolResponse, unknown, UpdateSchoolMutationVariables>({
    mutationFn: ({ schoolId, payload }) => updateSchool(schoolId, payload),
    onSuccess: (school) => {
      queryClient.invalidateQueries({ queryKey: SCHOOLS_QUERY_KEY });
      queryClient.setQueryData(SCHOOL_QUERY_KEY(school.id), school);
    },
  });
};

export const useDeleteSchool = () => {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, unknown, DeleteSchoolVariables>({
    mutationFn: ({ schoolId }) => deleteSchool(schoolId),
    onSuccess: (_, { schoolId }) => {
      queryClient.invalidateQueries({ queryKey: SCHOOLS_QUERY_KEY });
      queryClient.removeQueries({ queryKey: SCHOOL_QUERY_KEY(schoolId) });
    },
  });
};
