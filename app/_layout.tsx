import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MD3DarkTheme, MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';
import '../global.css';
import { queryClient } from '../lib/queryClient';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const paperTheme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;
  const navTheme = colorScheme === 'dark' ? NavigationDarkTheme : NavigationDefaultTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={paperTheme}>
        <QueryClientProvider client={queryClient}>
          <ProtectedRoute>
            <Stack>
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="register" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="atc-practice" options={{ headerShown: false, animation: "fade" }} />
            </Stack>
          </ProtectedRoute>
          <StatusBar style="auto" />
        </QueryClientProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
