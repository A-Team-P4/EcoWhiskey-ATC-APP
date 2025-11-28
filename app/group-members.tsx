import { Icon } from '@/components/atoms/Icon';
import { Spacer } from '@/components/atoms/Spacer';
import { Typography } from '@/components/atoms/Typography';
import { AppSnackbar } from '@/components/molecules/AppSnackbar';
import { MultiSelectDropdown } from '@/components/molecules/MultiSelectDropdown';
import ResponsiveLayout from '@/components/templates/ResponsiveLayout';
import { useSnackbar } from '@/hooks/useSnackbar';
import { GroupMembershipResponse } from '@/interfaces/group';
import {
  useAddGroupMember,
  useGroup,
  useGroupMembers,
  useRemoveGroupMember,
} from '@/query_hooks/useGroups';
import { useCurrentUser, useStudentsBySchool } from '@/query_hooks/useUserProfile';
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

export default function GroupMembersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ groupId?: string; groupName?: string }>();
  const groupId = typeof params.groupId === 'string' ? params.groupId : undefined;
  const groupName = typeof params.groupName === 'string' ? params.groupName : 'Grupo';
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();
  const { data: currentUser, isLoading: isCurrentUserLoading } = useCurrentUser();
  const isInstructor = currentUser?.accountType === 'instructor';
  const { data: groupData } = useGroup(groupId);
  const displayGroupName = groupData?.name ?? groupName;
  const schoolId = groupData?.schoolId ?? currentUser?.school?.id;
  const {
    data: schoolStudents = [],
    isLoading: isStudentsLoading,
  } = useStudentsBySchool(schoolId);

  const [memberToRemove, setMemberToRemove] = useState<GroupMembershipResponse | null>(null);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [addStudentsError, setAddStudentsError] = useState<string | null>(null);

  const {
    data: membersData = [],
    isLoading: isMembersLoading,
    refetch: refetchMembers,
  } = useGroupMembers(groupId);

  const addGroupMemberMutation = useAddGroupMember();
  const removeGroupMemberMutation = useRemoveGroupMember();

  const studentMembers = useMemo(
    () => membersData.filter((m) => m.role === 'student'),
    [membersData]
  );

  const availableStudentOptions = useMemo(() => {
    if (!schoolStudents || schoolStudents.length === 0) {
      return [];
    }

    const memberIds = new Set(
      membersData
        .map((member) => member.user?.id ?? member.userId)
        .filter(Boolean)
        .map((id) => String(id))
    );

    return schoolStudents
      .filter((student) => !memberIds.has(String(student.id)))
      .map((student) => ({
        label: `${student.firstName} ${student.lastName} (${student.email})`,
        value: String(student.id),
      }));
  }, [membersData, schoolStudents]);

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

  const handleSelectStudents = (values: string[]) => {
    setSelectedStudentIds(values);
    if (values.length > 0) {
      setAddStudentsError(null);
    }
  };

  const handleAddStudents = async () => {
    if (!groupId) return;
    if (!isInstructor) {
      showSnackbar('Solo instructores pueden agregar estudiantes.', 'error');
      return;
    }
    if (selectedStudentIds.length === 0) {
      setAddStudentsError('Selecciona al menos un estudiante.');
      return;
    }

    try {
      await Promise.all(
        selectedStudentIds.map((userId) =>
          addGroupMemberMutation.mutateAsync({
            groupId,
            payload: { userId },
          })
        )
      );
      showSnackbar('Estudiantes agregados al grupo.', 'success');
      setSelectedStudentIds([]);
      setAddStudentsError(null);
      refetchMembers();
    } catch (error: any) {
      console.error('Failed to add students', error);
      showSnackbar(
        error?.response?.data?.message ?? 'No se pudieron agregar los estudiantes.',
        'error'
      );
    }
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
          <Typography variant="h2">{displayGroupName}</Typography>
          <Spacer size={4} />
          <Typography variant="caption" style={styles.subtitle}>
            Estudiantes del grupo
          </Typography>
          <Spacer size={24} />

          {isInstructor ? (
            <View style={styles.addCard}>
              <Typography variant="h3" style={styles.addCardTitle}>
                Agregar estudiantes
              </Typography>
              <Spacer size={8} />
              {isStudentsLoading || isCurrentUserLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#2196F3" />
                  <Spacer size={8} />
                  <Typography variant="body">Cargando estudiantes disponibles...</Typography>
                </View>
              ) : !schoolId ? (
                <Typography variant="body" style={styles.emptyText}>
                  No se pudo obtener la escuela para cargar estudiantes.
                </Typography>
              ) : (
                <>
                  <MultiSelectDropdown
                    label="Seleccionar estudiantes"
                    values={selectedStudentIds}
                    onSelect={handleSelectStudents}
                    options={availableStudentOptions}
                    placeholder={
                      availableStudentOptions.length === 0
                        ? 'Todos los estudiantes ya estan en el grupo'
                        : 'Elige estudiantes para agregarlos'
                    }
                    error={addStudentsError ?? undefined}
                    leftIconName="person-add"
                  />
                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      (selectedStudentIds.length === 0 ||
                        addGroupMemberMutation.isPending ||
                        availableStudentOptions.length === 0) &&
                        styles.addButtonDisabled,
                    ]}
                    onPress={handleAddStudents}
                    disabled={
                      selectedStudentIds.length === 0 ||
                      addGroupMemberMutation.isPending ||
                      availableStudentOptions.length === 0
                    }
                    activeOpacity={0.85}
                  >
                    {addGroupMemberMutation.isPending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Typography variant="body" style={styles.addButtonText}>
                        Agregar seleccionados
                      </Typography>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : null}

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
  addCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    marginBottom: 12,
  },
  addCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  addButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#2196F3',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
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
