import React from 'react';
import { Platform, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icon } from '../atoms/Icon';
import { Typography } from '../atoms/Typography';

interface AppHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightElement?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBackButton = false,
  onBackPress,
  rightElement
}) => {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <View style={headerStyles.header}>
        <View style={headerStyles.leftElement}>
          {showBackButton && onBackPress && (
            <TouchableOpacity onPress={onBackPress} style={headerStyles.backButton}>
              <Icon name="chevron-back" size={28} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>
        
        <Typography variant="h3" style={headerStyles.headerTitle}>{title}</Typography>
        
        <View style={headerStyles.rightElement}>
          {rightElement}
        </View>
      </View>
    </>
  );
};

const headerStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
    paddingTop: Platform.OS === 'ios' ? 16 : StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 40,
  },
  leftElement: {
    width: 36,
    alignItems: 'flex-start',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  rightElement: {
    width: 36,
    alignItems: 'flex-end',
  },
});