
import { LoginCredentials } from '@/interfaces/user';
import { notifyAuthTokenChange } from '@/lib/authTokenEvents';
import { useLogin } from '@/query_hooks/useLogin';
import { getCurrentUser } from '@/services/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoginForm } from '../organisms/LoginForm';
import ResponsiveLayout from '../templates/ResponsiveLayout';



const LoginScreen: React.FC = () => {
  const router = useRouter();
  const loginMutation = useLogin();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isCheckingStoredSession, setIsCheckingStoredSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const restoreSessionFromStorage = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem('@auth_token'),
          AsyncStorage.getItem('@auth_user'),
        ]);

        if (!storedToken || !storedUser) {
          if (isMounted) {
            setIsCheckingStoredSession(false);
          }
          return;
        }

        try {
          const currentUser = await getCurrentUser();
          if (!isMounted) {
            return;
          }

          const nextRoute =
            currentUser.accountType === 'instructor'
              ? '/instructor-dashboard'
              : '/(tabs)/ATCTrainingTab';
          router.replace(nextRoute);
          setIsCheckingStoredSession(false);
        } catch (validationError) {
          
          try {
            await AsyncStorage.multiRemove(['@auth_token', '@user_id', '@auth_user']);
            notifyAuthTokenChange(false);
          } catch (cleanupError) {
          
          } finally {
            if (isMounted) {
              setIsCheckingStoredSession(false);
            }
          }
        }
      } catch (error) {
       
        if (isMounted) {
          setIsCheckingStoredSession(false);
        }
      }
    };

    restoreSessionFromStorage();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogin = async (credentials: LoginCredentials) => {
    return new Promise<void>((resolve, reject) => {
      loginMutation.mutate(credentials, {
        onSuccess: (data) => {
         
          setServerError(null);
          resolve();
          const nextRoute =
            data.accountType === "instructor"
              ? '/instructor-dashboard'
              : '/(tabs)/ATCTrainingTab';
          router.replace(nextRoute);
        },
        onError: (error: any) => {
          const statusCode = error?.response?.status;
          const backendMessage = error?.response?.data?.message;

          const message =
            statusCode === 401
              ? backendMessage ?? 'Credenciales incorrectas. Verifica tu correo y contrasena.'
              : backendMessage ?? 'No se pudo iniciar sesion. Verifica tus credenciales.';
          setServerError(message);
          reject(error);
        },
      });
    });
  };

  if (isCheckingStoredSession) {
    return (
      <ResponsiveLayout>
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-1 items-center justify-center bg-white">
            <ActivityIndicator size="large" color="#2196F3" />
          </View>
        </SafeAreaView>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout>
      <SafeAreaView className="flex-1 bg-white">
        <ScrollView
          className="flex-1 bg-white"
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 48, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <LoginForm
            onSubmit={handleLogin}
            isLoading={loginMutation.isPending}
            serverError={serverError}
          />
        </ScrollView>
      </SafeAreaView>
    </ResponsiveLayout>
  );
};

export default LoginScreen;

