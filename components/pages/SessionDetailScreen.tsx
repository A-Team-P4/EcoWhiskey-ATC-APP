import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { Icon } from '@/components/atoms/Icon';
import { Spacer } from '@/components/atoms/Spacer';
import { Typography } from '@/components/atoms/Typography';
import ResponsiveLayout from '@/components/templates/ResponsiveLayout';
import { useSessionSummary } from '@/query_hooks/useScores';
import { useCurrentUser } from '@/query_hooks/useUserProfile';
import { useLocalSearchParams, useRouter } from 'expo-router';

// Phase labels mapping
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

export default function SessionDetailScreen() {
  const router = useRouter();
  const { sessionId, userId, userName } = useLocalSearchParams<{
    sessionId: string;
    userId?: string;
    userName?: string;
  }>();
  const { data: currentUser } = useCurrentUser();
  const viewingOtherUser = Boolean(userId && userId !== currentUser?.id);
  const supervisedName = viewingOtherUser
    ? typeof userName === 'string'
      ? userName
      : 'Estudiante'
    : null;

  const { data, isLoading, error } = useSessionSummary(sessionId);

  const overallScore = data?.overall_average ?? 0;
  const scoreColor = getScoreColor(overallScore);
  const scoreLabel = getScoreLabel(overallScore);

  const sortedPhases = useMemo(() => {
    if (!data?.phases) return [];
    return [...data.phases].sort((a, b) => b.average_score - a.average_score);
  }, [data?.phases]);

  return (
    <ResponsiveLayout showTopNav={true}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Icon type="MaterialIcons" name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Typography variant="h2" style={styles.headerTitle}>
              Resumen de Sesión
            </Typography>
            <Typography variant="caption" style={styles.headerSubtitle}>
              Análisis completo de tu entrenamiento
            </Typography>
          </View>
        </View>

        {viewingOtherUser && (
          <>
            <Spacer size={12} />
            <View style={styles.viewerBanner}>
              <View>
                <Typography variant="caption" style={styles.viewerBannerLabel}>
                  Estas supervisando a
                </Typography>
                <Typography variant="h3" style={styles.viewerBannerName}>
                  {supervisedName}
                </Typography>
              </View>
            </View>
          </>
        )}

        <Spacer size={16} />

        {isLoading && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Spacer size={12} />
            <Typography variant="body">Cargando análisis de sesión...</Typography>
          </View>
        )}

        {error && (
          <View style={styles.centerContent}>
            <Icon type="MaterialIcons" name="info-outline" size={64} color="#9CA3AF" />
            <Spacer size={16} />
            <Typography variant="h3" style={styles.emptyTitle}>
              No tienes actividad aún en esta sesión
            </Typography>
            <Spacer size={8} />
            <Typography variant="body" style={styles.emptyText}>
              Completa comunicaciones en esta sesión para ver tu análisis de desempeño.
            </Typography>
          </View>
        )}

        {!isLoading && !error && data && (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Overall Score Card */}
            <View style={styles.scoreCard}>
              <View style={styles.scoreCardHeader}>
                <Typography variant="caption" style={styles.scoreCardLabel}>
                  PUNTUACIÓN GENERAL
                </Typography>
              </View>

              <View style={styles.scoreCardBody}>
                <View style={styles.scoreDisplay}>
                  <Typography variant="h1" color={scoreColor} style={styles.scoreValue}>
                    {overallScore.toFixed(1)}
                  </Typography>
                  <Typography variant="body" style={styles.scoreMax}>
                    / 100
                  </Typography>
                </View>

                <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
                  <Typography variant="caption" color="#fff" style={styles.scoreBadgeTextBase}>
                    {scoreLabel}
                  </Typography>
                </View>
              </View>

              <View style={styles.scoreCardFooter}>
                <View style={styles.scoreCardStat}>
                  <Typography variant="caption" style={styles.scoreCardStatLabel}>
                    Total evaluaciones
                  </Typography>
                  <Typography variant="body" style={styles.scoreCardStatValue}>
                    {data.total_evaluations}
                  </Typography>
                </View>
                <View style={styles.scoreCardStat}>
                  <Typography variant="caption" style={styles.scoreCardStatLabel}>
                    Fases evaluadas
                  </Typography>
                  <Typography variant="body" style={styles.scoreCardStatValue}>
                    {data.phases.length}
                  </Typography>
                </View>
              </View>
            </View>

            <Spacer size={24} />

            {/* LLM Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Icon type="MaterialIcons" name="psychology" size={24} color="#2196F3" />
                <Typography variant="h3" color="#1E40AF" style={styles.summaryTitleBase}>
                  Análisis de IA
                </Typography>
              </View>

              <Spacer size={12} />

              <Typography variant="body" color="#1F2937" style={styles.summaryText}>
                {data.summary}
              </Typography>
            </View>

            <Spacer size={24} />

            {/* Phases Performance */}
            <View style={styles.phasesSection}>
              <Typography variant="h3" style={styles.phasesTitle}>
                Desempeño por Fase
              </Typography>

              <Spacer size={12} />

              {sortedPhases.map((phase) => {
                const phaseLabel = PHASE_LABELS[phase.phase_id] || phase.phase_id;
                const phaseColor = getScoreColor(phase.average_score);
                const phaseScoreLabel = getScoreLabel(phase.average_score);

                return (
                  <View key={phase.phase_id} style={styles.phaseCard}>
                    <View style={styles.phaseCardHeader}>
                      <View style={styles.phaseCardLeft}>
                        <View style={[styles.phaseScoreBadge, { backgroundColor: phaseColor }]}>
                          <Typography variant="body" color="#fff" style={styles.phaseScoreText}>
                            {phase.average_score.toFixed(0)}
                          </Typography>
                        </View>
                        <View style={styles.phaseCardInfo}>
                          <Typography variant="body" style={styles.phaseCardTitle}>
                            {phaseLabel}
                          </Typography>
                          <Typography variant="caption" style={styles.phaseCardLabel}>
                            {phaseScoreLabel} • {phase.scores.length}{' '}
                            {phase.scores.length === 1 ? 'evaluación' : 'evaluaciones'}
                          </Typography>
                        </View>
                      </View>
                    </View>

                    {/* Phase Feedback */}
                    {phase.scores.length > 0 && (
                      <>
                        <Spacer size={12} />
                        <View style={styles.phaseFeedbackSection}>
                          <Typography variant="caption" style={styles.phaseFeedbackTitle}>
                            Retroalimentación reciente:
                          </Typography>
                          <Spacer size={6} />
                          {phase.scores.slice(-2).map((score, idx) => (
                            <View key={idx} style={styles.feedbackItem}>
                              {score.feedback && (
                                <>
                                  <View style={styles.feedbackBullet} />
                                  <Typography variant="caption" style={styles.feedbackText}>
                                    {score.feedback}
                                  </Typography>
                                </>
                              )}
                            </View>
                          ))}
                        </View>
                      </>
                    )}
                  </View>
                );
              })}
            </View>

            <Spacer size={40} />
          </ScrollView>
        )}
      </View>
    </ResponsiveLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    opacity: 0.6,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  viewerBanner: {
    backgroundColor: '#E0E7FF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewerBannerLabel: {
    fontSize: 12,
    color: '#1E3A8A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  viewerBannerName: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  scoreCard: {
    backgroundColor: '#f8f8f9',
    borderRadius: 16,
    padding: 20,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    }),
    elevation: 4,
  },
  scoreCardHeader: {
    marginBottom: 16,
  },
  scoreCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.6,
    letterSpacing: 1,
  },
  scoreCardBody: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: 'bold',
  },
  scoreMax: {
    fontSize: 24,
    opacity: 0.5,
    marginLeft: 4,
  },
  scoreBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scoreBadgeTextBase: {
    fontWeight: '600',
    fontSize: 14,
  },
  scoreCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
  },
  scoreCardStat: {
    alignItems: 'center',
  },
  scoreCardStatLabel: {
    opacity: 0.6,
    marginBottom: 4,
  },
  scoreCardStatValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryTitleBase: {
    fontSize: 18,
    fontWeight: '600',
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 24,
  },
  phasesSection: {
    marginBottom: 20,
  },
  phasesTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  phaseCard: {
    backgroundColor: '#f8f8f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  phaseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phaseCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  phaseScoreBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseScoreText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  phaseCardInfo: {
    flex: 1,
    gap: 2,
  },
  phaseCardTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  phaseCardLabel: {
    opacity: 0.6,
    fontSize: 12,
  },
  phaseFeedbackSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  phaseFeedbackTitle: {
    fontWeight: '600',
    opacity: 0.7,
    fontSize: 12,
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  feedbackBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2196F3',
    marginTop: 6,
    marginRight: 8,
  },
  feedbackText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  centerContent: {
    flex: 1,
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
