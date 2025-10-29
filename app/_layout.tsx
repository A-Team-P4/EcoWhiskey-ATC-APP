import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Foundation from '@expo/vector-icons/Foundation';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MD3DarkTheme, MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';
import '../global.css';
import { queryClient } from '../lib/queryClient';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Icon } from '@/components/atoms/Icon';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
    ...MaterialIcons.font,
    ...MaterialCommunityIcons.font,
    ...FontAwesome5.font,
    ...Foundation.font,
  });

  useEffect(() => {
    if (fontError) {
      console.warn('Failed to load icon fonts:', fontError);
    }
  }, [fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const colorScheme = useColorScheme();
  const paperTheme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;
  const navTheme = colorScheme === 'dark' ? NavigationDarkTheme : NavigationDefaultTheme;
  const paperSettings = useMemo(
    () => ({
      icon: ({ name, color, size }: { name: string; color?: string; size: number }) => (
        <Icon
          type="MaterialCommunityIcons"
          name={name}
          size={size}
          color={color}
        />
      ),
    }),
    []
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={paperTheme} settings={paperSettings}>
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
