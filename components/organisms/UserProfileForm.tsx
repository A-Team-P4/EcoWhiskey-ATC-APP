import { GroupResponse } from '@/interfaces/group';
import { School, User } from '@/interfaces/user';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Spacer } from '../atoms/Spacer';
import { Typography } from '../atoms/Typography';
import { ActionButton } from '../molecules/ActionButton';
import { Dropdown } from '../molecules/Dropdown';
import { FormInput } from '../molecules/FormInput';

const toPreviewSource = (value?: string | null) => {
  if (!value) return null;
  if (value.startsWith('data:') || value.startsWith('http') || value.startsWith('file:')) {
    return value;
  }
  return `data:image/jpeg;base64,${value}`;
};

interface FormErrors {
  firstName?: string;
  lastName?: string;
  school?: string;
}

type UserProfileData = Pick<
  User,
  'firstName' | 'lastName' | 'email' | 'accountType' | 'school' | 'photo' | 'group'
>;

type ProfileFormSubmitPayload = {
  firstName?: string;
  lastName?: string;
  schoolId?: string;
  photo?: string | null;
};

interface UserProfileFormProps {
  userData: UserProfileData;
  schools: School[];
  userGroups?: GroupResponse[];
  onSubmit: (data: ProfileFormSubmitPayload) => Promise<void>;
  isLoading?: boolean;
  isSchoolLoading?: boolean;
  isGroupsLoading?: boolean;
  lockSchoolSelection?: boolean;
  lockSchoolReason?: string;
  canLeaveGroup?: boolean;
  onLeaveGroup?: () => Promise<void> | void;
  leaveGroupLoading?: boolean;
}
export const UserProfileForm: React.FC<UserProfileFormProps> = ({
  userData,
  schools,
  userGroups,
  onSubmit,
  isLoading = false,
  isSchoolLoading = false,
  isGroupsLoading = false,
  lockSchoolSelection = false,
  lockSchoolReason,
  canLeaveGroup = false,
  onLeaveGroup,
  leaveGroupLoading = false,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  //* Hooks
  const [firstName, setFirstName] = useState(userData.firstName);
  const [lastName, setLastName] = useState(userData.lastName);
  const [schoolId, setSchoolId] = useState(userData.school?.id ?? '');
  const [errors, setErrors] = useState<FormErrors>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(toPreviewSource(userData.photo));
  const [photoPayload, setPhotoPayload] = useState<string | null | undefined>(undefined);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isSelectingPhoto, setIsSelectingPhoto] = useState(false);
  const normalizedGroups = userGroups ?? [];

  const formatMembershipText = (label?: string) => {
    if (!label) return null;
    const normalized = label.toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  const schoolOptions = useMemo(() => {
    const baseOptions = schools.map((school) => ({
      label: school.location ? `${school.name} - ${school.location}` : school.name,
      value: school.id,
    }));

    const hasCurrentSchool =
      !userData.school?.id ||
      baseOptions.some((option) => option.value === userData.school?.id);

    if (userData.school?.id && !hasCurrentSchool) {
      baseOptions.unshift({
        label: userData.school.name ?? userData.school.id,
        value: userData.school.id,
      });
    }

    return baseOptions;
  }, [schools, userData.school]);

  const schoolPlaceholder = isSchoolLoading
    ? 'Cargando escuelas...'
    : 'Selecciona tu institución educativa';

  const disableSubmit =
    isLoading ||
    (!lockSchoolSelection &&
      userData.accountType === 'instructor' &&
      (isSchoolLoading || schoolOptions.length === 0));

  useEffect(() => {
    setFirstName(userData.firstName);
    setLastName(userData.lastName);
    setSchoolId(userData.school?.id ?? '');
    setPhotoPreview(toPreviewSource(userData.photo));
    setPhotoPayload(undefined);
    setPhotoError(null);
  }, [userData.firstName, userData.lastName, userData.photo, userData.school]);

  //* Helpers
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!firstName.trim()) newErrors.firstName = 'El nombre es requerido';
    if (!lastName.trim()) newErrors.lastName = 'El apellido es requerido';

    if (userData.accountType === 'instructor' && !schoolId) {
      newErrors.school = 'La escuela es requerida para instructores';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  //* Handlers
  const handleUpdate = async () => {
    if (!validateForm()) return;

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const currentSchoolId = userData.school?.id ?? '';

    const updateData: ProfileFormSubmitPayload = {};

    if (trimmedFirstName && trimmedFirstName !== userData.firstName) {
      updateData.firstName = trimmedFirstName;
    }

    if (trimmedLastName && trimmedLastName !== userData.lastName) {
      updateData.lastName = trimmedLastName;
    }

    if (schoolId && schoolId !== currentSchoolId) {
      updateData.schoolId = schoolId;
    }

    if (photoPayload !== undefined) {
      updateData.photo = photoPayload;
    }

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
    setSchoolId(value);
    if (errors.school && value) {
      setErrors((prev) => ({ ...prev, school: undefined }));
    }
  };

  const handleSelectPhoto = async () => {
    setPhotoError(null);
    try {
      setIsSelectingPhoto(true);
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        setPhotoError('Se requieren permisos para acceder a la galería.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        base64: true,
        quality: 0.7,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.base64) {
        setPhotoError('No se pudo procesar la imagen seleccionada.');
        return;
      }

      const mimeType = asset.mimeType ?? 'image/jpeg';
      const previewSource = `data:${mimeType};base64,${asset.base64}`;
      const base64Payload = asset.base64.trim();

      setPhotoPreview(previewSource);
      setPhotoPayload(base64Payload);
    } catch (error) {
      console.error('Error selecting photo:', error);
      setPhotoError('No se pudo seleccionar la foto.');
    } finally {
      setIsSelectingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoPayload(null);
    setPhotoError(null);
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

      <Spacer size={16} />

      <View
        style={[
          formStyles.photoSection,
          isMobile ? formStyles.photoSectionMobile : formStyles.photoSectionDesktop,
        ]}
      >
        {photoPreview ? (
          <Image
            source={photoPreview}
            style={formStyles.photoPreview}
            contentFit="cover"
          />
        ) : (
          <View style={[formStyles.photoPreview, formStyles.photoPlaceholder]}>
            <Typography variant="h2" style={formStyles.photoPlaceholderText}>
              {userData.firstName.charAt(0).toUpperCase()}
            </Typography>
          </View>
        )}

        <View
          style={[
            formStyles.photoActions,
            isMobile ? formStyles.photoActionsMobile : formStyles.photoActionsDesktop,
          ]}
        >
          <ActionButton
            title={isSelectingPhoto ? 'Seleccionando...' : 'Cambiar foto'}
            onPress={handleSelectPhoto}
            variant="outline"
            loading={isSelectingPhoto}
            disabled={isLoading || isSelectingPhoto}
            iconName="photo-camera"
          />

          {(photoPreview || userData.photo) && (
            <ActionButton
              title="Quitar foto"
              onPress={handleRemovePhoto}
              variant="secondary"
              disabled={isLoading || isSelectingPhoto}
              iconName="delete"
            />
          )}

          {photoError ? (
            <Typography variant="caption" style={formStyles.photoError}>
              {photoError}
            </Typography>
          ) : null}
        </View>
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

        <View style={formStyles.infoRow}>
          <Typography variant="caption" style={formStyles.infoLabel}>
            Escuela actual
          </Typography>
          <Typography variant="body" style={formStyles.infoValue}>
            {userData.school?.name ?? 'Sin escuela asignada'}
          </Typography>
        </View>

        <View style={formStyles.infoRow}>
          <Typography variant="caption" style={formStyles.infoLabel}>
            Grupos asignados
          </Typography>
          {isGroupsLoading ? (
            <Typography variant="body" style={formStyles.infoValue}>
              Cargando grupos...
            </Typography>
          ) : normalizedGroups.length > 0 ? (
            <View style={formStyles.groupListContainer}>
              {normalizedGroups.map((group) => (
                <View key={group.id} style={formStyles.groupListItem}>
                  <Typography variant="body" style={formStyles.infoValue}>
                    {group.name}
                  </Typography>
                  {group.description ? (
                    <Typography variant="caption" style={formStyles.groupDescription}>
                      {group.description}
                    </Typography>
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <Typography variant="body" style={formStyles.infoValue}>
              Sin grupos asignados
            </Typography>
          )}
          {canLeaveGroup && onLeaveGroup ? (
            <View style={formStyles.leaveGroupContainer}>
              <ActionButton
                title={leaveGroupLoading ? 'Saliendo...' : 'Salir del grupo'}
                variant="outline"
                onPress={onLeaveGroup}
                loading={leaveGroupLoading}
                disabled={leaveGroupLoading || isLoading}
                iconName="logout"
              />
              <Typography variant="caption" style={formStyles.leaveGroupHint}>
                No eres el owner; puedes abandonar el grupo cuando lo necesites.
              </Typography>
            </View>
          ) : null}
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
              enableFocusControl
              leftIconName="person"
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
              enableFocusControl
              leftIconName="badge"
            />
          </View>
        </View>

        <Dropdown
          label="Escuela"
          value={schoolId}
          onSelect={handleSchoolChange}
          options={schoolOptions}
          error={errors.school}
          required={userData.accountType === 'instructor'}
          placeholder={schoolPlaceholder}
          enableFocusControl
          leftIconName="school"
          disabled={lockSchoolSelection || isSchoolLoading || schoolOptions.length === 0}
        />
        {lockSchoolSelection && (
          <Typography variant="caption" style={formStyles.schoolLockMessage}>
            {lockSchoolReason ??
              'No puedes modificar tu escuela debido a tu rol o participacion en grupos.'}
          </Typography>
        )}
      </View>

      <Spacer size={32} />

      <View style={isMobile ? formStyles.buttonContainerMobile : formStyles.buttonContainerDesktop}>
        <ActionButton
          title={isLoading ? 'Actualizando...' : 'Guardar cambios'}
          onPress={handleUpdate}
          loading={isLoading}
          disabled={disableSubmit}
        />
      </View>
    </View>
  );
};

const formStyles = StyleSheet.create({
  photoSection: {
    alignItems: 'center',
    gap: 16,
  },
  photoSectionMobile: {
    flexDirection: 'column',
  },
  photoSectionDesktop: {
    flexDirection: 'row',
  },
  photoPreview: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  photoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    color: '#1C1C1E',
    fontWeight: '600',
  },
  photoActions: {
    flex: 1,
    gap: 12,
  },
  photoActionsMobile: {
    width: '100%',
  },
  photoActionsDesktop: {
    alignSelf: 'stretch',
  },
  photoError: {
    color: '#FF3B30',
  },
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
  groupDescription: {
    fontSize: 14,
    color: '#4B5563',
  },
  schoolLockMessage: {
    marginTop: 8,
    color: '#DC2626',
  },
  groupListContainer: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  groupListItem: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 8,
    padding: 12,
    gap: 4,
    backgroundColor: '#fff',
  },
  groupMeta: {
    color: '#6B7280',
  },
  leaveGroupContainer: {
    marginTop: 8,
    gap: 4,
  },
  leaveGroupHint: {
    color: '#6B7280',
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











