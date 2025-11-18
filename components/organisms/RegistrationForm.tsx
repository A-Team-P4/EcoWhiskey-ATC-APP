import { RegistrationData } from '@/interfaces/user';
import { useSchools } from '@/query_hooks/useUserProfile';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Spacer } from '../atoms/Spacer';
import { Typography } from '../atoms/Typography';
import { ActionButton } from '../molecules/ActionButton';
import { Dropdown } from '../molecules/Dropdown';
import { FormInput } from '../molecules/FormInput';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  school?: string;
}




interface RegistrationFormProps {
  onSubmit: (data: RegistrationData) => Promise<void>;
  isLoading?: boolean;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSubmit, isLoading = false }) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const router = useRouter();
  const {
    data: schoolsResponse = [],
    isLoading: isSchoolsLoading,
    isError: isSchoolsError,
    error: schoolsError,
  } = useSchools();

  //* Hooks
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [school, setSchool] = useState('');
  const [accountType, setAccountType] = useState<'student' | 'instructor'>('student');
  const [errors, setErrors] = useState<FormErrors>({});
  const schoolOptions = useMemo(
    () =>
      schoolsResponse.map((school) => ({
        label: school.location ? `${school.name} - ${school.location}` : school.name,
        value: String(school.id),
      })),
    [schoolsResponse]
  );

  useEffect(() => {
    setSchool((prevSchool) => {
      if (!prevSchool) {
        return prevSchool;
      }

      const exists = schoolOptions.some((option) => option.value === prevSchool);
      return exists ? prevSchool : '';
    });
  }, [schoolOptions]);

  useEffect(() => {
    if (accountType === 'student') {
      setSchool('');
      setErrors((prev) => ({ ...prev, school: undefined }));
    }
  }, [accountType]);

  const schoolPlaceholder = isSchoolsLoading
    ? 'Cargando escuelas...'
    : isSchoolsError
      ? 'No se pudieron cargar las escuelas'
      : 'Selecciona tu instituciA3n educativa';

  const schoolsLoadErrorMessage = isSchoolsError
    ? schoolsError instanceof Error && schoolsError.message
      ? schoolsError.message
      : 'No se pudo cargar la lista de escuelas'
    : undefined;

  const schoolFieldError = errors.school ?? schoolsLoadErrorMessage;

  const disableSchoolDropdown =
    isSchoolsLoading || (!!schoolsLoadErrorMessage && schoolOptions.length === 0);

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

    const trimmedSchool = school.trim();
    const normalizedSchool =
      accountType === 'instructor' && trimmedSchool
        ? /^\d+$/.test(trimmedSchool)
          ? Number(trimmedSchool)
          : trimmedSchool
        : undefined;

    const registrationData: RegistrationData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      password,
      accountType,
      ...(normalizedSchool !== undefined && { schoolId: normalizedSchool }),
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
      {/* Account Type Toggle */}
      <View style={{ marginBottom: 20 }}>
        <Typography variant="body" style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' }}>
          Tipo de cuenta
        </Typography>
        <View style={formStyles.toggleContainer}>
          <TouchableOpacity
            style={[
              formStyles.toggleButton,
              accountType === 'student' && formStyles.toggleButtonActive,
            ]}
            onPress={() => setAccountType('student')}
            activeOpacity={0.7}
          >
            <Typography
              variant="body"
              style={[
                formStyles.toggleButtonText,
                accountType === 'student' && formStyles.toggleButtonTextActive,
              ]}
            >
              Estudiante
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              formStyles.toggleButton,
              accountType === 'instructor' && formStyles.toggleButtonActive,
            ]}
            onPress={() => setAccountType('instructor')}
            activeOpacity={0.7}
          >
            <Typography
              variant="body"
              style={[
                formStyles.toggleButtonText,
                accountType === 'instructor' && formStyles.toggleButtonTextActive,
              ]}
            >
              Instructor
            </Typography>
          </TouchableOpacity>
        </View>
      </View>

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
        
        {accountType === 'instructor' && (
          <Dropdown
            label="Escuela"
            value={school}
            onSelect={handleSchoolChange}
            options={schoolOptions}
            error={schoolFieldError}
            required
            placeholder={schoolPlaceholder}
            disabled={disableSchoolDropdown}
          />
        )}
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
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#2196F3',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
});
