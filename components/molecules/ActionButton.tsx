import React from 'react';
import { StyleSheet } from 'react-native';
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
  const getButtonStyle = () => {
    switch (variant) {
      case 'primary': return buttonStyles.primaryButton;
      case 'secondary': return buttonStyles.secondaryButton;
      case 'outline': return buttonStyles.outlineButton;
      default: return buttonStyles.primaryButton;
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
      style={getButtonStyle()}
      contentStyle={buttonStyles.buttonContent}
      labelStyle={buttonStyles.buttonLabel}
      loading={loading}
      disabled={disabled || loading}
      icon={icon}
      theme={customTheme}
    >
      {title}
    </Button>
  );
};

const buttonStyles = StyleSheet.create({
  primaryButton: {
    borderRadius: 12,
    backgroundColor: '#000000', 
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  secondaryButton: {
    borderRadius: 12,
    backgroundColor: '#8E8E93',
  },
  outlineButton: {
    borderRadius: 12,
    borderColor: '#000000', 
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF', 
  },
});