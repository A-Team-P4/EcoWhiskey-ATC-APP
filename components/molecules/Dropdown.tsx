import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Divider, HelperText, Surface, TextInput } from 'react-native-paper';
import { Icon } from '../atoms/Icon';
import { Typography } from '../atoms/Typography';

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  label: string;
  value: string;
  onSelect: (value: string) => void;
  options: DropdownOption[];
  error?: string;
  required?: boolean;
  placeholder?: string;
  enableFocusControl?: boolean;
  focusIcon?: string;
  disabled?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  value,
  onSelect,
  options,
  error,
  required = false,
  placeholder = "Selecciona una opción",
  enableFocusControl = false,
  focusIcon = 'pencil',
  disabled = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const displayLabel = required ? `${label} *` : label;
  const selectedOption = options.find(option => option.value === value);
  const displayValue = selectedOption ? selectedOption.label : '';

  const handleSelect = (option: DropdownOption) => {
    onSelect(option.value);
    setIsVisible(false);
    setIsFocused(false);
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

  const renderOption = ({ item }: { item: DropdownOption }) => (
    <TouchableOpacity
      style={[
        styles.optionItem,
        item.value === value && styles.optionItemSelected
      ]}
      onPress={() => handleSelect(item)}
    >
      <Typography variant="body" >
        {item.label}
      </Typography>
      {item.value === value && (
        <Icon name="checkmark-circle" size={20} color="#2196F3" />
      )}
    </TouchableOpacity>
  );

  const customTheme = {
    colors: {
      onSurface: '#000000', // Label color when not focused
      onSurfaceVariant: '#000000', // Label color when not focused
      primary: '#2196F3', // Label and border color when focused
    },
  };

  const iconColor = disabled ? '#C7C7CC' : '#000';

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
            disabled && styles.inputDisabled
          ]}
          contentStyle={styles.inputContent}
          outlineStyle={[
            styles.inputOutline,
            isFocused && styles.inputOutlineFocused,
            error && styles.inputOutlineError
          ]}
          error={!!error}
          mode="outlined"
          left={
            enableFocusControl
              ? (
                <TextInput.Icon
                  icon={focusIcon}
                  onPress={disabled ? undefined : openDropdown}
                  forceTextInputFocus={false}
                  color={iconColor}
                />
              )
              : undefined
          }
          editable={false}
          placeholder={placeholder}
          right={
            <TextInput.Icon
              icon={() => (
                <Icon
                  name={isVisible ? "chevron-up" : "chevron-down"}
                  type="Entypo"
                  size={24}
                  color={iconColor}
                />
              )}
              onPress={disabled ? undefined : openDropdown}
              forceTextInputFocus={false}
            />
          }
        />
      </TouchableOpacity>
      
      <HelperText type="error" visible={!!error} style={styles.helperText}>
        {error || ' '}
      </HelperText>

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
                <TouchableOpacity onPress={closeDropdown}>
                  <Icon name="close" size={24} color="#8E8E93" />
                </TouchableOpacity>
              </View>

              <Divider />

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
  inputFocused: {
    // backgroundColor: '#FFFFFF', // Uncomment if you want focused background
  },
  inputDisabled: {
    opacity: 0.6,
  },
  inputContent: {
    color: '#1C1C1E',
  },
  inputOutline: {
    borderRadius: 12,
    // borderColor: '#E5E5EA', // Uncomment if you want default border color
  },
  inputOutlineFocused: {
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  inputOutlineError: {
    borderColor: '#FF3B30',
  },
  helperText: {
    paddingHorizontal: 4,
    minHeight: 20,
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
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  optionItemSelected: {
    backgroundColor: '#FFFFFF',
  },
  optionText: {
    flex: 1,
  },
  optionTextSelected: {
    color: '#000',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#8E8E93',
  },
});
