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
import { usePhaseSummary } from '@/query_hooks/useScores';
import { useLocalSearchParams, useRouter } from 'expo-router';

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

export default function PhaseDetailScreen() {
  const router = useRouter();
  const { phaseId, phaseLabel } = useLocalSearchParams<{
    phaseId: string;
    phaseLabel: string;
  }>();

  const { data, isLoading, error } = usePhaseSummary(phaseId);

  const averageScore = data?.average_score ?? 0;
  const scoreColor = getScoreColor(averageScore);
  const scoreLabel = getScoreLabel(averageScore);

  const sortedScores = useMemo(() => {
    if (!data?.scores) return [];
    return [...data.scores].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [data?.scores]);

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
              {phaseLabel}
            </Typography>
            <Typography variant="caption" style={styles.headerSubtitle}>
              Análisis detallado de desempeño
            </Typography>
          </View>
        </View>

        <Spacer size={16} />

        {isLoading && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Spacer size={12} />
            <Typography variant="body">Cargando análisis...</Typography>
          </View>
        )}

        {error && (
          <View style={styles.centerContent}>
            <Icon type="MaterialIcons" name="info-outline" size={64} color="#9CA3AF" />
            <Spacer size={16} />
            <Typography variant="h3" style={styles.emptyTitle}>
              No tienes actividad en esta fase
            </Typography>
            <Spacer size={8} />
            <Typography variant="body" style={styles.emptyText}>
              Completa comunicaciones en esta fase para ver tu análisis de desempeño.
            </Typography>
          </View>
        )}

        {!isLoading && !error && data && (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Score Overview Card */}
            <View style={styles.scoreCard}>
              <View style={styles.scoreCardHeader}>
                <Typography variant="caption" style={styles.scoreCardLabel}>
                  PUNTUACIÓN PROMEDIO
                </Typography>
              </View>

              <View style={styles.scoreCardBody}>
                <View style={styles.scoreDisplay}>
                  <Typography variant="h1" color={scoreColor} style={styles.scoreValue}>
                    {averageScore.toFixed(1)}
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
                    {data.total_scores}
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

            {/* Score History */}
            <View style={styles.historySection}>
              <Typography variant="h3" style={styles.historyTitle}>
                Historial de Evaluaciones
              </Typography>

              <Spacer size={12} />

              {sortedScores.map((score, index) => (
                <View key={score.id} style={styles.historyCard}>
                  <View style={styles.historyCardHeader}>
                    <View style={styles.historyCardLeft}>
                      <View style={[styles.historyScoreBadge, { backgroundColor: getScoreColor(score.score) }]}>
                        <Typography variant="body" color="#fff" style={styles.historyScoreText}>
                          {score.score}
                        </Typography>
                      </View>
                      <View style={styles.historyCardInfo}>
                        <Typography variant="caption" style={styles.historyCardDate}>
                          {formatDateTime(score.created_at)}
                        </Typography>
                        <Typography variant="caption" style={styles.historyCardLabel}>
                          {getScoreLabel(score.score)}
                        </Typography>
                      </View>
                    </View>
                  </View>

                  {score.feedback && (
                    <>
                      <Spacer size={8} />
                      <View style={styles.feedbackContainer}>
                        <Typography variant="caption" style={styles.feedbackLabel}>
                          Retroalimentación:
                        </Typography>
                        <Typography variant="body" style={styles.feedbackText}>
                          {score.feedback}
                        </Typography>
                      </View>
                    </>
                  )}

                  {index < sortedScores.length - 1 && <Spacer size={12} />}
                </View>
              ))}
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
  historySection: {
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  historyCard: {
    backgroundColor: '#f8f8f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyScoreBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyScoreText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  historyCardInfo: {
    gap: 2,
  },
  historyCardDate: {
    fontSize: 13,
    fontWeight: '600',
  },
  historyCardLabel: {
    opacity: 0.6,
    fontSize: 12,
  },
  feedbackContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  feedbackLabel: {
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.7,
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 20,
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
