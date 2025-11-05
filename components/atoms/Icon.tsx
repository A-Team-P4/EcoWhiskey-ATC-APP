
import * as IconSets from '@expo/vector-icons';
import React from 'react';
import { GestureResponderEvent, TouchableOpacity, ViewStyle } from 'react-native';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  type?: keyof typeof IconSets; // any icon set exported by @expo/vector-icons
  onPress?: (event: GestureResponderEvent) => void; // optional press handler
  disabled?: boolean; // optional disabled state
  style?: ViewStyle; // optional additional style
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = '#1C1C1E',
  type = 'Ionicons',
  onPress,
  disabled = false,
  style,
}) => {
  const IconComponent = IconSets[type] as any;

  if (!IconComponent) {
    console.warn(`Icon set "${type}" not found. Falling back to Ionicons.`);
    return <IconSets.Ionicons name={name as any} size={size} color={color} />;
  }

  const iconElement = <IconComponent name={name as any} size={size} color={color} />;

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={disabled ? undefined : onPress}
        activeOpacity={0.7}
        style={[style, disabled && { opacity: 0.4 }]}
      >
        {iconElement}
      </TouchableOpacity>
    );
  }

  return iconElement;
};

