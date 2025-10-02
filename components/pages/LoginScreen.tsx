import { useLogin } from '@/app/hooks/useLogin';
import { LoginCredentials } from '@/app/interfaces/user';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoginForm } from '../organisms/LoginForm';
import ResponsiveLayout from '../templates/ResponsiveLayout';



const LoginScreen: React.FC = () => {
  const router = useRouter();
  const loginMutation = useLogin();
  const [serverError, setServerError] = useState<string | null>(null);

  const handleLogin = async (credentials: LoginCredentials) => {
    return new Promise<void>((resolve, reject) => {
      loginMutation.mutate(credentials, {
        onSuccess: () => {
          setServerError(null);
          resolve();
          router.replace('/(tabs)/ATCTrainingTab');
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

