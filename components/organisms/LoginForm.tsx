import { LoginCredentials } from '@/interfaces/user';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
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

      <Spacer size={16} />

      <View style={styles.switchContainer}>
        <Typography variant="caption">¿Necesitas una cuenta?</Typography>
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
});
