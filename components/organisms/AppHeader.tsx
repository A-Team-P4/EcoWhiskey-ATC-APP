import React from 'react';
import { Platform, StatusBar, TouchableOpacity, View } from 'react-native';
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-200" style={{ paddingTop: Platform.OS === 'ios' ? 16 : StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 40 }}>
        <View className="w-9 items-start">
          {showBackButton && onBackPress && (
            <TouchableOpacity onPress={onBackPress} className="p-1">
              <Icon name="chevron-back" size={28} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>
        
        <Typography variant="h3">{title}</Typography>
        
        <View className="w-9 items-end">
          {rightElement}
        </View>
      </View>
    </>
  );
};

