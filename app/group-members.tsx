import { useSnackbar } from '@/hooks/useSnackbar';
import { GroupMembershipResponse } from '@/interfaces/group';
import { useGroupMembers, useRemoveGroupMember } from '@/query_hooks/useGroups';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Icon } from '@/components/atoms/Icon';
import { Spacer } from '@/components/atoms/Spacer';
import { Typography } from '@/components/atoms/Typography';
import { AppSnackbar } from '@/components/molecules/AppSnackbar';
import ResponsiveLayout from '@/components/templates/ResponsiveLayout';

export default function GroupMembersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ groupId?: string; groupName?: string }>();
  const groupId = typeof params.groupId === 'string' ? params.groupId : undefined;
  const groupName = typeof params.groupName === 'string' ? params.groupName : 'Grupo';
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

  const [memberToRemove, setMemberToRemove] = useState<GroupMembershipResponse | null>(null);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  const {
    data: membersData = [],
    isLoading: isMembersLoading,
    refetch: refetchMembers,
  } = useGroupMembers(groupId);

  const removeGroupMemberMutation = useRemoveGroupMember();

  const studentMembers = useMemo(
    () => membersData.filter((m) => m.role === 'student'),
    [membersData]
  );

  // Debug logging
  useEffect(() => {
    console.log('GroupMembersScreen - groupId:', groupId);
    console.log('GroupMembersScreen - membersData:', membersData);
    console.log('GroupMembersScreen - studentMembers:', studentMembers);
  }, [groupId, membersData, studentMembers]);

  const navigateToStudentScores = (student: { id: string; firstName: string; lastName: string; email: string }) => {
    router.push({
      pathname: '/(tabs)/ScoresTab',
      params: {
        userId: student.id,
        userName: `${student.firstName} ${student.lastName}`,
      },
    });
  };

  const handleRemoveMemberRequest = (member: GroupMembershipResponse) => {
    setMemberToRemove(member);
    setConfirmDeleteVisible(true);
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove || !groupId) return;

    const memberId = memberToRemove.user?.id ?? memberToRemove.userId;
    if (!memberId) {
      showSnackbar('No se pudo identificar al miembro.', 'error');
      setConfirmDeleteVisible(false);
      setMemberToRemove(null);
      return;
    }

    try {
      await removeGroupMemberMutation.mutateAsync({
        groupId,
        userId: memberId,
      });
      showSnackbar('Miembro removido correctamente.', 'success');
      refetchMembers();
    } catch (error: any) {
      console.error('Failed to remove member', error);
      showSnackbar(
        error?.response?.data?.message ?? 'No se pudo remover al miembro.',
        'error'
      );
    } finally {
      setConfirmDeleteVisible(false);
      setMemberToRemove(null);
    }
  };

  const handleCancelRemove = () => {
    setConfirmDeleteVisible(false);
    setMemberToRemove(null);
  };

  useEffect(() => {
    if (groupId) {
      refetchMembers();
    }
  }, [groupId, refetchMembers]);

  if (!groupId) {
    return (
      <ResponsiveLayout showTopNav>
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Typography variant="h3">Error</Typography>
            <Spacer size={12} />
            <Typography variant="body">No se especificó un grupo válido.</Typography>
          </View>
        </View>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout showTopNav>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Icon type="MaterialIcons" name="arrow-back" size={24} color="#2196F3" />
            <Typography variant="body" style={styles.backButtonText}>
              Volver al panel
            </Typography>
          </TouchableOpacity>
          <Spacer size={16} />
          <Typography variant="h2">{groupName}</Typography>
          <Spacer size={4} />
          <Typography variant="caption" style={styles.subtitle}>
            Estudiantes del grupo
          </Typography>
          <Spacer size={24} />

          {isMembersLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Spacer size={12} />
              <Typography variant="body">Cargando estudiantes...</Typography>
            </View>
          ) : studentMembers.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon type="MaterialIcons" name="group" size={64} color="#9CA3AF" />
              <Spacer size={16} />
              <Typography variant="h3" style={styles.emptyTitle}>
                No hay estudiantes
              </Typography>
              <Spacer size={8} />
              <Typography variant="body" style={styles.emptyText}>
                Este grupo aún no tiene estudiantes asignados.
              </Typography>
            </View>
          ) : (
            <View style={styles.membersList}>
              {studentMembers.map((member) => {
                const memberUserId = member.user?.id ?? member.userId;
                const memberFirstName = member.user?.firstName ?? member.firstName;
                const memberLastName = member.user?.lastName ?? member.lastName;
                const fullName = `${memberFirstName ?? ''} ${memberLastName ?? ''}`.trim() || 'Sin nombre';
                const canRemove = Boolean(memberUserId);

                return (
                  <View key={member.id} style={styles.memberCard}>
                    <Typography variant="body" style={styles.memberName}>
                      {fullName}
                    </Typography>
                    <Spacer size={4} />
                    <Typography variant="caption" style={styles.memberMeta}>
                      {member.user?.email ?? member.email ?? 'Sin correo definido'}
                    </Typography>
                    <Spacer size={12} />
                    <View style={styles.memberActions}>
                      <TouchableOpacity
                        style={styles.memberEvaluationButton}
                        onPress={() => {
                          if (memberUserId) {
                            navigateToStudentScores({
                              id: memberUserId,
                              firstName: memberFirstName ?? '',
                              lastName: memberLastName ?? '',
                              email: member.user?.email ?? member.email ?? '',
                            });
                          }
                        }}
                      >
                        <Typography variant="body" style={styles.memberEvaluationLabel}>
                          Ver evaluaciones
                        </Typography>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.memberActionButton,
                          !canRemove && styles.memberActionButtonDisabled,
                        ]}
                        disabled={!canRemove || removeGroupMemberMutation.isPending}
                        onPress={() => handleRemoveMemberRequest(member)}
                      >
                        <Typography variant="body" style={styles.memberActionLabel}>
                          Remover
                        </Typography>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Delete Confirmation Modal */}
        <Modal
          transparent
          animationType="fade"
          visible={confirmDeleteVisible}
          onRequestClose={handleCancelRemove}
        >
          <TouchableWithoutFeedback onPress={handleCancelRemove}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.modalContent}>
                  <Typography variant="h3" style={styles.modalTitle}>
                    Remover miembro
                  </Typography>
                  <Spacer size={12} />
                  <Typography variant="body" style={styles.modalMessage}>
                    ¿Estás seguro de que deseas remover a este estudiante del grupo?
                  </Typography>
                  <Spacer size={24} />
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={handleCancelRemove}
                    >
                      <Typography variant="body" style={styles.cancelButtonText}>
                        Cancelar
                      </Typography>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.confirmButton]}
                      onPress={handleConfirmRemoveMember}
                    >
                      <Typography variant="body" style={styles.confirmButtonText}>
                        Remover
                      </Typography>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <AppSnackbar
          visible={snackbar.visible}
          message={snackbar.message}
          type={snackbar.type}
          onDismiss={hideSnackbar}
        />
      </View>
    </ResponsiveLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    color: '#2196F3',
    fontWeight: '600',
    fontSize: 16,
  },
  subtitle: {
    color: '#6B7280',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 22,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  membersList: {
    gap: 12,
  },
  memberCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  memberName: {
    fontWeight: '600',
    fontSize: 16,
  },
  memberMeta: {
    color: '#6B7280',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  memberEvaluationButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  memberEvaluationLabel: {
    color: '#2196F3',
    fontWeight: '600',
    fontSize: 14,
  },
  memberActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FFCDD2',
    backgroundColor: '#FFEBEE',
  },
  memberActionButtonDisabled: {
    opacity: 0.5,
  },
  memberActionLabel: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalMessage: {
    textAlign: 'center',
    color: '#6B7280',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#EF4444',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
