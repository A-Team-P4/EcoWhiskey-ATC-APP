import { useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';

import { Spacer } from '@/components/atoms/Spacer';
import { Typography } from '@/components/atoms/Typography';
import { ChangePasswordForm } from '@/components/organisms/ChangePasswordForm';
import { UserProfileForm } from '@/components/organisms/UserProfileForm';
import ResponsiveLayout from '@/components/templates/ResponsiveLayout';
import { ChangePasswordPayload, UpdateUserPayload, User } from '@/interfaces/user';
import { useGroupsByUser, useRemoveGroupMember } from '@/query_hooks/useGroups';
import {
  CURRENT_USER_QUERY_KEY,
  useChangeUserPassword,
  useCurrentUser,
  useSchools,
  useUpdateUserProfile,
  useUpdateUserSchool,
} from '@/query_hooks/useUserProfile';

type ProfileUpdateSubmission = {
  firstName?: string;
  lastName?: string;
  schoolId?: string;
  photo?: string | null;
};

type PasswordFormSubmission = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

function UpdateProfileScreen() {
  const queryClient = useQueryClient();

  const {
    data: currentUser,
    isLoading: isUserLoading,
    isFetching: isUserFetching,
    isError: isUserError,
    error: userError,
    refetch: refetchCurrentUser,
  } = useCurrentUser();
  const { data: schoolsResponse = [], isLoading: isSchoolsLoading } = useSchools();

  const updateUserProfileMutation = useUpdateUserProfile();
  const updateUserSchoolMutation = useUpdateUserSchool();
  const changeUserPasswordMutation = useChangeUserPassword();
  const removeGroupMemberMutation = useRemoveGroupMember();
  const cachedUser = queryClient.getQueryData<User>(CURRENT_USER_QUERY_KEY) ?? null;
  const resolvedUser = currentUser ?? cachedUser ?? null;
  const targetUserId = resolvedUser?.id;
  const {
    data: userGroups = [],
    isLoading: isUserGroupsLoading,
    isFetching: isUserGroupsFetching,
  } = useGroupsByUser(targetUserId, { enabled: Boolean(targetUserId) });
  const hasAssignedGroups = (userGroups?.length ?? 0) > 0;
  const shouldLockSchoolSelection =
    (resolvedUser?.accountType === 'instructor') || hasAssignedGroups;
  const schoolLockReason =
    resolvedUser?.accountType === 'instructor'
      ? 'Los instructores no pueden cambiar su escuela.'
      : hasAssignedGroups
        ? 'No puedes cambiar de escuela mientras perteneces a un grupo.'
        : undefined;

  const profileMutationPending =
    updateUserProfileMutation.isPending || updateUserSchoolMutation.isPending;
  const isProfileLoading = profileMutationPending || isUserLoading;
  const isUserGroupsPending = isUserGroupsLoading || isUserGroupsFetching;

  const isPasswordLoading = changeUserPasswordMutation.isPending;
  const shouldShowLoading = (isUserLoading || isUserFetching) && !resolvedUser;
  const schools = Array.isArray(schoolsResponse) ? schoolsResponse : [];

  const handleProfileUpdate = async (data: ProfileUpdateSubmission): Promise<void> => {
    const latestUser =
      queryClient.getQueryData<User>(CURRENT_USER_QUERY_KEY) ?? currentUser;

    if (!latestUser) {
      Alert.alert('Sin usuario', 'No se pudo identificar al usuario autenticado.');
      return;
    }

    const lockForInstructor = latestUser.accountType === 'instructor';
    const lockForGroups = hasAssignedGroups;
    const lockSchoolSelection = lockForInstructor || lockForGroups;
    const lockReasonMessage =
      lockForInstructor
        ? 'Los instructores no pueden cambiar su escuela.'
        : lockForGroups
          ? 'No puedes cambiar de escuela mientras perteneces a un grupo.'
          : undefined;

    const profileChanges: UpdateUserPayload = {};

    if (data.firstName && data.firstName !== latestUser.firstName) {
      profileChanges.firstName = data.firstName;
    }

    if (data.lastName && data.lastName !== latestUser.lastName) {
      profileChanges.lastName = data.lastName;
    }

    if (data.photo !== undefined) {
      profileChanges.photo = data.photo;
    }

    const userId = latestUser.id;
    const updatePromises: Promise<User>[] = [];

    if (Object.keys(profileChanges).length > 0) {
      updatePromises.push(
        updateUserProfileMutation.mutateAsync({ userId, payload: profileChanges })
      );
    }

    if (
      lockSchoolSelection &&
      data.schoolId &&
      data.schoolId !== (latestUser.school?.id ?? '')
    ) {
      Alert.alert('Cambio no permitido', lockReasonMessage ?? 'No puedes modificar la escuela.');
      return;
    }

    if (data.schoolId && data.schoolId !== (latestUser.school?.id ?? '')) {
      updatePromises.push(
        updateUserSchoolMutation.mutateAsync({
          userId,
          payload: { schoolId: data.schoolId },
        })
      );
    }

    if (updatePromises.length === 0) {
      Alert.alert('Sin cambios', 'No hay cambios para guardar.');
      return;
    }

    try {
      await Promise.all(updatePromises);
      Alert.alert('Perfil actualizado', 'Perfil actualizado exitosamente.');
    } catch (error) {
    
      Alert.alert('Error', 'Error al actualizar el perfil.');
    }
  };

  const handlePasswordUpdate = async (values: PasswordFormSubmission): Promise<void> => {
    const latestUser =
      queryClient.getQueryData<User>(CURRENT_USER_QUERY_KEY) ?? currentUser;

    if (!latestUser) {
      Alert.alert('Sin usuario', 'No se pudo identificar al usuario autenticado.');
      throw new Error('USER_NOT_AVAILABLE');
    }

    const payload: ChangePasswordPayload = {
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    };

    try {
      const response = await changeUserPasswordMutation.mutateAsync({
        userId: latestUser.id,
        payload,
      });
      const successMessage =
        response?.message ?? 'Contrasena actualizada correctamente.';
      Alert.alert('Contrasena actualizada', successMessage);
    } catch (error) {
    
      Alert.alert('Error', 'No se pudo cambiar la contrasena. Intenta nuevamente.');
      throw (error instanceof Error ? error : new Error('CHANGE_PASSWORD_FAILED'));
    }
  };

  if (shouldShowLoading) {
    return (
      <ResponsiveLayout showTopNav={true}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#000" />
          <Typography variant="body" style={{ marginTop: 10 }}>
            Cargando perfil...
          </Typography>
        </View>
      </ResponsiveLayout>
    );
  }

  if (isUserError && !resolvedUser) {
    const message =
      userError instanceof Error
        ? userError.message
        : 'Error al cargar el perfil. Por favor intenta de nuevo.';

    return (
      <ResponsiveLayout showTopNav={true}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Typography variant="body" style={{ color: 'red', textAlign: 'center' }}>
            {message}
          </Typography>
        </View>
      </ResponsiveLayout>
    );
  }

  if (!resolvedUser) {
    return (
      <ResponsiveLayout showTopNav={true}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Typography variant="body" style={{ textAlign: 'center' }}>
            No se encontro informacion del usuario.
          </Typography>
        </View>
      </ResponsiveLayout>
    );
  }

  const canLeaveGroup =
    Boolean(resolvedUser.group) &&
    (resolvedUser.group?.instructorId
      ? resolvedUser.group.instructorId !== resolvedUser.id
      : resolvedUser.group?.role
        ? resolvedUser.group.role !== 'INSTRUCTOR'
        : resolvedUser.accountType !== 'instructor');

  const handleLeaveGroup = async () => {
    if (!resolvedUser.group?.id) return;

    try {
      await removeGroupMemberMutation.mutateAsync({
        groupId: String(resolvedUser.group.id),
        userId: resolvedUser.id,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY }),
        refetchCurrentUser(),
      ]);
      Alert.alert('Grupo', 'Abandonaste el grupo correctamente.');
    } catch (error: any) {
      console.log('Failed to leave group', error);
      const message =
        error?.response?.data?.message ??
        error?.message ??
        'No se pudo abandonar el grupo. Intenta nuevamente.';
      Alert.alert('Error', message);
    }
  };

  return (
    <ResponsiveLayout showTopNav={true}>
      <ScrollView
        style={{ flex: 1, backgroundColor: '#fff' }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        <UserProfileForm
          userData={resolvedUser}
          schools={schools}
          onSubmit={handleProfileUpdate}
          isLoading={isProfileLoading}
          isSchoolLoading={isSchoolsLoading}
          userGroups={userGroups}
          isGroupsLoading={isUserGroupsPending}
          lockSchoolSelection={shouldLockSchoolSelection}
          lockSchoolReason={schoolLockReason}
          canLeaveGroup={canLeaveGroup}
          onLeaveGroup={canLeaveGroup ? handleLeaveGroup : undefined}
          leaveGroupLoading={removeGroupMemberMutation.isPending}
        />

        <Spacer size={32} />

        <ChangePasswordForm
          onSubmit={handlePasswordUpdate}
          isLoading={isPasswordLoading}
        />
      </ScrollView>
    </ResponsiveLayout>
  );
}

export default UpdateProfileScreen;
