import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { Icon } from '@/components/atoms/Icon';
import { Spacer } from '@/components/atoms/Spacer';
import { Typography } from '@/components/atoms/Typography';
import { AppSnackbar } from '@/components/molecules/AppSnackbar';
import ResponsiveLayout from '@/components/templates/ResponsiveLayout';
import { useSnackbar } from '@/hooks/useSnackbar';
import { useAllPhasesScores } from '@/query_hooks/useScores';
import { useDeleteTrainingSession, useTrainingContextHistory } from '@/query_hooks/useTrainingContext';
import { useCurrentUser } from '@/query_hooks/useUserProfile';
import { getLastControllerTurn } from '@/services/apiClient';
import { SCENARIOS } from '@/utils/dropDowns';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

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
  averageScore: number;
  totalScores: number;
  isLoading: boolean;
}

const PhaseCard = ({ phaseId, phaseLabel, onPress, averageScore, totalScores, isLoading }: PhaseCardProps) => {
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

      {!isLoading && totalScores > 0 && (
        <>
          <Spacer size={8} />
          <View style={styles.phaseCardFooter}>
            <Typography variant="caption" style={{ color: scoreColor, fontWeight: '600' }}>
              {scoreLabel}
            </Typography>
            <Typography variant="caption" style={styles.attemptCount}>
              {totalScores} {totalScores === 1 ? 'intento' : 'intentos'}
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
  onContinue?: (sessionId: string) => void;
  onDelete?: (sessionId: string) => void;
}

const SessionCard = ({ session, onPress, onContinue, onDelete }: SessionCardProps) => {
  const sessionDate = useMemo(() => formatDateTime(session.createdAt), [session.createdAt]);
  const updatedDate = useMemo(() => formatDateTime(session.updatedAt), [session.updatedAt]);
  const isCompleted = session.context?.session_completed === true; // Only true if explicitly set to true in context

  // Extract session ID suffix for display
  const sessionIdSuffix = useMemo(() => {
    return session.trainingSessionId ? session.trainingSessionId.split('-').pop()?.toUpperCase() : '';
  }, [session.trainingSessionId]);

  // Map scenario_id to label using SCENARIOS constant
  const scenarioLabel = useMemo(() => {
    const scenarioId = session.context?.scenario_id;
    if (!scenarioId) return 'Escenario no disponible';

    const scenario = SCENARIOS.find(s => s.value === scenarioId);
    return scenario?.label || scenarioId;
  }, [session.context?.scenario_id]);

  return (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={() => onPress(session.trainingSessionId)}
      activeOpacity={0.7}
    >
      <View style={styles.sessionCardHeader}>
        <View style={{ flex: 1 }}>
          <Typography variant="caption" style={styles.sessionIdBadge}>
            TID# {sessionIdSuffix}
          </Typography>
          <Typography variant="body" style={styles.sessionCardTitle}>
            {sessionDate}
          </Typography>
          {session.updatedAt && (
            <Typography variant="caption" style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
              Última interacción: {updatedDate}
            </Typography>
          )}
        </View>
        <Typography variant="caption" style={styles.sessionCardRoute}>
          {scenarioLabel}
        </Typography>
      </View>

      <Spacer size={10} />

      <View style={styles.sessionCardFooter}>
        {/* Status Badge */}
        <View style={isCompleted ? styles.completedTag : styles.inProgressTag}>
          <Typography variant="caption" style={isCompleted ? styles.completedText : styles.inProgressText}>
            {isCompleted ? 'Completado' : 'En Progreso'}
          </Typography>
        </View>

        {/* Action Buttons */}
        <View style={styles.sessionActions}>
          {!isCompleted && onContinue && (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => onContinue(session.trainingSessionId)}
              activeOpacity={0.7}
            >
              <Icon type="MaterialIcons" name="play-arrow" size={16} color="#2196F3" />
              <Typography variant="caption" style={styles.continueButtonText}>
                Continuar
              </Typography>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              onPress={() => onDelete(session.trainingSessionId)}
              activeOpacity={0.7}
              style={{ marginLeft: !isCompleted && onContinue ? 8 : 0 }}
            >
              <Icon type="MaterialIcons" name="delete-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function ScoresScreen() {
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const router = useRouter();
  const params = useLocalSearchParams<{ userId?: string; userName?: string }>();
  const selectedUserId = typeof params.userId === 'string' ? params.userId : undefined;
  const selectedUserName = typeof params.userName === 'string' ? params.userName : undefined;
  const currentUserId = currentUser?.id;
  const activeUserId = selectedUserId ?? currentUserId;
  const viewingOtherUser = Boolean(selectedUserId && selectedUserId !== currentUserId);
  const activeUserName = viewingOtherUser
    ? selectedUserName ?? 'Estudiante'
    : currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`
    : '';

  const [viewMode, setViewMode] = useState<'categories' | 'sessions'>('sessions');
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

  const {
    data: history = [],
    isLoading: isHistoryLoading,
    refetch: refetchHistory,
  } = useTrainingContextHistory(activeUserId);

  // Fetch all phases scores in a single API call
  const {
    data: allPhasesData,
    isLoading: isPhasesLoading,
    refetch: refetchPhasesScores,
  } = useAllPhasesScores({ phaseIds: PHASE_IDS, userId: activeUserId });

  // Delete training session mutation
  const deleteSessionMutation = useDeleteTrainingSession();

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (activeUserId) {
        refetchHistory();
        refetchPhasesScores();
      }
    }, [activeUserId, refetchHistory, refetchPhasesScores])
  );

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    if (!activeUserId) return;

    setIsRefreshing(true);
    try {
      await Promise.all([refetchHistory(), refetchPhasesScores()]);
      showSnackbar('Datos actualizados correctamente', 'success');
    } catch (error) {
      showSnackbar('Error al actualizar los datos', 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [activeUserId, refetchHistory, refetchPhasesScores, showSnackbar]);

  const handlePhasePress = useCallback(
    (phaseId: string) => { router.push({ pathname: '/phase-detail', params: { phaseId, phaseLabel: PHASE_LABELS[phaseId] }, });
    },
    [router],
  );

  const handleSessionPress = useCallback(
    (sessionId: string) => { router.push({ pathname: '/session-detail',  params: { sessionId }, }); }, [router],
  );

  const handleContinueSession = useCallback(
    async (sessionId: string) => {
      try {
        // Fetch the last controller turn to get the session state
        const lastTurn = await getLastControllerTurn(sessionId);

        // Navigate to ATC practice screen with all the required params
        router.push({
          pathname: '/atc-practice',
          params: {
            session_id: sessionId,
            frequency: lastTurn.frequency,
            controller_text: lastTurn.controller_text,
            feedback: lastTurn.feedback,
            session_completed: String(lastTurn.session_completed),
          },
        });
      } catch (error: any) {
        showSnackbar(
          error?.response?.data?.message || 'No se pudo continuar la sesión. Por favor, intenta de nuevo.',
          'error'
        );
      }
    },
    [router, showSnackbar],
  );

  const handleDeleteSession = useCallback(
    (sessionId: string) => {
      setSessionToDelete(sessionId);
      setDeleteDialogVisible(true);
    },
    [],
  );

  const confirmDelete = useCallback(() => {
    if (!sessionToDelete) return;

    deleteSessionMutation.mutate(sessionToDelete, {
      onSuccess: () => {
        showSnackbar('La sesión ha sido eliminada correctamente', 'success');
        setDeleteDialogVisible(false);
        setSessionToDelete(null);
      },
      onError: (error: any) => {
        showSnackbar(
          error?.response?.data?.message || 'No se pudo eliminar la sesión. Por favor, intenta de nuevo.',
          'error'
        );
        setDeleteDialogVisible(false);
        setSessionToDelete(null);
      },
    });
  }, [sessionToDelete, deleteSessionMutation, showSnackbar]);

  const cancelDelete = useCallback(() => {
    setDeleteDialogVisible(false);
    setSessionToDelete(null);
  }, []);

  const isBusy = isUserLoading || isHistoryLoading || isPhasesLoading;
  const canManageSessions = !viewingOtherUser;
  const clearSelectedUser = useCallback(() => {
    router.replace('/(tabs)/ScoresTab');
  }, [router]);

  return (
    <ResponsiveLayout showTopNav={true}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
      >
        {/* Header with Title and Refresh Button */}
        <View style={styles.headerContainer}>
          <Typography variant="h1" style={styles.title}>
            Calificaciones
          </Typography>
          <TouchableOpacity
            onPress={handleRefresh}
            disabled={isRefreshing || isBusy}
            style={styles.refreshButton}
            activeOpacity={0.7}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color="#2196F3" />
            ) : (
              <Icon type="MaterialIcons" name="refresh" size={24} color="#2196F3" />
            )}
          </TouchableOpacity>
        </View>

        <Spacer size={12} />

        <Typography variant="caption" style={styles.subtitle}>
          {viewingOtherUser
            ? 'Consulta el desempeno del estudiante seleccionado en cada categoria.'
            : 'Consulta tu desempeno en cada categoria de comunicacion ATC.'}
        </Typography>

        {viewingOtherUser && (
          <>
            <Spacer size={12} />
            <View style={styles.viewerBanner}>
              <View>
                <Typography variant="caption" style={styles.viewerBannerLabel}>
                  Estas supervisando a
                </Typography>
                <Typography variant="h3" style={styles.viewerBannerName}>
                  {activeUserName}
                </Typography>
              </View>
            </View>
          </>
        )}

        <Spacer size={24} />

        {/* Toggle View Mode */}
        <View style={styles.toggleContainer}>
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
            {PHASE_IDS.map((phaseId) => {
              const phaseData = allPhasesData?.phases?.[phaseId];
              return (
                <PhaseCard
                  key={phaseId}
                  phaseId={phaseId}
                  phaseLabel={PHASE_LABELS[phaseId]}
                  onPress={handlePhasePress}
                  averageScore={phaseData?.average_score ?? 0}
                  totalScores={phaseData?.total_scores ?? 0}
                  isLoading={isPhasesLoading}
                />
              );
            })}
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
                  {viewingOtherUser
                    ? 'Este estudiante no tiene sesiones registradas'
                    : 'No tienes sesiones de entrenamiento'}
                </Typography>
                <Spacer size={8} />
                <Typography variant="body" style={styles.emptyText}>
                  {viewingOtherUser
                    ? 'Aun no registramos sesiones para este estudiante.'
                    : 'Completa tu primera sesion de practica ATC para ver tus calificaciones aqui.'}
                </Typography>
              </View>
            ) : (
              <View style={styles.list}>
                {history.map((session) => (
                  <React.Fragment key={session.trainingSessionId ?? session.createdAt}>
                    <SessionCard
                      session={session}
                      onPress={handleSessionPress}
                      onContinue={canManageSessions ? handleContinueSession : undefined}
                      onDelete={canManageSessions ? handleDeleteSession : undefined}
                    />
                    <Spacer size={12} />
                  </React.Fragment>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteDialogVisible}
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Icon type="MaterialIcons" name="warning" color="#EF4444" size={48} />
            </View>

            <Typography variant="h3" style={styles.modalTitle}>
              Eliminar sesión
            </Typography>

            <Typography variant="body" style={styles.modalMessage}>
              ¿Estás seguro de que deseas eliminar esta sesión de entrenamiento? Esta acción no se puede deshacer.
            </Typography>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={cancelDelete}
              >
                <Typography variant="body" style={styles.cancelButtonText}>
                  Cancelar
                </Typography>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButtonModal]}
                onPress={confirmDelete}
              >
                <Typography variant="body" style={styles.deleteButtonModalText}>
                  Eliminar
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Snackbar */}
      <AppSnackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        onDismiss={hideSnackbar}
      />
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    opacity: 0.7,
  },
  viewerBanner: {
    backgroundColor: '#E0E7FF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  viewerBannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#2563EB',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  viewerBannerButtonText: {
    color: '#2563EB',
    fontWeight: '600',
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
  sessionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionCardTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  sessionIdBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  sessionCardRoute: {
    opacity: 0.6,
  },
  sessionCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedTag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 0,
  },
  completedText: {
    color: '#2E7D32',
    fontWeight: '600',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  inProgressTag: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 0,
  },
  inProgressText: {
    color: '#E65100',
    fontWeight: '600',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  sessionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2196F3',
    backgroundColor: 'transparent',
    gap: 4,
  },
  continueButtonText: {
    color: '#2196F3',
    fontWeight: '600',
    fontSize: 12,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    width: '80%',
    maxWidth: 400,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
    }),
    elevation: 10,
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#000',
  },
  modalMessage: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  deleteButtonModal: {
    backgroundColor: '#EF4444',
  },
  deleteButtonModalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
