import { RegistrationData } from '@/interfaces/user';
import { useRegistration } from '@/query_hooks/useRegistration';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { RegistrationForm } from '../organisms/RegistrationForm';
import { WelcomeSection } from '../organisms/WelcomeSection';
import ResponsiveLayout from '../templates/ResponsiveLayout';
import { AppSnackbar } from '@/components/molecules/AppSnackbar';
import { useSnackbar } from '@/hooks/useSnackbar';


export default function RegisterScreen() {
  const router = useRouter();
  const registrationMutation = useRegistration();
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

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
  showSnackbar('Tu cuenta ha sido creada correctamente', 'success');
  setTimeout(() => {
    router.replace('/login');
  }, 1500);
};

  const handleRegistrationError = (errorMessage: string) => {
    showSnackbar(errorMessage, 'error');
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

