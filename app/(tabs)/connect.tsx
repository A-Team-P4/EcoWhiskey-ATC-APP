import axios from 'axios';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, TextInput } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const DEFAULT_ENDPOINT = process.env.EXPO_PUBLIC_API_URL ?? 'http://0.0.0.0:8000/health';

export default function ApiConnectionScreen() {
  const [endpoint, setEndpoint] = useState(DEFAULT_ENDPOINT);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payloadPreview, setPayloadPreview] = useState<string | null>(null);

  const theme = useColorScheme() ?? 'light';
  const palette = theme === 'light' ? Colors.light : Colors.dark;

  const handleTestConnection = async () => {
    const sanitizedUrl = endpoint.trim();
    if (!sanitizedUrl) {
      setError('Ingresa una URL valida.');
      return;
    }

    const hasProtocol = sanitizedUrl.startsWith('http://') || sanitizedUrl.startsWith('https://');
    const targetUrl = hasProtocol ? sanitizedUrl : 'http://' + sanitizedUrl;

    setIsLoading(true);
    setError(null);
    setStatus(null);
    setPayloadPreview(null);

    try {
      console.log('sanitizedUrl------------------------------------', targetUrl);
      const response = await axios.get<string>(targetUrl, {
        responseType: 'text',
        transformResponse: [(data) => data],
        timeout: 10000,
        headers: {
          Accept: 'application/json,text/plain,*/*',
        },
      });

      const contentType = response.headers['content-type'] ?? '';
      const statusLabel = [response.status, response.statusText].filter(Boolean).join(' ');

      let bodyText = response.data;
      if (contentType.includes('application/json')) {
        try {
          bodyText = JSON.stringify(JSON.parse(bodyText), null, 2);
        } catch (parseError) {
          // keep raw body if JSON.parse fails
        }
      }

      if (response.status >= 400) {
        setError('La API respondio con un codigo de error.');
      }

      setStatus(statusLabel || `${response.status}`);
      setPayloadPreview(bodyText);
    } catch (caughtError) {
      if (axios.isAxiosError(caughtError)) {
        if (caughtError.response) {
          const statusLabel = [
            caughtError.response.status,
            caughtError.response.statusText,
          ].filter(Boolean).join(' ');

          setStatus(statusLabel || `${caughtError.response.status}`);
          setError('La API respondio con un codigo de error.');

          const responseData = caughtError.response.data;
          setPayloadPreview(
            typeof responseData === 'string'
              ? responseData
              : JSON.stringify(responseData, null, 2)
          );
        } else if (caughtError.request) {
          setError('No se pudo contactar la API. Verifica la URL o tu red.');
        } else {
          setError(caughtError.message);
        }
      } else if (caughtError instanceof Error) {
        setError(caughtError.message);
      } else {
        setError('Error inesperado.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#c8e6ff', dark: '#0f172a' }}
      headerImage={
        <IconSymbol
          name="antenna.radiowaves.left.and.right"
          size={280}
          color={theme === 'light' ? '#0f172a' : '#38bdf8'}
          style={styles.headerIcon}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Conexion API</ThemedText>
        <ThemedText>
          Proba rapido la comunicacion con tu backend. Cambia la URL y presiona el boton para ver la
          respuesta.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold">Endpoint</ThemedText>
        <TextInput
          value={endpoint}
          onChangeText={setEndpoint}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="https://api.midominio.com/recurso"
          placeholderTextColor={theme === 'light' ? '#64748b' : '#94a3b8'}
          style={[
            styles.input,
            {
              borderColor: theme === 'light' ? '#e2e8f0' : '#1e293b',
              color: palette.text,
              backgroundColor: theme === 'light' ? '#ffffff' : '#0f172a',
            },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          onPress={handleTestConnection}
          disabled={isLoading}
          style={[
            styles.button,
            {
              backgroundColor: palette.tint,
              opacity: isLoading ? 0.75 : 1,
            },
          ]}>
          <ThemedText type="defaultSemiBold" style={styles.buttonLabel}>
            {isLoading ? 'Probando...' : 'Probar conexion'}
          </ThemedText>
        </Pressable>
        {isLoading && <ActivityIndicator color={palette.tint} />}
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold">Resultado</ThemedText>
        {status && (
          <ThemedText style={styles.status}>Estado: {status}</ThemedText>
        )}
        {error && (
          <ThemedText style={styles.error}>
            {error}
          </ThemedText>
        )}
        {!payloadPreview && !error && !isLoading && (
          <ThemedText>
            Aun no hay respuesta. Configura un endpoint y toca "Probar conexion" para ver los datos.
          </ThemedText>
        )}
        {payloadPreview && (
          <ThemedView
            style={[
              styles.responseContainer,
              {
                backgroundColor: theme === 'light' ? 'rgba(241, 245, 249, 0.8)' : 'rgba(15, 23, 42, 0.4)',
                borderColor: theme === 'light' ? 'rgba(148, 163, 184, 0.4)' : 'rgba(148, 163, 184, 0.3)',
              },
            ]}>
            <ThemedText style={styles.codeBlock}>{payloadPreview}</ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerIcon: {
    position: 'absolute',
    bottom: -40,
    left: 24,
  },
  titleContainer: {
    gap: 12,
  },
  card: {
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonLabel: {
    color: '#ffffff',
  },
  status: {
    fontSize: 14,
    opacity: 0.9,
  },
  error: {
    color: '#ef4444',
  },
  responseContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  codeBlock: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 14,
    lineHeight: 20,
  },
});


