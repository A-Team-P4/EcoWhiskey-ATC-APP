// components/atoms/Icon.tsx
import {
  Entypo,
  FontAwesome5,
  Foundation,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons
} from '@expo/vector-icons';
import React from 'react';
import { GestureResponderEvent, Text as RNText, TouchableOpacity, ViewStyle } from 'react-native';



const IconMap = {
  MaterialIcons,
  Ionicons,
  Foundation,
  MaterialCommunityIcons,
  FontAwesome5,
  Entypo
} as const;


type IconSetName = keyof typeof IconMap;

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  type?: IconSetName;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  style?: ViewStyle;
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
  const Pack = IconMap[type];

  // Si el set no existe (no debería pasar porque limitamos IconSetName), fallback seguro:
  if (!Pack) {
    return <RNText accessibilityLabel="icon-pack-missing">?</RNText>;
  }

  let element: React.ReactNode;
  try {
    // @ts-ignore: confiar en runtime; si "name" es inválido, el try/catch nos salva
    element = <Pack name={name as any} size={size} color={color} />;
  } catch {
    element = <RNText accessibilityLabel={`icon-${type}-${name}-missing`}>?</RNText>;
  }

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={disabled ? undefined : onPress}
        activeOpacity={0.7}
        style={[style, disabled && { opacity: 0.4 }]}
      >
        {element}
      </TouchableOpacity>
    );
  }

  return <>{element}</>;
};
