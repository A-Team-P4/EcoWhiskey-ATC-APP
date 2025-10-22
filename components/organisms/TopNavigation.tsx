import { Icon } from '@/components/atoms/Icon';
import { ThemedText } from '@/components/themed-text';
import { useGetMe } from '@/query_hooks/useGetMe';
import { usePathname, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, TouchableOpacity, View, useWindowDimensions, StyleSheet } from 'react-native';
import { Avatar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const TopNavigation: React.FC = () => {
  const { data: user, isLoading } = useGetMe();
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const isMobile = width < 768;

  // Determine which tab is active
  const isATCActive = pathname.includes('ATCTrainingTab');
  const isProfileActive = pathname.includes('UserProfileTab');

  // Generate initials from user's first and last name
  const getInitials = () => {
    if (!user?.firstName || !user?.lastName) return '?';
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };

  const handleSettingsPress = () => {
    setShowSettingsMenu(!showSettingsMenu);
  };

  const handleLogout = async () => {
    try {
      // Clear auth token from AsyncStorage
      await AsyncStorage.removeItem('@auth_token');

      // Close menu
      setShowSettingsMenu(false);

      // Navigate to login screen
      router.replace('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleATCPress = () => {
    router.push('/(tabs)/ATCTrainingTab');
  };

  const handleProfilePress = () => {
    router.push('/(tabs)/UserProfileTab');
  };

  return (
    <View style={{ backgroundColor: '#fff' }}>
      {/* Top row: App name + icons */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: '#e0e0e0',
        }}
      >
        {/* App Logo */}
        <Image
          source={require('@/assets/images/EcoWhiskey.png')}
          style={{
            height: isMobile ? 50 : 60,
            width: isMobile ? 180 : 240,
          }}
          //resizeMode="contain"
        />

        {/* Icons Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          {/* Settings Icon */}
          <View style={{ position: 'relative' }}>
            <TouchableOpacity onPress={handleSettingsPress} activeOpacity={0.7}>
              <Icon type="MaterialIcons" name="settings" size={24} color="#666" />
            </TouchableOpacity>

            {/* Settings Dropdown Menu */}
            {showSettingsMenu && (
              <>
                <TouchableOpacity
                  style={styles.menuOverlay}
                  onPress={() => setShowSettingsMenu(false)}
                  activeOpacity={1}
                />
                <View style={styles.settingsMenu}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                  >
                    <Icon type="MaterialIcons" name="logout" size={20} color="#666" />
                    <ThemedText style={styles.menuItemText}>
                      Cerrar Sesión
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* Avatar */}
          <TouchableOpacity onPress={handleSettingsPress} activeOpacity={0.7}>
            {isLoading ? (
              <Avatar.Icon size={40} icon="account" style={{ backgroundColor: '#e0e0e0' }} />
            ) : (
              <Avatar.Text
                size={40}
                label={getInitials()}
                style={{ backgroundColor: '#000' }}
                labelStyle={{ color: '#fff', fontWeight: 'bold' }}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom row: Navigation tabs (web only) */}
      {!isMobile && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 8,
          }}
        >
          {/* Navigation Tabs */}
          <View style={{ flexDirection: 'row', gap: 24, alignItems: 'center' }}>
            {/* ATC Practice Tab */}
            <TouchableOpacity
              onPress={handleATCPress}
              activeOpacity={0.7}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderBottomWidth: 3,
                borderBottomColor: isATCActive ? '#3d93d8' : 'transparent',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon
                  type="FontAwesome5"
                  name="plane-departure"
                  size={20}
                  color={isATCActive ? '#2196F3' : '#666'}
                />
                <ThemedText
                  style={{
                    fontSize: 16,
                    fontWeight: isATCActive ? '600' : '400',
                    color: isATCActive ? '#2196F3' : '#666',
                  }}
                >
                  ATC Practice
                </ThemedText>
              </View>
            </TouchableOpacity>

            {/* Score Tab */}
            <TouchableOpacity
              onPress={handleProfilePress}
              activeOpacity={0.7}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderBottomWidth: 3,
                borderBottomColor: isProfileActive ? '#2196F3' : 'transparent',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon
                  type="MaterialIcons"
                  name="scoreboard"
                  size={20}
                  color={isProfileActive ? '#2196F3' : '#666'}
                />
                <ThemedText
                  style={{
                    fontSize: 16,
                    fontWeight: isProfileActive ? '600' : '400',
                    color: isProfileActive ? '#2196F3' : '#666',
                  }}
                >
                  Score
                </ThemedText>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  menuOverlay: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  settingsMenu: {
    position: 'absolute',
    top: 35,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
});
