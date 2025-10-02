import React, { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Spacer } from '../atoms/Spacer';
import { Typography } from '../atoms/Typography';
import { ActionButton } from '../molecules/ActionButton';
import { Dropdown } from '../molecules/Dropdown';
import { FormInput } from '../molecules/FormInput';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  school?: string;
}

interface UserProfileData {
  firstName: string;
  lastName: string;
  email: string;
  accountType: 'student' | 'instructor';
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

interface UserProfileFormProps {
  userData: UserProfileData;
  onSubmit: (data: Partial<UserProfileData>) => Promise<void>;
  isLoading?: boolean;
}

export const UserProfileForm: React.FC<UserProfileFormProps> = ({
  userData,
  onSubmit,
  isLoading = false
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  //* Hooks
  const [firstName, setFirstName] = useState(userData.firstName);
  const [lastName, setLastName] = useState(userData.lastName);
  const [school, setSchool] = useState(userData.school || '');
  const [errors, setErrors] = useState<FormErrors>({});

  //* Helpers
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!firstName.trim()) newErrors.firstName = 'El nombre es requerido';
    if (!lastName.trim()) newErrors.lastName = 'El apellido es requerido';

    if (userData.accountType === 'instructor' && !school.trim()) {
      newErrors.school = 'La escuela es requerida para instructores';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  //* Handlers
  const handleUpdate = async () => {
    if (!validateForm()) return;

    const updateData: Partial<UserProfileData> = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      ...(school.trim() && { school: school.trim() })
    };

    await onSubmit(updateData);
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

  const handleSchoolChange = (value: string) => {
    setSchool(value);
    if (errors.school && value.trim()) {
      setErrors(prev => ({ ...prev, school: undefined }));
    }
  };

  return (
    <View style={formStyles.container}>
      {/* Profile Header */}
      <View style={formStyles.header}>
        <Typography variant="h2" style={formStyles.headerTitle}>
          Mi Perfil
        </Typography>
        <Typography variant="body" style={formStyles.headerSubtitle}>
          Actualiza tu información personal
        </Typography>
      </View>

      <Spacer size={24} />

      {/* Non-editable fields */}
      <View style={formStyles.infoSection}>
        <View style={formStyles.infoRow}>
          <Typography variant="caption" style={formStyles.infoLabel}>
            Correo electrónico
          </Typography>
          <Typography variant="body" style={formStyles.infoValue}>
            {userData.email}
          </Typography>
        </View>

        <View style={formStyles.infoRow}>
          <Typography variant="caption" style={formStyles.infoLabel}>
            Tipo de cuenta
          </Typography>
          <Typography variant="body" style={formStyles.infoValue}>
            {userData.accountType === 'student' ? 'Estudiante' : 'Instructor'}
          </Typography>
        </View>
      </View>

      <Spacer size={24} />

      {/* Editable fields */}
      <View style={formStyles.formFields}>
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

        <Dropdown
          label="Escuela"
          value={school}
          onSelect={handleSchoolChange}
          options={schoolOptions}
          error={errors.school}
          required={userData.accountType === 'instructor'}
          placeholder="Selecciona tu institución educativa"
          searchable={true}
        />
      </View>

      <Spacer size={32} />

      <View style={isMobile ? formStyles.buttonContainerMobile : formStyles.buttonContainerDesktop}>
        <ActionButton
          title={isLoading ? 'Actualizando...' : 'Guardar cambios'}
          onPress={handleUpdate}
          loading={isLoading}
          disabled={isLoading}
        />
      </View>
    </View>
  );
};

const formStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    opacity: 0.6,
  },
  infoSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoRow: {
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
  },
  formFields: {
    gap: 16,
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
    alignSelf: 'flex-end',
    minWidth: 200,
    maxWidth: 300,
  },
});
