import { RegistrationData } from '@/interfaces/user';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Spacer } from '../atoms/Spacer';
import { Typography } from '../atoms/Typography';
import { ActionButton } from '../molecules/ActionButton';
import { Dropdown } from '../molecules/Dropdown';
import { FormInput } from '../molecules/FormInput';
import { SegmentedControl } from '../molecules/SegmentedControl';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  school?: string;
}



const schoolOptions = [
  { label: 'AENSA - Academia de Enseñanza Aeronáutica', value: 'aensa', location: 'San José' },
  { label: 'Escuela Costarricense de Aviación (ECDEA)', value: 'ecdea', location: 'San José' },
  { label: 'CPEA Flight School S.A.', value: 'cpea', location: 'San José' },
  { label: 'Instituto de Formación Aeronáutica (IFA)', value: 'ifa', location: 'San José' },
  { label: 'Aerotica Escuela de Aviación', value: 'aerotica', location: 'San José' },
  { label: 'Aeroformación S.A.', value: 'aeroformacion', location: 'San José' },
  { label: 'ITAérea - Escuela Aeronáutica', value: 'itaerea', location: 'Heredia' },
  { label: 'Aerobell Flight School', value: 'aerobell', location: 'San José' },
  { label: 'Learn Robotix Academy S.A.', value: 'learnrobotix', location: 'San José' },
  { label: 'Fly With Us S.A. (Ultraligeros)', value: 'flywithus', location: 'San José' },
  { label: 'Seabreeze Aviation Costa Rica', value: 'seabreeze', location: 'San José' },
  { label: 'Costa Air Service', value: 'costaair', location: 'San José' },
  { label: 'Escuelas de Aviación Costa Rica', value: 'escuelasaviacioncr', location: 'San José' },
  { label: 'Otra institución', value: 'other' }
];

interface RegistrationFormProps {
  onSubmit: (data: RegistrationData) => Promise<void>;
  isLoading?: boolean;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSubmit, isLoading = false }) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const router = useRouter();

  //* Hooks
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [school, setSchool] = useState('');
  const [accountType, setAccountType] = useState<'student' | 'instructor'>('student');
  const [errors, setErrors] = useState<FormErrors>({});

  //* Helpers
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const validatePassword = (password: string): boolean => {
    return password.length >= 8 && /(?=.*[a-zA-Z])(?=.*\d)/.test(password);
  };
  
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!firstName.trim()) newErrors.firstName = 'El nombre es requerido';
    if (!lastName.trim()) newErrors.lastName = 'El apellido es requerido';
    if (!email.trim()) newErrors.email = 'El correo es requerido';
    else if (!validateEmail(email)) newErrors.email = 'Formato de correo inválido';
    if (!password) newErrors.password = 'La contraseña es requerida';
    else if (!validatePassword(password)) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres, incluyendo letras y números';
    }
    if (!confirmPassword) newErrors.confirmPassword = 'La confirmación de contraseña es requerida';
    else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    if (accountType === 'instructor' && !school.trim()) {
      newErrors.school = 'La escuela es requerida para instructores';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  //* Handlers
  const handleRegister = async () => {
    if (!validateForm()) return;

    const registrationData: RegistrationData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      password,
      accountType,
      ...(school.trim() && { school: school.trim() })
    };

    await onSubmit(registrationData);
  };

  const handleFirstNameChange = (value: string) => {
    setFirstName(value);
    if (errors.firstName && value.trim()) {
      setErrors(prev => ({ ...prev, firstName: undefined }));
    }
  };
  
  const handleLastNameChange = (value: string) => {
    setLastName(value);
    if (errors.lastName && value.trim()) {
      setErrors(prev => ({ ...prev, lastName: undefined }));
    }
  };
  
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (errors.email && value.trim() && validateEmail(value)) {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  };
  
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password && validatePassword(value)) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
    if (confirmPassword && value === confirmPassword && errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  };
  
  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (errors.confirmPassword && value === password) {
      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  };
  
  const handleSchoolChange = (value: string) => {
    setSchool(value);
    if (errors.school && value.trim()) {
      setErrors(prev => ({ ...prev, school: undefined }));
    }
  };

  return (
    <View style={formStyles.container}>
      <SegmentedControl
        title="Tipo de cuenta"
        value={accountType}
        onValueChange={setAccountType}
        options={[
          { value: 'student', label: 'Estudiante' },
          { value: 'instructor', label: 'Instructor' },
        ]}
      />
      
      <View style={formStyles.formFields}>
        {/* Name fields */}
        <View style={isMobile ? formStyles.fieldGroup : formStyles.fieldRow}>
          <View style={isMobile ? {} : formStyles.flexField}>
            <FormInput
              label="Nombre"
              value={firstName}
              onChangeText={handleFirstNameChange}
              error={errors.firstName}
              required
              autoCapitalize="words"
            />
          </View>
          
          <View style={isMobile ? {} : formStyles.flexField}>
            <FormInput
              label="Apellido"
              value={lastName}
              onChangeText={handleLastNameChange}
              error={errors.lastName}
              required
              autoCapitalize="words"
            />
          </View>
        </View>
        
        <FormInput
          label="Correo electrónico"
          value={email}
          onChangeText={handleEmailChange}
          error={errors.email}
          required
          keyboardType="email-address"
        />
        
        {/* Password fields */}
        <View style={isMobile ? formStyles.fieldGroup : formStyles.fieldRow}>
          <View style={isMobile ? {} : formStyles.flexField}>
            <FormInput
              label="Contraseña"
              value={password}
              onChangeText={handlePasswordChange}
              error={errors.password}
              required
              secureTextEntry
            />
          </View>
          
          <View style={isMobile ? {} : formStyles.flexField}>
            <FormInput
              label="Confirmar contraseña"
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              error={errors.confirmPassword}
              required
              secureTextEntry
            />
          </View>
        </View>
        
        <Dropdown
          label="Escuela"
          value={school}
          onSelect={handleSchoolChange}
          options={schoolOptions}
          error={errors.school}
          required={accountType === 'instructor'}
          placeholder="Selecciona tu institución educativa"
        
        />
      </View>
      
      <Spacer size={4} />
      
      <View style={isMobile ? formStyles.buttonContainerMobile : formStyles.buttonContainerDesktop}>
        <ActionButton
          title={isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
          onPress={handleRegister}
          loading={isLoading}
          disabled={isLoading}
        />
      </View>

      <Spacer size={16} />

      <View style={{ alignItems: 'center', flexDirection:'row', justifyContent:'center', gap:6, marginTop: 16 }}>
        <Typography variant="caption">¿Ya tienes cuenta?</Typography>
        <TouchableOpacity onPress={() => router.replace('/login')} disabled={isLoading} >
          <Typography variant="caption" style={{ color: '#2196F3',fontWeight: '600', textDecorationLine: 'underline', opacity: isLoading ? 0.5 : 1 }} >
             Inicia sesión
          </Typography>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const formStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formFields: {
    marginBottom: 20,
  },
  fieldGroup: {
    // Default: stacked vertically (mobile)
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 16,
  },
  flexField: {
    flex: 1,
  },
  buttonContainerMobile: {
    // Full width on mobile (default behavior)
  },
  buttonContainerDesktop: {
    alignSelf: 'flex-end', // Justify to the right
    minWidth: 200, // Minimum width for the button
    maxWidth: 300, // Maximum width to prevent it from being too wide
  },
});