import { AppSnackbar } from '@/components/molecules/AppSnackbar';
import { useSnackbar } from '@/hooks/useSnackbar';
import { RegistrationData } from '@/interfaces/user';
import { useRegistration } from '@/query_hooks/useRegistration';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { RegistrationForm } from '../organisms/RegistrationForm';
import { WelcomeSection } from '../organisms/WelcomeSection';
import ResponsiveLayout from '../templates/ResponsiveLayout';


export default function RegisterScreen() {
  const router = useRouter();
  const registrationMutation = useRegistration();
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

  const handleRegistration = async (data: RegistrationData) => {
    try {
      await registrationMutation.mutateAsync(data);
      handleRegistrationSuccess();
    } catch (error: any) {
      const status = error?.response?.status;
      const backendMessage = error?.response?.data?.message || error?.response?.data?.detail;

      if (status === 409) {
        handleRegistrationError(
          backendMessage ||
            'Error al registrar usuario.'
        );
        return;
      }

      handleRegistrationError(backendMessage || 'Ocurrió un error durante el registro');
    }
  };

 const handleRegistrationSuccess = () => {
  showSnackbar('Tu cuenta ha sido creada correctamente', 'success');
  setTimeout(() => {
    router.replace('/login');
  }, 1500);
};

  const handleRegistrationError = (errorMessage: string) => {
    showSnackbar(errorMessage, 'error');
  };

  const handleReturnToLogin = () => {
    router.replace('/(tabs)/connect' as any);
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

          {/* Snackbar */}
          <AppSnackbar
            visible={snackbar.visible}
            message={snackbar.message}
            type={snackbar.type}
            onDismiss={hideSnackbar}
          />
        </SafeAreaView>
      {/* </PaperProvider> */}
    </ResponsiveLayout>
  );
}


