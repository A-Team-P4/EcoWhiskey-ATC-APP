import { Platform, useColorScheme as useNativeColorScheme } from 'react-native';

type ColorScheme = 'light' | 'dark';

export function useColorScheme(): ColorScheme {
  const scheme = useNativeColorScheme();

  if (Platform.OS === 'web') {
    return 'light';
  }

  return (scheme ?? 'light') as ColorScheme;
}
