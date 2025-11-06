import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Avatar } from 'react-native-paper';

import { Icon } from '@/components/atoms/Icon';
import { ThemedText } from '@/components/themed-text';
import { useGetMe } from '@/query_hooks/useGetMe';
import { usePathname, useRouter } from 'expo-router';

export const TopNavigation: React.FC = () => {
  const { data: user, isLoading } = useGetMe();
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();

  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const isMobile = width < 768;
  const isATCActive = pathname.includes('ATCTrainingTab');
  const isProfileActive = pathname.includes('UserProfileTab');

  const getInitials = () => {
    if (!user?.firstName || !user?.lastName) return '?';
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };

  const closeMenus = () => {
    setShowAccountMenu(false);
  };

  const toggleAccountMenu = () => {
    setShowAccountMenu((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('@auth_token');
      closeMenus();
      router.replace('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleATCPress = () => {
    router.push('/(tabs)/ATCTrainingTab');
  };

  const handleProfilePress = () => {
    setShowAccountMenu(false);
    router.push('/(tabs)/UserProfileTab');
  };

  const handleHistoryPress = () => {
    setShowAccountMenu(false);
    router.push('/(tabs)/TrainingHistoryTab');
  };

  return (
    <View style={styles.root}>
      {showAccountMenu && (
        <Pressable style={styles.menuBackdrop} onPress={closeMenus} />
      )}

      <View style={styles.topRow}>
        <Image
          source={require('@/assets/images/EcoWhiskey.png')}
          style={{
            height: isMobile ? 50 : 60,
            width: isMobile ? 180 : 240,
          }}
        />

        <View style={styles.iconRow}>
          <View style={styles.iconWrapper}>
            <TouchableOpacity onPress={toggleAccountMenu} activeOpacity={0.7}>
              {isLoading ? (
                <Avatar.Icon size={40} icon='account' style={{ backgroundColor: '#e0e0e0' }} />
              ) : (
                <Avatar.Text
                  size={40}
                  label={getInitials()}
                  style={{ backgroundColor: '#000' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
              )}
            </TouchableOpacity>

            {showAccountMenu && (
              <View style={styles.dropdownMenu}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleProfilePress}
                  activeOpacity={0.7}
                >
                  <Icon type='MaterialIcons' name='person' size={20} color='#666' />
                  <ThemedText style={styles.menuItemText}>Perfil</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleHistoryPress}
                  activeOpacity={0.7}
                >
                  <Icon type='MaterialIcons' name='history' size={20} color='#666' />
                  <ThemedText style={styles.menuItemText}>Historial</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleLogout}
                  activeOpacity={0.7}
                >
                  <Icon type='MaterialIcons' name='logout' size={20} color='#666' />
                  <ThemedText style={styles.menuItemText}>Cerrar Sesion</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      {!isMobile && (
        <View style={styles.webTabsRow}>
          <View style={styles.webTabs}>
            <TouchableOpacity
              onPress={handleATCPress}
              activeOpacity={0.7}
              style={[
                styles.webTabButton,
                { borderBottomColor: isATCActive ? '#3d93d8' : 'transparent' },
              ]}
            >
              <View style={styles.webTabContent}>
                <Icon
                  type='FontAwesome5'
                  name='plane-departure'
                  size={20}
                  color={isATCActive ? '#2196F3' : '#666'}
                />
                <ThemedText
                  style={[
                    styles.webTabLabel,
                    {
                      fontWeight: isATCActive ? '600' : '400',
                      color: isATCActive ? '#2196F3' : '#666',
                    },
                  ]}
                >
                  ATC Practice
                </ThemedText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleProfilePress}
              activeOpacity={0.7}
              style={[
                styles.webTabButton,
                { borderBottomColor: isProfileActive ? '#2196F3' : 'transparent' },
              ]}
            >
              <View style={styles.webTabContent}>
                <Icon
                  type='MaterialIcons'
                  name='scoreboard'
                  size={20}
                  color={isProfileActive ? '#2196F3' : '#666'}
                />
                <ThemedText
                  style={[
                    styles.webTabLabel,
                    {
                      fontWeight: isProfileActive ? '600' : '400',
                      color: isProfileActive ? '#2196F3' : '#666',
                    },
                  ]}
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
  root: {
    backgroundColor: '#fff',
    position: 'relative',
    zIndex: 10,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    zIndex: 10,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 16,
  },
  iconWrapper: {
    position: 'relative',
    zIndex: 20,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 46,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    minWidth: 200,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 12,
    zIndex: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    columnGap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  webTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    zIndex: 1,
  },
  webTabs: {
    flexDirection: 'row',
    columnGap: 24,
    alignItems: 'center',
  },
  webTabButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 3,
  },
  webTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  webTabLabel: {
    fontSize: 16,
  },
});
