import { useState } from 'react';
import { SnackbarType } from '@/components/molecules/AppSnackbar';

interface SnackbarState {
  visible: boolean;
  message: string;
  type: SnackbarType;
}

export const useSnackbar = () => {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showSnackbar = (message: string, type: SnackbarType = 'info') => {
    setSnackbar({ visible: true, message, type });
  };

  const hideSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, visible: false }));
  };

  return {
    snackbar,
    showSnackbar,
    hideSnackbar,
  };
};
