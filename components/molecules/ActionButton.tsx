import React from 'react';
import { Button } from 'react-native-paper';

import { Icon } from '../atoms/Icon';

interface ActionButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  iconName?: string;
  iconType?: React.ComponentProps<typeof Icon>['type'];
  iconColor?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  iconName,
  iconType = 'MaterialIcons',
  iconColor,
}) => {
  const getButtonClassName = () => {
    switch (variant) {
      case 'primary':
        return 'rounded-md bg-black ';
      case 'secondary':
        return 'rounded-md bg-gray-400';
      case 'outline':
        return 'rounded-md border-black';
      default:
        return 'rounded-md bg-black ';
    }
  };

  const getButtonMode = () => {
    switch (variant) {
      case 'primary':
        return 'contained';
      case 'secondary':
        return 'contained';
      case 'outline':
        return 'outlined';
      default:
        return 'contained';
    }
  };

  const customTheme = {
    colors: {
      primary: '#000000',
      onPrimary: '#FFFFFF',
      primaryContainer: '#333333',
      onPrimaryContainer: '#FFFFFF',
      outline: '#000000',
    },
  };

  const getLabelColor = () => {
    switch (variant) {
      case 'outline':
        return '#000000';
      case 'secondary':
        return '#FFFFFF';
      default:
        return '#FFFFFF';
    }
  };

  const resolvedIconColor = iconColor ?? (variant === 'outline' ? '#000000' : '#FFFFFF');

  const renderIcon = iconName
    ? () => (
        <Icon
          name={iconName}
          type={iconType}
          size={20}
          color={resolvedIconColor}
        />
      )
    : undefined;

  return (
    <Button
      mode={getButtonMode()}
      onPress={onPress}
      className={getButtonClassName()}
      contentStyle={{ paddingVertical: 8 }}
      labelStyle={{ fontSize: 17, fontWeight: '600', color: getLabelColor() }}
      loading={loading}
      disabled={disabled || loading}
      icon={renderIcon}
      theme={customTheme}
    >
      {title}
    </Button>
  );
};
