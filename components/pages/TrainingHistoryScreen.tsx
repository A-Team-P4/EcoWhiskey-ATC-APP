import React, { useCallback, useMemo } from 'react';
import {
    ActivityIndicator,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import { Spacer } from '@/components/atoms/Spacer';
import { Typography } from '@/components/atoms/Typography';
import ResponsiveLayout from '@/components/templates/ResponsiveLayout';
import { TrainingSession } from '@/interfaces/training';
import { useTrainingContextHistory } from '@/query_hooks/useTrainingContext';
import { useCurrentUser } from '@/query_hooks/useUserProfile';
import { SCENARIOS } from '@/utils/dropDowns';
import { useRouter } from 'expo-router';

const UNKNOWN_VALUE = 'No disponible';

const OBJECTIVE_LABEL_MAP = SCENARIOS.reduce<Record<string, string>>((acc, { value, label }) => {
  acc[value] = label;
  return acc;
}, {});

const formatDateTime = (isoDate?: string) => {
  if (!isoDate) return UNKNOWN_VALUE;

  try {
    const date = new Date(isoDate);
    return date.toLocaleString();
  } catch {
    return UNKNOWN_VALUE;
  }
};

const formatObjectives = (objectives: string[] = []) => {
  if (!objectives.length) return 'Sin objetivos registrados';
  return objectives
    .map((objective) => OBJECTIVE_LABEL_MAP[objective] ?? objective)
    .join(', ');
};

interface TrainingSessionCardProps {
  session: TrainingSession;
  onContinue: (session: TrainingSession) => void;
}

const TrainingSessionCard = ({ session, onContinue }: TrainingSessionCardProps) => {
  const { context } = session;

  const objectives = useMemo(
    () => formatObjectives(context?.objectives),
    [context?.objectives]
  );

  const sessionDate = useMemo(() => formatDateTime(session.createdAt), [session.createdAt]);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Typography variant="h3" style={styles.cardTitle}>
          {sessionDate}
        </Typography>
        <Typography variant="caption" style={styles.cardTimestamp}>
          {context?.route || UNKNOWN_VALUE}
        </Typography>
      </View>

      <Spacer size={12} />

      <View style={styles.cardSection}>
        <Typography variant="caption" style={styles.sectionLabel}>
          Objetivos
        </Typography>
        <Typography variant="body">{objectives}</Typography>
      </View>

      <Spacer size={12} />

      <View style={styles.cardSection}>
        <Typography variant="caption" style={styles.sectionLabel}>
          Condiciones Meteorológicas
        </Typography>

        <View style={styles.meteoGrid}>
          <View style={styles.meteoItem}>
            <Typography variant="caption" style={styles.meteoLabel}>
              Condición
            </Typography>
            <Typography variant="body">{context?.meteo?.condition || UNKNOWN_VALUE}</Typography>
          </View>
          <View style={styles.meteoItem}>
            <Typography variant="caption" style={styles.meteoLabel}>
              Visibilidad
            </Typography>
            <Typography variant="body">{context?.meteo?.vis || UNKNOWN_VALUE}</Typography>
          </View>
          <View style={styles.meteoItem}>
            <Typography variant="caption" style={styles.meteoLabel}>
              QNH
            </Typography>
            <Typography variant="body">{context?.meteo?.qnh || UNKNOWN_VALUE}</Typography>
          </View>
          <View style={styles.meteoItem}>
            <Typography variant="caption" style={styles.meteoLabel}>
              Viento
            </Typography>
            <Typography variant="body">
              {context?.meteo?.wind ||
                (context?.meteo
                  ? `${context?.meteo?.windDirection ?? '--'}/${context?.meteo?.windSpeed ?? '--'}`
                  : UNKNOWN_VALUE)}
            </Typography>
          </View>
        </View>
      </View>

      <Spacer size={16} />

      <TouchableOpacity style={styles.continueButton} onPress={() => onContinue(session)}>
        <Typography variant="body" style={styles.continueButtonText}>
          Continuar sesión
        </Typography>
      </TouchableOpacity>
    </View>
  );
};

export default function TrainingHistoryScreen() {
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const userId = currentUser?.id;

  const router = useRouter();

  const {
    data: history = [],
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useTrainingContextHistory(userId);

  const handleRefresh = useCallback(() => {
    if (userId) {
      refetch();
    }
  }, [refetch, userId]);

  const handleContinueSession = useCallback(
    (session: TrainingSession) => {
      router.push({
        pathname: '/atc-practice',
        params: { sessionId: session.trainingSessionId },
      });
    },
    [router],
  );

  const isBusy = isLoading || isUserLoading;

  return (
    <ResponsiveLayout showTopNav={true}>
      <ScrollView
        style={{ flex: 1, backgroundColor: '#fff' }}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={Boolean(isRefetching && !isBusy)} onRefresh={handleRefresh} />
        }
      >
        <Typography variant="h1" style={styles.title}>
          Historial de Entrenamientos
        </Typography>

        <Spacer size={12} />

        <Typography variant="caption" style={styles.subtitle}>
          Consulta las configuraciones guardadas de tus sesiones de práctica.
        </Typography>

        <Spacer size={24} />

        {isBusy && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" />
            <Spacer size={12} />
            <Typography variant="body">Cargando historial...</Typography>
          </View>
        )}

        {!isBusy && error && (
          <View style={styles.centerContent}>
            <Typography variant="body" style={styles.errorText}>
              No pudimos cargar tu historial. Desliza hacia abajo para reintentar.
            </Typography>
          </View>
        )}

        {!isBusy && !error && history.length === 0 && (
          <View style={styles.centerContent}>
            <Typography variant="body">
              Aún no has generado configuraciones de entrenamiento.
            </Typography>
          </View>
        )}

        {!isBusy && !error && history.length > 0 && (
          <View style={styles.list}>
            {history.map((session) => (
              <React.Fragment key={session.trainingSessionId ?? session.createdAt}>
                <TrainingSessionCard session={session} onContinue={handleContinueSession} />
                <Spacer size={16} />
              </React.Fragment>
            ))}
          </View>
        )}
      </ScrollView>
    </ResponsiveLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    opacity: 0.7,
  },
  list: {
    gap: 16,
  },
  card: {
    backgroundColor: '#f8f8f9',
    borderRadius: 12,
    padding: 16,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
    }),
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardTimestamp: {
    opacity: 0.6,
  },
  cardSection: {
    gap: 4,
  },
  sectionLabel: {
    textTransform: 'uppercase',
    fontWeight: '600',
    opacity: 0.6,
    letterSpacing: 0.6,
  },
  meteoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  meteoItem: {
    width: '48%',
  },
  meteoLabel: {
    fontWeight: '600',
    opacity: 0.6,
  },
  continueButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    color: '#d9534f',
    textAlign: 'center',
  },
});
