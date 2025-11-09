import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { Icon } from '@/components/atoms/Icon';
import { Spacer } from '@/components/atoms/Spacer';
import { Typography } from '@/components/atoms/Typography';
import ResponsiveLayout from '@/components/templates/ResponsiveLayout';
import { usePhaseScores } from '@/query_hooks/useScores';
import { useTrainingContextHistory } from '@/query_hooks/useTrainingContext';
import { useCurrentUser } from '@/query_hooks/useUserProfile';
import { useRouter } from 'expo-router';

// Phase labels mapping based on the database phase_id values
const PHASE_LABELS: Record<string, string> = {
  ground_departure_request: 'Solicitud de salida (Ground)',
  frequency_usage_error: 'Uso de frecuencia',
  ground_readback: 'Lectura (Ground)',
  tower_hold_short: 'Hold Short (Tower)',
  tower_line_up: 'Line Up (Tower)',
  tower_takeoff_clearance: 'Autorización de despegue',
  tower_initial_climb: 'Ascenso inicial',
  approach_contact: 'Contacto con Approach',
  approach_readback: 'Lectura (Approach)',
  approach_zone_entry: 'Entrada a zona',
  radio_check_in: 'Check-in por radio',
  radio_position_reporting: 'Reporte de posición',
  radio_exit_zone: 'Salida de zona',
  approach_return_contact: 'Regreso a contacto (Approach)',
};

const PHASE_IDS = Object.keys(PHASE_LABELS);

const formatDateTime = (isoDate?: string) => {
  if (!isoDate) return 'No disponible';

  try {
    const date = new Date(isoDate);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'No disponible';
  }
};

const getScoreColor = (score: number) => {
  if (score >= 90) return '#10B981'; // Green
  if (score >= 75) return '#3B82F6'; // Blue
  if (score >= 60) return '#F59E0B'; // Orange
  return '#EF4444'; // Red
};

const getScoreLabel = (score: number) => {
  if (score >= 90) return 'Excelente';
  if (score >= 75) return 'Bueno';
  if (score >= 60) return 'Regular';
  return 'Necesita mejorar';
};

interface PhaseCardProps {
  phaseId: string;
  phaseLabel: string;
  onPress: (phaseId: string) => void;
}

const PhaseCard = ({ phaseId, phaseLabel, onPress }: PhaseCardProps) => {
  const { data: phaseData, isLoading } = usePhaseScores(phaseId);

  const averageScore = phaseData?.average_score ?? 0;
  const scoreColor = getScoreColor(averageScore);
  const scoreLabel = getScoreLabel(averageScore);

  return (
    <TouchableOpacity
      style={styles.phaseCard}
      onPress={() => onPress(phaseId)}
      activeOpacity={0.7}
    >
      <View style={styles.phaseCardHeader}>
        <Typography variant="h3" style={styles.phaseCardTitle}>
          {phaseLabel}
        </Typography>
        {isLoading ? (
          <ActivityIndicator size="small" color="#2196F3" />
        ) : (
          <View style={styles.scoreContainer}>
            <Typography
              variant="h2"
              style={[styles.scoreText, { color: scoreColor }]}
            >
              {averageScore > 0 ? averageScore.toFixed(1) : '--'}
            </Typography>
            <Typography variant="caption" style={styles.scoreMaxText}>
              / 100
            </Typography>
          </View>
        )}
      </View>

      {!isLoading && phaseData && (
        <>
          <Spacer size={8} />
          <View style={styles.phaseCardFooter}>
            <Typography variant="caption" style={{ color: scoreColor, fontWeight: '600' }}>
              {scoreLabel}
            </Typography>
            <Typography variant="caption" style={styles.attemptCount}>
              {phaseData.total_scores} {phaseData.total_scores === 1 ? 'intento' : 'intentos'}
            </Typography>
          </View>
        </>
      )}
    </TouchableOpacity>
  );
};

interface SessionCardProps {
  session: any;
  onPress: (sessionId: string) => void;
}

const SessionCard = ({ session, onPress }: SessionCardProps) => {
  const sessionDate = useMemo(() => formatDateTime(session.createdAt), [session.createdAt]);

  return (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={() => onPress(session.trainingSessionId)}
      activeOpacity={0.7}
    >
      <View style={styles.sessionCardHeader}>
        <Typography variant="body" style={styles.sessionCardTitle}>
          {sessionDate}
        </Typography>
        <Typography variant="caption" style={styles.sessionCardRoute}>
          {session.context?.route || 'Ruta no disponible'}
        </Typography>
      </View>
    </TouchableOpacity>
  );
};

export default function ScoresScreen() {
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const userId = currentUser?.id;
  const router = useRouter();

  const [viewMode, setViewMode] = useState<'categories' | 'sessions'>('categories');

  const {
    data: history = [],
    isLoading: isHistoryLoading,
    isRefetching,
    refetch,
  } = useTrainingContextHistory(userId);

  const handleRefresh = useCallback(() => {
    if (userId) {
      refetch();
    }
  }, [refetch, userId]);

  const handlePhasePress = useCallback(
    (phaseId: string) => { router.push({ pathname: '/phase-detail', params: { phaseId, phaseLabel: PHASE_LABELS[phaseId] }, });
    },
    [router],
  );

  const handleSessionPress = useCallback(
    (sessionId: string) => { router.push({ pathname: '/session-detail',  params: { sessionId }, }); }, [router],
  );

  const isBusy = isUserLoading || isHistoryLoading;

  return (
    <ResponsiveLayout showTopNav={true}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={Boolean(isRefetching && !isBusy)} onRefresh={handleRefresh} />
        }
      >
        <Typography variant="h1" style={styles.title}>
          Calificaciones
        </Typography>

        <Spacer size={12} />

        <Typography variant="caption" style={styles.subtitle}>
          Consulta tu desempeño en cada categoría de comunicación ATC.
        </Typography>

        <Spacer size={24} />

        {/* Toggle View Mode */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'categories' && styles.toggleButtonActive,
            ]}
            onPress={() => setViewMode('categories')}
            activeOpacity={0.7}
          >
            <Typography
              variant="body"
              style={[ styles.toggleButtonText, viewMode === 'categories' && styles.toggleButtonTextActive, ]}
            >
              Fases de vuelo
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'sessions' && styles.toggleButtonActive,
            ]}
            onPress={() => setViewMode('sessions')}
            activeOpacity={0.7}
          >
            <Typography
              variant="body"
              style={[
                styles.toggleButtonText,
                viewMode === 'sessions' && styles.toggleButtonTextActive,
              ]}
            >
              Sesiones
            </Typography>
          </TouchableOpacity>
        </View>

        <Spacer size={24} />

        {isBusy && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" />
            <Spacer size={12} />
            <Typography variant="body">Cargando calificaciones...</Typography>
          </View>
        )}

        {/* Categories View */}
        {!isBusy && viewMode === 'categories' && (
          <View style={styles.grid}>
            {PHASE_IDS.map((phaseId) => (
              <PhaseCard
                key={phaseId}
                phaseId={phaseId}
                phaseLabel={PHASE_LABELS[phaseId]}
                onPress={handlePhasePress}
              />
            ))}
          </View>
        )}

        {/* Sessions View */}
        {!isBusy && viewMode === 'sessions' && (
          <>
            {history.length === 0 ? (
              <View style={styles.centerContent}>
                <Icon type="MaterialIcons" name="assignment-outlined" size={64} color="#9CA3AF" />
                <Spacer size={16} />
                <Typography variant="h3" style={styles.emptyTitle}>
                  No tienes sesiones de entrenamiento
                </Typography>
                <Spacer size={8} />
                <Typography variant="body" style={styles.emptyText}>
                  Completa tu primera sesión de práctica ATC para ver tus calificaciones aquí.
                </Typography>
              </View>
            ) : (
              <View style={styles.list}>
                {history.map((session) => (
                  <React.Fragment key={session.trainingSessionId ?? session.createdAt}>
                    <SessionCard session={session} onPress={handleSessionPress} />
                    <Spacer size={12} />
                  </React.Fragment>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ResponsiveLayout>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
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
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#2196F3',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  grid: {
    gap: 16,
  },
  list: {
    gap: 12,
  },
  phaseCard: {
    backgroundColor: '#f8f8f9',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  phaseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phaseCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  scoreMaxText: {
    fontSize: 14,
    opacity: 0.5,
    marginLeft: 2,
  },
  phaseCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attemptCount: {
    opacity: 0.6,
  },
  sessionCard: {
    backgroundColor: '#f8f8f9',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionCardTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  sessionCardRoute: {
    opacity: 0.6,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 22,
  },
});
