import { useRegistration } from '@/app/hooks/useRegistration';
import { RegistrationData } from '@/app/interfaces/user';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { RegistrationForm } from '../organisms/RegistrationForm';
import { WelcomeSection } from '../organisms/WelcomeSection';
import ResponsiveLayout from '../templates/ResponsiveLayout';


export default function RegisterScreen() {
  const router = useRouter();
  const registrationMutation = useRegistration();

  const handleRegistration = async (data: RegistrationData) => {
    return new Promise<void>((resolve, reject) => {
      registrationMutation.mutate(data, {
        onSuccess: () => {
          resolve();
          handleRegistrationSuccess();
        },
        onError: (error: any) => {
          reject(error);
          handleRegistrationError(error?.response?.data?.message || 'Ocurrió un error durante el registro');
        }
      });
    });
  };

 const handleRegistrationSuccess = () => {
  Alert.alert(
    'Registro exitoso',
    'Tu cuenta ha sido creada correctamente',
    [
      { 
        text: 'OK', 
        onPress: () => router.replace('/login') 
      }
    ]
  );
};

  const handleRegistrationError = (errorMessage: string) => {
    Alert.alert('Error', errorMessage);
  };

  const handleReturnToLogin = () => {
    router.replace('/(tabs)/connect');
  };

  return (
    <ResponsiveLayout>
      {/* <PaperProvider theme={appleTheme}> */}
        <SafeAreaView className="flex-1 bg-white">
          <ScrollView
            className="flex-1 bg-white"
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            <WelcomeSection/>
            <RegistrationForm
              onSubmit={handleRegistration}
              isLoading={registrationMutation.isPending}
            />
          </ScrollView>
        </SafeAreaView>
      {/* </PaperProvider> */}
    </ResponsiveLayout>
  );
}

