import { LoginCredentials } from '@/interfaces/user';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

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

  return (
    <View style={styles.container}>
      <Typography variant="h1">Bienvenido</Typography>
      <Spacer size={8} />
      <Typography variant="body" style={styles.subtitle}>
        Ingresa tus credenciales para continuar
      </Typography>

      <Spacer size={16} />

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

      <Spacer size={16} />

      <View style={styles.switchContainer}>
        <Typography variant="caption">Necesitas una cuenta?</Typography>
        <TouchableOpacity onPress={() => router.replace('/register')} disabled={isLoading}>
          <Typography variant="caption" style={styles.switchLink}>
            Crea una cuenta
          </Typography>
        </TouchableOpacity>
      </View>

      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginTop: 32,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  subtitle: {
    color: '#333333',
  },
  serverError: {
    color: '#ef4444',
    marginTop: 4,
  },
  switchContainer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  switchLink: {
    color: '#000000',
    textDecorationLine: 'underline',
  },
});
