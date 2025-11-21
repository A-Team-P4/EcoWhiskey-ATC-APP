import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Divider, Surface, TextInput } from 'react-native-paper';
import { Icon } from '../atoms/Icon';
import { Typography } from '../atoms/Typography';

interface DropdownOption {
  label: string;
  value: string;
}

interface MultiSelectDropdownProps {
  label: string;
  values: string[];
  onSelect: (values: string[]) => void;
  options: DropdownOption[];
  error?: string;
  required?: boolean;
  placeholder?: string;
  leftIconName?: string;
  leftIconType?: React.ComponentProps<typeof Icon>['type'];
  leftIconColor?: string;
  disabled?: boolean;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  values,
  onSelect,
  options,
  error,
  required = false,
  placeholder = "Selecciona opciones",
  leftIconName,
  leftIconType = 'MaterialIcons',
  leftIconColor,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const displayLabel = required ? `${label} *` : label;
  const selectedOptions = options.filter(option => values.includes(option.value));
  const displayValue = selectedOptions.length > 0
    ? `${selectedOptions.length} seleccionado${selectedOptions.length > 1 ? 's' : ''}`
    : '';

  const toggleSelection = (optionValue: string) => {
    const newValues = values.includes(optionValue)
      ? values.filter(v => v !== optionValue)
      : [...values, optionValue];
    onSelect(newValues);
  };

  const openDropdown = () => {
    if (disabled) {
      return;
    }
    setIsVisible(true);
    setIsFocused(true);
  };

  const closeDropdown = () => {
    setIsVisible(false);
    setIsFocused(false);
  };

  const renderOption = ({ item }: { item: DropdownOption }) => {
    const isSelected = values.includes(item.value);
    return (
      <TouchableOpacity
        style={[
          styles.optionItem,
          isSelected && styles.optionItemSelected
        ]}
        onPress={() => toggleSelection(item.value)}
      >
        <Icon
          type="MaterialIcons"
          name={isSelected ? 'check-box' : 'check-box-outline-blank'}
          size={24}
          color={isSelected ? '#2196F3' : '#9CA3AF'}
        />
        <Typography variant="body" style={styles.optionText}>
          {item.label}
        </Typography>
      </TouchableOpacity>
    );
  };

  const customTheme = {
    colors: {
      onSurface: '#000000', // Label color when not focused
      onSurfaceVariant: '#000000', // Label color when not focused
      primary: '#2196F3', // Label and border color when focused
    },
  };

  const iconColor = disabled ? '#C7C7CC' : '#000';
  const resolvedIconColor = leftIconColor ?? iconColor;
  const chevronColor = disabled ? '#C7C7CC' : '#2196F3';

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={openDropdown} disabled={disabled}>
        <TextInput
          theme={customTheme}
          label={displayLabel}
          value={displayValue}
          style={[
            styles.input,
            isFocused && styles.inputFocused,
            disabled && styles.inputDisabled,
          ]}
          contentStyle={styles.inputContent}
          outlineStyle={[
            styles.inputOutline,
            isFocused && styles.inputOutlineFocused,
            error && styles.inputOutlineError
          ]}
          error={!!error}
          mode="outlined"
          editable={false}
          placeholder={placeholder}
          left={
            leftIconName
              ? (
                <TextInput.Icon
                  icon={() => (
                    <Icon
                      name={leftIconName}
                      type={leftIconType}
                      size={22}
                      color={resolvedIconColor}
                    />
                  )}
                />
              )
              : undefined
          }
          right={
            <TextInput.Icon
              icon={() => (
                <View style={styles.dropdownIndicator}>
                  <View style={styles.dropdownIndicatorLine} />
                  <Icon
                    type="Entypo"
                    name={isVisible ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={chevronColor}
                  />
                  <View style={styles.dropdownIndicatorLine} />
                </View>
              )}
              onPress={openDropdown}
              forceTextInputFocus={false}
              disabled={disabled}
            />
          }
        />
      </TouchableOpacity>

      <View style={styles.helperTextContainer}>
        {error && <Text style={styles.helperText}>{error}</Text>}
      </View>

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={closeDropdown}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={closeDropdown}
          activeOpacity={1}
        >
          <View style={styles.modalContent}>
            <Surface style={styles.dropdownContainer} elevation={4}>
              {/* Header */}
              <View style={styles.dropdownHeader}>
                <Typography variant="h3" style={styles.dropdownTitle}>
                  {label}
                </Typography>
                <TouchableOpacity onPress={closeDropdown} accessibilityRole="button">
                  <Icon type="MaterialIcons" name="close" color="#000" size={24} />
                </TouchableOpacity>
              </View>

              <Divider />

              {/* Selected Count */}
              {values.length > 0 && (
                <View style={styles.selectedCountContainer}>
                  <Typography variant="body" style={styles.selectedCountText}>
                    {values.length} objetivo{values.length > 1 ? 's' : ''} seleccionado{values.length > 1 ? 's' : ''}
                  </Typography>
                </View>
              )}

              {/* Options List */}
              <FlatList
                data={options}
                renderItem={renderOption}
                keyExtractor={(item) => item.value}
                style={styles.optionsList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Typography variant="body" style={styles.emptyText}>
                      No hay opciones disponibles
                    </Typography>
                  </View>
                }
              />

              {/* Done Button */}
              <View style={styles.doneButtonContainer}>
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={closeDropdown}
                  activeOpacity={0.8}
                >
                  <Typography variant="body" style={styles.doneButtonText}>
                    Listo
                  </Typography>
                </TouchableOpacity>
              </View>
            </Surface>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
  inputDisabled: {
    opacity: 0.6,
  },
  inputFocused: {
    // backgroundColor: '#FFFFFF',
  },
  inputContent: {
    color: '#1C1C1E',
  },
  inputOutline: {
    borderRadius: 12,
  },
  inputOutlineFocused: {
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  inputOutlineError: {
    borderColor: '#FF3B30',
  },
  dropdownIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
  },
  dropdownIndicatorLine: {
    width: 1,
    height: 14,
    backgroundColor: '#E5E5EA',
  },
  helperTextContainer: {
    minHeight: 20,
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#FF3B30',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  dropdownContainer: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  dropdownTitle: {
    fontWeight: '600',
    color: '#1C1C1E',
  },
  selectedCountContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
  },
  selectedCountText: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingLeft: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  optionItemSelected: {
    backgroundColor: '#F9F9F9',
  },
  optionText: {
    flex: 1,
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#8E8E93',
  },
  doneButtonContainer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  doneButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
