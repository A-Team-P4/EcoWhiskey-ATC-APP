import React from 'react';
import { Snackbar } from 'react-native-paper';

export type SnackbarType = 'success' | 'error' | 'info' | 'warning';

export interface AppSnackbarProps {
  visible: boolean;
  message: string;
  type?: SnackbarType;
  duration?: number;
  onDismiss: () => void;
  actionLabel?: string;
  onActionPress?: () => void;
}

const SNACKBAR_COLORS: Record<SnackbarType, string> = {
  success: '#4caf50',
  error: '#f44336',
  info: '#2196f3',
  warning: '#ff9800',
};

export const AppSnackbar: React.FC<AppSnackbarProps> = ({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onDismiss,
  actionLabel = 'Cerrar',
  onActionPress,
}) => {
  return (
    <Snackbar
      visible={visible}
      onDismiss={onDismiss}
      duration={duration}
      action={{
        label: actionLabel,
        onPress: onActionPress || onDismiss,
      }}
      style={{
        backgroundColor: SNACKBAR_COLORS[type],
      }}
    >
      {message}
    </Snackbar>
  );
};
