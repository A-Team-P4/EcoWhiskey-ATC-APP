import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Icon } from '../atoms/Icon';
import { Spacer } from '../atoms/Spacer';
import { Typography } from '../atoms/Typography';
import { ActionButton } from '../molecules/ActionButton';
import { FormInput } from '../molecules/FormInput';

interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ChangePasswordErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

interface ChangePasswordFormProps {
  onSubmit: (values: ChangePasswordFormValues) => Promise<void>;
  isLoading?: boolean;
}

const MIN_PASSWORD_LENGTH = 8;

export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const [values, setValues] = useState<ChangePasswordFormValues>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<ChangePasswordErrors>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const validate = (): boolean => {
    const nextErrors: ChangePasswordErrors = {};

    if (!values.currentPassword) {
      nextErrors.currentPassword = 'Ingresa tu contraseña actual';
    }

    if (!values.newPassword) {
      nextErrors.newPassword = 'Ingresa una nueva contraseña';
    } else if (values.newPassword.length < MIN_PASSWORD_LENGTH) {
      nextErrors.newPassword = 'Debe tener al menos 8 caracteres';
    }

    if (!values.confirmPassword) {
      nextErrors.confirmPassword = 'Confirma tu nueva contraseña';
    } else if (values.newPassword !== values.confirmPassword) {
      nextErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleFieldChange = (field: keyof ChangePasswordFormValues, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }));
    if (errors[field] && value.trim()) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await onSubmit(values);
      setValues({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setErrors({});
    } catch (error) {
      console.error('Failed to change password', error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => setIsExpanded(prev => !prev)}
        activeOpacity={0.85}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTextWrapper}>
            <Typography variant="h3" style={styles.heading}>
              Seguridad
            </Typography>
            <Typography variant="body" style={styles.subheading}>
              Cambia tu contraseña con al menos 8 caracteres.
            </Typography>
          </View>
          <View style={styles.iconContainer}>
            <Icon
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={22}
              color="#1C1C1E"
            />
          </View>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <>
          <Spacer size={16} />

          <FormInput
            label="Contraseña actual"
            value={values.currentPassword}
            onChangeText={(value) => handleFieldChange('currentPassword', value)}
            error={errors.currentPassword}
            secureTextEntry
            enableFocusControl
            leftIconName="lock"
          />

          <FormInput
            label="Nueva contraseña"
            value={values.newPassword}
            onChangeText={(value) => handleFieldChange('newPassword', value)}
            error={errors.newPassword}
            secureTextEntry
            enableFocusControl
            leftIconName="vpn-key"
          />

          <FormInput
            label="Confirmar contraseña"
            value={values.confirmPassword}
            onChangeText={(value) => handleFieldChange('confirmPassword', value)}
            error={errors.confirmPassword}
            secureTextEntry
            enableFocusControl
            leftIconName="check-circle"
          />

          <Spacer size={12} />

          <ActionButton
            title={isLoading ? 'Actualizando...' : 'Cambiar contraseña'}
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            iconName="lock"
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 12,
    padding: 20,
    gap: 12,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  headerTextWrapper: {
    flex: 1,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
  },
  subheading: {
    opacity: 0.7,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  iconContainer: {
    marginLeft: 12,
    paddingTop: 2,
  },
});
