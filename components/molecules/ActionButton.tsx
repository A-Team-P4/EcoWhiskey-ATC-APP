import React from 'react';
import { Button } from 'react-native-paper';

interface ActionButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon
}) => {
  const getButtonClassName = () => {
    switch (variant) {
      case 'primary': return 'rounded-md bg-black shadow-lg';
      case 'secondary': return 'rounded-md bg-gray-400';
      case 'outline': return 'rounded-md border-black';
      default: return 'rounded-md bg-black shadow-lg';
    }
  };

  const getButtonMode = () => {
    switch (variant) {
      case 'primary': return 'contained';
      case 'secondary': return 'contained';
      case 'outline': return 'outlined';
      default: return 'contained';
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

  return (
    <Button
      mode={getButtonMode()}
      onPress={onPress}
      className={getButtonClassName()}
      contentStyle={{ paddingVertical: 8 }}
      labelStyle={{ fontSize: 17, fontWeight: '600', color: '#FFFFFF' }}
      loading={loading}
      disabled={disabled || loading}
      icon={icon}
      theme={customTheme}
    >
      {title}
    </Button>
  );
};

