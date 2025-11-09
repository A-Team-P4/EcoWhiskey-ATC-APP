import { LoginCredentials } from '@/interfaces/user';
import { requestPasswordReset } from '@/services/apiClient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Modal, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Icon } from '../atoms/Icon';
import { Spacer } from '../atoms/Spacer';
import { Typography } from '../atoms/Typography';
import { ActionButton } from '../molecules/ActionButton';
import { FormInput } from '../molecules/FormInput';

interface FormErrors {
  email?: string;
  password?: string;
}

interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  isLoading?: boolean;
  serverError?: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, isLoading = false, serverError }) => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isResetModalVisible, setIsResetModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailError, setResetEmailError] = useState<string | undefined>();
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [resetSubmitError, setResetSubmitError] = useState<string | null>(null);

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = 'El correo es requerido';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Formato de correo invalido';
    }

    if (!password) {
      newErrors.password = 'La contrasena es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    await onSubmit({
      email: email.trim().toLowerCase(),
      password,
    });
  };

  const handleOpenResetModal = () => {
    setResetEmail('');
    setResetEmailError(undefined);
    setResetSubmitError(null);
    setIsResetModalVisible(true);
  };

  const handleCloseResetModal = () => {
    setIsResetModalVisible(false);
    setResetSubmitError(null);
  };

  const handleResetPassword = async () => {
    const trimmedEmail = resetEmail.trim().toLowerCase();

    if (!trimmedEmail) {
      setResetEmailError('El correo es requerido');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setResetEmailError('Formato de correo invalido');
      return;
    }

    setResetSubmitError(null);
    setIsResetSubmitting(true);
    try {
      const response = await requestPasswordReset(trimmedEmail);
      Alert.alert('Recuperacion de contrasena', response.message);
      setResetEmail('');
      setIsResetModalVisible(false);
    } catch (catchError) {
      const fallbackMessage = 'No pudimos procesar tu solicitud. Intenta de nuevo mas tarde.';
      const errorWithResponse =
        typeof catchError === 'object' && catchError !== null && 'response' in catchError
          ? (catchError as { response?: { data?: { detail?: unknown } } }).response
          : undefined;
      const apiDetail =
        typeof errorWithResponse?.data?.detail === 'string' ? errorWithResponse.data.detail : null;
      const genericMessage =
        catchError instanceof Error && catchError.message ? catchError.message : null;

      setResetSubmitError(apiDetail ?? genericMessage ?? fallbackMessage);
    } finally {
      setIsResetSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/EcoWhiskey.png')}
          style={[styles.logo, isWeb && styles.logoWeb]}
          //resizeMode="contain"
        />
      </View>

      <Spacer size={32} />

      <Typography variant="h1" style={styles.title}>Bienvenido</Typography>
      <Spacer size={8} />
      <Typography variant="body" style={styles.subtitle}>
        Ingresa tus credenciales para continuar
      </Typography>

      <Spacer size={24} />

      <FormInput
        label="Correo electronico"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          if (errors.email) {
            setErrors((prev) => ({ ...prev, email: undefined }));
          }
        }}
        error={errors.email}
        required
        keyboardType="email-address"
      />

      <FormInput
        label="Contrasena"
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          if (errors.password) {
            setErrors((prev) => ({ ...prev, password: undefined }));
          }
        }}
        error={errors.password}
        required
        secureTextEntry
      />
      



      {serverError ? (
        <Typography variant="caption" style={styles.serverError}>
          {serverError}
        </Typography>
      ) : (
        <Spacer size={4} />
      )}

      <Spacer size={12} />

      <ActionButton
        title={isLoading ? 'Iniciando sesion...' : 'Iniciar sesion'}
        onPress={handleSubmit}
        loading={isLoading}
        disabled={isLoading}
      />

      <View style={styles.forgotPasswordContainer}>
        <TouchableOpacity onPress={handleOpenResetModal} disabled={isLoading}>
          <Typography variant="caption" style={styles.forgotPasswordLink}>
            Olvidaste tu contrasena?
          </Typography>
        </TouchableOpacity>
      </View>

      <Spacer size={16} />

      <View style={styles.switchContainer}>
        <Typography variant="caption">¿Necesitas una cuenta?</Typography>
        <TouchableOpacity onPress={() => router.replace('/register')} disabled={isLoading}>
          <Typography variant="caption" style={styles.switchLink}>
            Crea una cuenta
          </Typography>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isResetModalVisible}
        animationType="fade"
        transparent
        onRequestClose={handleCloseResetModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContainer, isWeb && styles.modalContainerWeb]}>
            <View style={styles.modalHeader}>
              <Typography variant="h2" style={styles.modalTitle}>
                Recuperar contrasena
              </Typography>
              <TouchableOpacity
                onPress={handleCloseResetModal}
                style={styles.modalCloseButton}
                accessibilityRole="button"
              >
                <Icon type="MaterialIcons" name="close" color="#000" size={24} />
              </TouchableOpacity>
            </View>
            <Spacer size={8} />
            <Typography variant="body" style={styles.modalSubtitle}>
              Ingresa el correo asociado a tu cuenta para recibir instrucciones.
            </Typography>
            <Spacer size={16} />
            <FormInput
              label="Correo electronico"
              value={resetEmail}
              onChangeText={(value) => {
                setResetEmail(value);
                if (resetEmailError) {
                  setResetEmailError(undefined);
                }
                if (resetSubmitError) {
                  setResetSubmitError(null);
                }
              }}
              error={resetEmailError}
              required
              keyboardType="email-address"
            />
            <Spacer size={16} />
            <ActionButton
              title={isResetSubmitting ? 'Enviando...' : 'Enviar instrucciones'}
              onPress={handleResetPassword}
              loading={isResetSubmitting}
            />
            {resetSubmitError ? (
              <Typography variant="caption" style={styles.modalError}>
                {resetSubmitError}
              </Typography>
            ) : null}
            <Spacer size={12} />
            <TouchableOpacity onPress={handleCloseResetModal}>
              <Typography variant="caption" style={styles.modalCancelLink}>
                Cancelar
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logo: {
    width: 250,
    height: 80,
  },
  logoWeb: {
    width: 350,
    height: 110,
  },
  title: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#666666',
    textAlign: 'center',
  },
  serverError: {
    color: '#ef4444',
    marginTop: 4,
  },
  switchContainer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  switchLink: {
    color: '#2196F3',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordLink: {
    color: '#2196F3',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    maxWidth: 420,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContainerWeb: {
    maxWidth: 400,
  },
  modalTitle: {
    textAlign: 'center',
    fontWeight: '700',
  },
  modalSubtitle: {
    textAlign: 'center',
    color: '#4b5563',
  },
  modalError: {
    marginTop: 8,
    textAlign: 'center',
    color: '#ef4444',
  },
  modalCancelLink: {
    textAlign: 'center',
    color: '#6b7280',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
});
