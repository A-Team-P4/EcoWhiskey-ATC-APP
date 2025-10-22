import { Spacer } from '@/components/atoms/Spacer';
import { Typography } from '@/components/atoms/Typography';
import { ChangePasswordForm } from '@/components/organisms/ChangePasswordForm';
import { UserProfileForm } from '@/components/organisms/UserProfileForm';
import ResponsiveLayout from '@/components/templates/ResponsiveLayout';
import { ChangePasswordPayload, UpdateUserPayload, User } from '@/interfaces/user';
import {
  CURRENT_USER_QUERY_KEY,
  useChangeUserPassword,
  useCurrentUser,
  useSchools,
  useUpdateUserProfile,
  useUpdateUserSchool,
} from '@/query_hooks/useUserProfile';
import { useQueryClient } from '@tanstack/react-query';
import { ScrollView } from 'react-native';

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

export default function UpdateProfileScreen() {
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const { data: schoolsResponse = [], isLoading: isSchoolsLoading } = useSchools();

  const updateUserProfileMutation = useUpdateUserProfile();
  const updateUserSchoolMutation = useUpdateUserSchool();
  const changeUserPasswordMutation = useChangeUserPassword();

  const profileMutationPending =
    updateUserProfileMutation.isPending || updateUserSchoolMutation.isPending;
  const isProfileLoading = profileMutationPending || isUserLoading;

  const resolvedUser =
    currentUser ??
    (queryClient.getQueryData<User>(CURRENT_USER_QUERY_KEY) ?? null);

  const isPasswordLoading = changeUserPasswordMutation.isPending;

  const handleProfileUpdate = async (data: ProfileUpdateSubmission) => {
    const latestUser =
      queryClient.getQueryData<User>(CURRENT_USER_QUERY_KEY) ?? currentUser;

    if (!latestUser) {
      alert('No se pudo identificar al usuario autenticado.');
      return;
    }

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

    if (data.schoolId && data.schoolId !== (latestUser.school?.id ?? '')) {
      updatePromises.push(
        updateUserSchoolMutation.mutateAsync({
          userId,
          payload: { schoolId: data.schoolId },
        })
      );
    }

    if (updatePromises.length === 0) {
      alert('No hay cambios para guardar');
      return;
    }

    try {
      await Promise.all(updatePromises);
      alert('Perfil actualizado exitosamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error al actualizar el perfil');
    }
  };

  const handlePasswordUpdate = async (values: PasswordFormSubmission) => {
    const latestUser =
      queryClient.getQueryData<User>(CURRENT_USER_QUERY_KEY) ?? currentUser;

    if (!latestUser) {
      alert('No se pudo identificar al usuario autenticado.');
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
        response?.message ?? 'Contraseña actualizada correctamente';
      alert(successMessage);
    } catch (error) {
      console.error('Error changing password:', error);
      alert('No se pudo cambiar la contraseña. Intenta nuevamente.');
      throw error;
    }
  };

  if (isFetchingUser) {
    return (
      <ResponsiveLayout showTopNav={true}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={{ marginTop: 10 }}>Cargando perfil...</Text>
        </View>
      </ResponsiveLayout>
    );
  }


  if (error) {
    return (
      <ResponsiveLayout showTopNav={true}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: 'red', textAlign: 'center' }}>
            Error al cargar el perfil. Por favor intenta de nuevo.
          </Text>
        </View>
      </ResponsiveLayout>
    );
  }

  if (!currentUser) {
    return (
      <ResponsiveLayout showTopNav={true}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ textAlign: 'center' }}>
            No se encontró información del usuario.
          </Text>
        </View>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout showTopNav={true}>
      <ScrollView
        style={{ flex: 1, backgroundColor: '#fff' }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        {resolvedUser ? (
          <>
            <UserProfileForm
              userData={resolvedUser}
              schools={schoolsResponse}
              onSubmit={handleProfileUpdate}
              isLoading={isProfileLoading}
              isSchoolLoading={isSchoolsLoading}
            />

            <Spacer size={32} />

            <ChangePasswordForm
              onSubmit={handlePasswordUpdate}
              isLoading={isPasswordLoading}
            />
          </>
        ) : (
          <Typography variant="body" style={{ textAlign: 'center', marginTop: 24 }}>
            {isUserLoading
              ? 'Cargando información del usuario...'
              : 'No se pudo cargar la información del usuario.'}
          </Typography>
        )}
      </ScrollView>
    </ResponsiveLayout>
  );
}











