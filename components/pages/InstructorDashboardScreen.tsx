import { useSnackbar } from '@/hooks/useSnackbar';
import { GroupMembershipResponse, GroupResponse } from '@/interfaces/group';
import {
  useAddGroupMember,
  useCreateGroup,
  useDeleteGroup,
  useGroupMembers,
  useGroups,
  useRemoveGroupMember,
  useUpdateGroup,
} from '@/query_hooks/useGroups';
import { useCurrentUser, useStudentsBySchool } from '@/query_hooks/useUserProfile';
import { getGroupMembers } from '@/services/apiClient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from 'react-native';
import { Icon } from '../atoms/Icon';
import { Spacer } from '../atoms/Spacer';
import { Typography } from '../atoms/Typography';
import { ActionButton } from '../molecules/ActionButton';
import { AppSnackbar } from '../molecules/AppSnackbar';
import { FormInput } from '../molecules/FormInput';
import { MultiSelectDropdown } from '../molecules/MultiSelectDropdown';
import ResponsiveLayout from '../templates/ResponsiveLayout';

interface GroupFormState {
  name: string;
  description: string;
}

export const InstructorDashboardScreen = () => {
  const { width } = useWindowDimensions();
  const isCompact = width < 640;
  const router = useRouter();
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

  const {
    data: currentUser,
    isLoading: isUserLoading,
    refetch: refetchCurrentUser,
  } = useCurrentUser();

  const isInstructor = currentUser?.accountType === 'instructor';
  const schoolId = isInstructor ? currentUser?.school?.id : undefined;

  const {
    data: students = [],
    refetch: refetchStudents,
  } = useStudentsBySchool(schoolId);

  const {
    data: groups = [],
    isLoading: isGroupsLoading,
    refetch: refetchGroups,
  } = useGroups(
    schoolId ? { schoolId: String(schoolId) } : undefined,
    { enabled: Boolean(schoolId && isInstructor) }
  );

  const createGroupMutation = useCreateGroup();
  const updateGroupMutation = useUpdateGroup();
  const deleteGroupMutation = useDeleteGroup();
  const addGroupMemberMutation = useAddGroupMember();
  const removeGroupMemberMutation = useRemoveGroupMember();

  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [groupModalMode, setGroupModalMode] = useState<'create' | 'edit'>('create');
  const [groupFormValues, setGroupFormValues] = useState<GroupFormState>({
    name: '',
    description: '',
  });
  const [groupFormErrors, setGroupFormErrors] = useState<{ name?: string }>({});
  const [editingGroup, setEditingGroup] = useState<GroupResponse | null>(null);

  const [membersModalVisible, setMembersModalVisible] = useState(false);
  const [membersModalGroup, setMembersModalGroup] = useState<GroupResponse | null>(null);
  const [selectedStudentsToAdd, setSelectedStudentsToAdd] = useState<string[]>([]);
  const [membersModalError, setMembersModalError] = useState<string | null>(null);
  const [groupPendingDeletion, setGroupPendingDeletion] = useState<GroupResponse | null>(null);
  const [groupMemberCounts, setGroupMemberCounts] = useState<Record<string, number>>({});
  const [memberPendingRemoval, setMemberPendingRemoval] =
    useState<GroupMembershipResponse | null>(null);
  const [memberPendingRemovalName, setMemberPendingRemovalName] = useState('');

  const {
    data: groupMembers = [],
    isLoading: isMembersLoading,
    refetch: refetchGroupMembers,
  } = useGroupMembers(membersModalGroup?.id);

  const studentOptions = useMemo(
    () =>
      students.map((student) => ({
        label: `${student.firstName} ${student.lastName} (${student.email})`,
        value: student.id,
      })),
    [students]
  );

  const availableStudentOptions = useMemo(() => {
    if (!membersModalGroup) return [];
    const memberIds = new Set(
      groupMembers.map((member) => member.userId?.toString())
    );
    return studentOptions.filter((option) => !memberIds.has(option.value.toString()));
  }, [groupMembers, membersModalGroup, studentOptions]);

  const studentMembers = useMemo(
    () =>
      groupMembers.filter(
        (member) => member.role?.toString().toLowerCase() === 'student'
      ),
    [groupMembers]
  );

  useEffect(() => {
    if (!membersModalVisible) {
      setSelectedStudentsToAdd([]);
      setMembersModalError(null);
    }
  }, [membersModalVisible]);

  useEffect(() => {
    let isMounted = true;

    const fetchCounts = async () => {
      try {
        const entries = await Promise.all(
          groups.map(async (group) => {
            if (typeof group.memberCount === 'number') {
              return [group.id, group.memberCount] as const;
            }

            try {
              const members = await getGroupMembers(group.id);
              const studentCount = members.filter(
                (member) => member.role?.toLowerCase() === 'student'
              ).length;
              return [group.id, studentCount] as const;
            } catch (error) {
              console.warn('Failed to fetch members for group', group.id, error);
              return [group.id, 0] as const;
            }
          })
        );

        if (!isMounted) {
          return;
        }

        setGroupMemberCounts((prev) => {
          const next = { ...prev };
          let updated = false;
          entries.forEach(([groupId, count]) => {
            if (next[groupId] !== count) {
              next[groupId] = count;
              updated = true;
            }
          });
          return updated ? next : prev;
        });
      } catch (error) {
        console.log('Failed to preload group member counts', error);
      }
    };

    if (groups.length > 0) {
      fetchCounts();
    } else {
      setGroupMemberCounts((prev) => {
        // Only update if there are actually items to clear
        if (Object.keys(prev).length > 0) {
          return {};
        }
        return prev;
      });
    }

    return () => {
      isMounted = false;
    };
  }, [groups]);

  useEffect(() => {
    if (membersModalGroup) {
      setGroupMemberCounts((prev) => {
        const currentCount = prev[membersModalGroup.id];
        const newCount = studentMembers.length;
        if (currentCount !== newCount) {
          return {
            ...prev,
            [membersModalGroup.id]: newCount,
          };
        }
        return prev;
      });
    }
  }, [studentMembers.length, membersModalGroup?.id]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refetchCurrentUser(),
      schoolId ? refetchStudents() : Promise.resolve(),
      schoolId ? refetchGroups() : Promise.resolve(),
    ]);
  }, [refetchCurrentUser, refetchStudents, refetchGroups, schoolId]);

  const navigateToStudentScores = (student: { id: string; firstName: string; lastName: string; email: string }) => {
    router.push({
      pathname: '/(tabs)/ScoresTab',
      params: {
        userId: student.id,
        userName: `${student.firstName} ${student.lastName}`,
      },
    });
  };

  const renderLayout = (content: React.ReactNode) => (
    <ResponsiveLayout showTopNav topNavProps={{ showNavigationOptions: false }}>
      <View style={styles.container}>{content}</View>
    </ResponsiveLayout>
  );

  const openCreateGroupModal = () => {
    setGroupModalMode('create');
    setGroupFormValues({ name: '', description: '' });
    setGroupFormErrors({});
    setEditingGroup(null);
    setGroupModalVisible(true);
  };

  const openEditGroupModal = (group: GroupResponse) => {
    setGroupModalMode('edit');
    setGroupFormValues({
      name: group.name,
      description: group.description ?? '',
    });
    setGroupFormErrors({});
    setEditingGroup(group);
    setGroupModalVisible(true);
  };

  const closeGroupModal = () => {
    setGroupModalVisible(false);
    setGroupFormErrors({});
    setGroupFormValues({ name: '', description: '' });
    setEditingGroup(null);
  };

  const handleSaveGroup = async () => {
    if (!schoolId) return;
    if (!groupFormValues.name.trim()) {
      setGroupFormErrors({ name: 'El nombre del grupo es requerido' });
      return;
    }

    try {
      if (groupModalMode === 'create') {
        await createGroupMutation.mutateAsync({
          name: groupFormValues.name.trim(),
          description: groupFormValues.description.trim() || undefined,
          schoolId: String(schoolId),
        });
      } else if (editingGroup) {
        await updateGroupMutation.mutateAsync({
          groupId: editingGroup.id,
          payload: {
            name: groupFormValues.name.trim(),
            description: groupFormValues.description.trim() || undefined,
          },
        });
      }
      closeGroupModal();
    } catch (error) {
      console.error('Failed to save group', error);
      showSnackbar('No se pudo guardar el grupo. Intenta nuevamente.', 'error');
    }
  };

  const handleDeleteGroup = (group: GroupResponse) => {
    setGroupPendingDeletion(group);
  };

  const closeDeleteGroupModal = () => {
    setGroupPendingDeletion(null);
  };

  const confirmDeleteGroup = async () => {
    if (!groupPendingDeletion) return;
    try {
      await deleteGroupMutation.mutateAsync({ groupId: groupPendingDeletion.id });
      if (membersModalGroup?.id === groupPendingDeletion.id) {
        setMembersModalVisible(false);
        setMembersModalGroup(null);
      }
      closeDeleteGroupModal();
    } catch (error) {
      console.error('Failed to delete group', error);
      showSnackbar('No se pudo eliminar el grupo.', 'error');
    }
  };

  const openMembersModal = (group: GroupResponse) => {
    setMembersModalGroup(group);
    setMembersModalVisible(true);
  };

  const closeMembersModal = () => {
    setMembersModalVisible(false);
    setMembersModalGroup(null);
    setSelectedStudentsToAdd([]);
    setMembersModalError(null);
  };

  const handleAddStudentsToGroup = async () => {
    if (!membersModalGroup) return;
    if (selectedStudentsToAdd.length === 0) {
      setMembersModalError('Selecciona al menos un estudiante');
      return;
    }

    try {
      await Promise.all(
        selectedStudentsToAdd.map((userId) =>
          addGroupMemberMutation.mutateAsync({
            groupId: membersModalGroup.id,
            payload: { userId },
          })
        )
      );
      setSelectedStudentsToAdd([]);
      setMembersModalError(null);
      await refetchGroupMembers();
      await refetchGroups();
    } catch (error) {
      console.error('Failed to add students', error);
      showSnackbar('No se pudieron agregar los estudiantes.', 'error');
    }
  };

  const handleRemoveMemberRequest = (membership: GroupMembershipResponse) => {
    if (!membersModalGroup) return;
    const instructorId = membersModalGroup.instructorId?.toString();
    if (instructorId === membership.userId?.toString()) {
      showSnackbar('No puedes eliminar al instructor del grupo.', 'error');
      return;
    }

    const memberFirstName = membership.user?.firstName ?? membership.firstName;
    const memberLastName = membership.user?.lastName ?? membership.lastName;
    const displayName =
      memberFirstName && memberLastName
        ? `${memberFirstName} ${memberLastName}`
        : membership.user?.email ?? membership.email ?? membership.userId?.toString() ?? 'este miembro';

    setMemberPendingRemoval(membership);
    setMemberPendingRemovalName(displayName);
  };

  const handleConfirmRemoveMember = async () => {
    if (!membersModalGroup || !memberPendingRemoval) return;

    try {
      await removeGroupMemberMutation.mutateAsync({
        groupId: membersModalGroup.id,
        userId: memberPendingRemoval.userId?.toString() ?? '',
      });
      setMemberPendingRemoval(null);
      setMemberPendingRemovalName('');
      await refetchGroupMembers();
      await refetchGroups();
    } catch (error) {
      console.error('Failed to remove member', error);
      showSnackbar('No se pudo remover al estudiante.', 'error');
    }
  };

  const handleCancelRemoveMember = () => {
    setMemberPendingRemoval(null);
    setMemberPendingRemovalName('');
  };

  if (isUserLoading) {
    return renderLayout(
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!isInstructor) {
    return renderLayout(
      <View style={styles.content}>
        <Typography variant="h2">Panel de Instructor</Typography>
        <Spacer size={12} />
        <Typography variant="body">
          Este panel está disponible únicamente para cuentas de instructor.
        </Typography>
      </View>
    );
  }

  if (!schoolId) {
    return renderLayout(
      <View style={styles.content}>
        <Typography variant="h2">Panel de Instructor</Typography>
        <Spacer size={12} />
        <Typography variant="body">
          Aún no tienes una escuela asociada. Actualiza tu perfil o contacta al administrador.
        </Typography>
      </View>
    );
  }

  const renderGroupsSection = () => (
      <View style={styles.groupsSection}>
      <View
        style={[
          styles.sectionHeaderRow,
          isCompact && styles.sectionHeaderRowStack,
        ]}
      >
        <View>
          <Typography variant="h3" style={styles.sectionTitle}>
            Tus grupos
          </Typography>
          <Typography variant="body" style={styles.groupsSubtitle}>
            Administra los grupos y los estudiantes inscritos en cada uno.
          </Typography>
        </View>
        <TouchableOpacity
          style={[
            styles.sectionActionButton,
            isCompact && styles.sectionActionButtonFull,
          ]}
          onPress={openCreateGroupModal}
        >
          <Typography variant="body" style={styles.sectionActionLabel}>
            + Nuevo grupo
          </Typography>
        </TouchableOpacity>
      </View>
      <Spacer size={16} />

      {isGroupsLoading && groups.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.emptyState}>
          <Typography variant="body" style={styles.emptyStateText}>
            Aún no has creado grupos.
          </Typography>
        </View>
      ) : (
        <View style={styles.groupList}>
          {groups.map((group) => (
            <View key={group.id} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <Typography variant="h3" style={styles.groupName}>
                  {group.name}
                </Typography>
                <View style={styles.groupHeaderActions}>
                  <TouchableOpacity
                    onPress={() => openEditGroupModal(group)}
                    activeOpacity={0.7}
                    style={styles.iconButton}
                  >
                    <Icon
                      type="FontAwesome5"
                      name="edit"
                      size={18}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteGroup(group)}
                    disabled={deleteGroupMutation.isPending}
                    activeOpacity={0.7}
                    style={styles.iconButton}
                  >
                    <Icon
                      type="MaterialIcons"
                      name="delete-outline"
                      size={22}
                      color="#EF4444"
                    />
                  </TouchableOpacity>
                </View>
              </View>
              {group.description ? (
                <>
                  <Spacer size={4} />
                  <Typography variant="body" style={styles.groupDescription}>
                    {group.description}
                  </Typography>
                </>
              ) : null}
              <Spacer size={8} />
              <View style={styles.groupMetaRow}>
                <Typography variant="caption" style={styles.groupMeta}>
                  {group.memberCount ?? groupMemberCounts[group.id] ?? 0} integrante(s)
                </Typography>
                <View
                  style={[
                    styles.inviteBadge,
                    group.inviteOnly ? styles.inviteBadgePrivate : styles.inviteBadgeOpen,
                  ]}
                >
                  <Typography variant="caption" style={styles.inviteBadgeText}>
                    {group.inviteOnly ? 'Solo invitación' : 'Abierto'}
                  </Typography>
                </View>
              </View>
              <Spacer size={12} />
              <View style={styles.groupActionRow}>
                <TouchableOpacity
                  style={styles.groupActionBtn}
                  onPress={() => router.push({
                    pathname: '/group-members',
                    params: {
                      groupId: String(group.id),
                      groupName: group.name,
                    },
                  })}
                >
                  <Typography variant="body" style={styles.groupActionLabel}>
                    Estudiantes
                  </Typography>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderGroupModal = () => (
    <Modal
      transparent
      animationType="fade"
      visible={groupModalVisible}
      onRequestClose={closeGroupModal}
    >
      <TouchableWithoutFeedback onPress={closeGroupModal}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContent}>
              <Typography variant="h3" style={styles.modalTitle}>
                {groupModalMode === 'create' ? 'Crear grupo' : 'Editar grupo'}
              </Typography>
              <Spacer size={12} />
              <FormInput
                label="Nombre del grupo"
                value={groupFormValues.name}
                onChangeText={(value) => {
                  setGroupFormValues((prev) => ({ ...prev, name: value }));
                  if (groupFormErrors.name && value.trim()) {
                    setGroupFormErrors({});
                  }
                }}
                error={groupFormErrors.name}
                required
                leftIconName="groups"
              />
              <FormInput
                label="Descripción"
                value={groupFormValues.description}
                onChangeText={(value) =>
                  setGroupFormValues((prev) => ({ ...prev, description: value }))
                }
                placeholder="Describe el objetivo del grupo"
                leftIconName="short-text"
              />
              <Spacer size={16} />
              <View style={styles.modalActions}>
                <ActionButton
                  title="Cancelar"
                  variant="secondary"
                  onPress={closeGroupModal}
                  disabled={createGroupMutation.isPending || updateGroupMutation.isPending}
                />
                <ActionButton
                  title={groupModalMode === 'create' ? 'Crear' : 'Guardar'}
                  onPress={handleSaveGroup}
                  loading={createGroupMutation.isPending || updateGroupMutation.isPending}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const renderMembersModal = () => (
    <Modal
      transparent
      animationType="fade"
      visible={membersModalVisible}
      onRequestClose={closeMembersModal}
    >
      <TouchableWithoutFeedback onPress={closeMembersModal}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContent}>
              <Typography variant="h3" style={styles.modalTitle}>
                Gestionar estudiantes
              </Typography>
              <Typography variant="body" style={styles.modalSubtitle}>
                {membersModalGroup?.name ?? ''}
              </Typography>
              <Spacer size={12} />
              <MultiSelectDropdown
                label="Agregar estudiantes"
                values={selectedStudentsToAdd}
                onSelect={(values) => {
                  setSelectedStudentsToAdd(values);
                  if (values.length > 0) {
                    setMembersModalError(null);
                  }
                }}
                options={availableStudentOptions}
                placeholder={
                  availableStudentOptions.length === 0
                    ? 'Todos los estudiantes ya están en el grupo'
                    : 'Selecciona estudiantes para agregarlos'
                }
                error={membersModalError ?? undefined}
                leftIconName="person-add"
              />
              <ActionButton
                title="Agregar seleccionados"
                onPress={handleAddStudentsToGroup}
                loading={addGroupMemberMutation.isPending}
                disabled={availableStudentOptions.length === 0}
                iconName="person-add"
              />
              <Spacer size={16} />
              <Typography variant="h3" style={styles.sectionTitle}>
                Integrantes actuales
              </Typography>
              <Spacer size={8} />

              {isMembersLoading ? (
                <View style={styles.centered}>
                  <ActivityIndicator size="large" color="#2196F3" />
                </View>
              ) : studentMembers.length === 0 ? (
                <Typography variant="body" style={styles.emptyStateText}>
                  Este grupo no tiene estudiantes.
                </Typography>
              ) : (
                <View style={styles.memberList}>
                  {studentMembers.map((member) => {
                    const instructorId = membersModalGroup?.instructorId?.toString();
                    const memberUserId = member.userId?.toString();
                    const canRemove = instructorId !== memberUserId;
                    const memberFirstName = member.user?.firstName ?? member.firstName;
                    const memberLastName = member.user?.lastName ?? member.lastName;
                    const fullName =
                      memberFirstName && memberLastName
                        ? `${memberFirstName} ${memberLastName}`
                        : member.user?.email ?? member.email ?? memberUserId ?? '';
                    return (
                      <View key={member.id} style={styles.memberRow}>
                        <View style={styles.memberInfo}>
                          <Typography variant="body" style={styles.memberName}>
                            {fullName}
                          </Typography>
                          <Typography variant="caption" style={styles.memberMeta}>
                            {member.user?.email ?? member.email ?? 'Sin correo definido'}
                          </Typography>
                        </View>
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

              <Spacer size={16} />
              <ActionButton title="Cerrar" variant="secondary" onPress={closeMembersModal} />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  return renderLayout(
    <View style={styles.content}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isGroupsLoading} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        <Typography variant="h2">Panel de Instructor</Typography>
        <Spacer size={4} />
        <Typography variant="body" style={styles.subtitle}>
          {currentUser?.school?.name ?? 'Escuela no definida'}
        </Typography>
        <Spacer size={24} />
        {renderGroupsSection()}
      </ScrollView>

      {renderGroupModal()}
      {renderMembersModal()}
      {groupPendingDeletion ? (
        <Modal
          transparent
          animationType="fade"
          visible={Boolean(groupPendingDeletion)}
          onRequestClose={closeDeleteGroupModal}
        >
          <TouchableWithoutFeedback onPress={closeDeleteGroupModal}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.modalContent}>
                  <Typography variant="h3" style={styles.modalTitle}>
                    Eliminar grupo
                  </Typography>
                  <Spacer size={8} />
                  <Typography variant="body" style={styles.modalSubtitle}>
                    ¿Seguro que deseas eliminar "{groupPendingDeletion.name}"? Esta acción no se
                    puede deshacer.
                  </Typography>
                  <Spacer size={16} />
                  <View style={styles.modalActions}>
                    <ActionButton
                      title="Cancelar"
                      variant="secondary"
                      onPress={closeDeleteGroupModal}
                      disabled={deleteGroupMutation.isPending}
                    />
                    <ActionButton
                      title="Eliminar"
                      onPress={confirmDeleteGroup}
                      loading={deleteGroupMutation.isPending}
                      iconName="delete"
                    />
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      ) : null}
      {memberPendingRemoval ? (
        <Modal
          transparent
          animationType="fade"
          visible={Boolean(memberPendingRemoval)}
          onRequestClose={handleCancelRemoveMember}
        >
          <TouchableWithoutFeedback onPress={handleCancelRemoveMember}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.modalContent}>
                  <Typography variant="h3" style={styles.modalTitle}>
                    Remover estudiante
                  </Typography>
                  <Spacer size={8} />
                  <Typography variant="body" style={styles.modalSubtitle}>
                    ¿Deseas remover a {memberPendingRemovalName} del grupo{' '}
                    {membersModalGroup?.name ?? ''}?
                  </Typography>
                  <Spacer size={16} />
                  <View style={styles.modalActions}>
                    <ActionButton
                      title="Cancelar"
                      variant="secondary"
                      onPress={handleCancelRemoveMember}
                      disabled={removeGroupMemberMutation.isPending}
                    />
                    <ActionButton
                      title="Remover"
                      onPress={handleConfirmRemoveMember}
                      loading={removeGroupMemberMutation.isPending}
                      iconName="person-remove"
                    />
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      ) : null}

      {/* Snackbar */}
      <AppSnackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        onDismiss={hideSnackbar}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  subtitle: {
    color: '#4B5563',
  },
  sectionTitle: {
    color: '#111827',
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sectionHeaderRowStack: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  sectionActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2196F3',
    backgroundColor: '#2196F3',
  },
  sectionActionButtonFull: {
    width: '100%',
    marginTop: 12,
  },
  sectionActionLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    color: '#6B7280',
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  groupsSection: {
    padding: 20,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  groupsSubtitle: {
    color: '#4B5563',
  },
  groupList: {
    gap: 12,
  },
  groupCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupName: {
    fontWeight: '600',
    flex: 1,
  },
  groupHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  groupDescription: {
    color: '#374151',
  },
  groupMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupMeta: {
    color: '#6B7280',
  },
  groupActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  groupActionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2196F3',
    backgroundColor: 'transparent',
  },
  groupActionLabel: {
    color: '#2196F3',
    fontWeight: '600',
    fontSize: 12,
  },
  inviteBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  inviteBadgeText: {
    fontWeight: '600',
    color: '#0F172A',
  },
  inviteBadgePrivate: {
    backgroundColor: '#FEF3C7',
  },
  inviteBadgeOpen: {
    backgroundColor: '#DCFCE7',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  modalTitle: {
    textAlign: 'center',
  },
  modalSubtitle: {
    textAlign: 'center',
    color: '#4B5563',
  },
  modalActions: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 12,
  },
  memberList: {
    gap: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  memberInfo: {
    flex: 1,
    marginRight: 12,
  },
  memberName: {
    fontWeight: '600',
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
});
