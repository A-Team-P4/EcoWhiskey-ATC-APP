import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet } from 'react-native';

import { useRegistration } from '@/app/hooks/useRegistration';
import { RegistrationData } from '@/app/interfaces/user';
import { AppHeader } from '../organisms/AppHeader';
import { RegistrationForm } from '../organisms/RegistrationForm';
import { WelcomeSection } from '../organisms/WelcomeSection';
import ResponsiveLayout from '../templates/ResponsiveLayout';

// const appleTheme = {
//   ...MD3LightTheme,
//   colors: {
//     ...MD3LightTheme.colors,
//     primary: '#007AFF',
//     onPrimary: '#FFFFFF',
//     primaryContainer: '#E3F2FD',
//     onPrimaryContainer: '#007AFF',
//     secondary: '#8E8E93',
//     surface: '#FFFFFF',
//     onSurface: '#1C1C1E',
//     background: '#F2F2F7',
//     onBackground: '#1C1C1E',
//     error: '#FF3B30',
//     outline: '#E5E5EA',
//   },
//   roundness: 12,
// };



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
      [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
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
        <SafeAreaView style={styles.safeArea}>
          <AppHeader
            title="Crear cuenta"
            showBackButton
            onBackPress={handleReturnToLogin}
          />
          
          <ScrollView 
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >

          <WelcomeSection
            title="Únete a nuestra plataforma"
            subtitle="Crea tu cuenta para comenzar tu experiencia educativa"
          />

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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});