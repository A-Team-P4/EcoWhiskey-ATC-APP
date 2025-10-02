import { UserProfileForm } from '@/components/organisms/UserProfileForm';
import ResponsiveLayout from '@/components/templates/ResponsiveLayout';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

export default function UpdateProfileScreen() {
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Replace with actual user data from authentication/state management
  const userData = {
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@example.com',
    accountType: 'student' as const,
    school: 'aensa',
  };

  const handleProfileUpdate = async (data: any) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual API call to update user profile
      console.log('Updating profile with:', data);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      alert('Perfil actualizado exitosamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error al actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveLayout>
      <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ padding: 20 }}>
          <UserProfileForm
            userData={userData}
            onSubmit={handleProfileUpdate}
            isLoading={isLoading}
          />
        </View>
      </ScrollView>
    </ResponsiveLayout>
  );
}
