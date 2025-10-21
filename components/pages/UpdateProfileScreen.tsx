
import { UserProfileForm } from '@/components/organisms/UserProfileForm';
import ResponsiveLayout from '@/components/templates/ResponsiveLayout';
import { useGetMe } from '@/query_hooks/useGetMe';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

export default function UpdateProfileScreen() {
  const { data: currentUser, isLoading: isFetchingUser, error } = useGetMe();

  const handleProfileUpdate = async (data: any) => {
    try {
      // TODO: Implement actual API call to update user profile
      console.log('Updating profile with:', data);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      alert('Perfil actualizado exitosamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error al actualizar el perfil');
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
      <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ padding: 20 }}>
          <UserProfileForm
            userData={currentUser}
            onSubmit={handleProfileUpdate}
            isLoading={false}
          />
        </View>
      </ScrollView>
    </ResponsiveLayout>
  );
}
