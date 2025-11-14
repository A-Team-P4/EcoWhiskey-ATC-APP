import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Divider, Surface, TextInput } from 'react-native-paper';
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
  leftIconName?: string;
  leftIconType?: React.ComponentProps<typeof Icon>['type'];
  leftIconColor?: string;
  disabled?: boolean;
  compact?: boolean;
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
  leftIconName,
  leftIconType = 'MaterialIcons',
  leftIconColor,
  disabled = false,
  compact = false
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
  const leftIconColorResolved = leftIconColor ?? iconColor;

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <TouchableOpacity onPress={openDropdown} disabled={disabled}>
        <TextInput
          theme={customTheme}
          label={displayLabel}
          value={displayValue}
          style={[
            styles.input,
            compact && styles.inputCompact,
            isFocused && styles.inputFocused,
            disabled && styles.inputDisabled
          ]}
          contentStyle={[styles.inputContent, compact && styles.inputContentCompact]}
          outlineStyle={[
            styles.inputOutline,
            compact && styles.inputOutlineCompact,
            isFocused && styles.inputOutlineFocused,
            error && styles.inputOutlineError
          ]}
          error={!!error}
          mode="outlined"
          dense={compact}
          left={
            leftIconName
              ? (
                <TextInput.Icon
                  icon={() => (
                    <Icon
                      name={leftIconName}
                      type={leftIconType}
                      size={22}
                      color={leftIconColorResolved}
                    />
                  )}
                  onPress={
                    !disabled && enableFocusControl ? openDropdown : undefined
                  }
                  forceTextInputFocus={false}
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
    marginBottom: 2,
  },
  containerCompact: {
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
  inputCompact: {
    height: 46,
  },
  inputFocused: {
    // backgroundColor: '#FFFFFF', 
  },
  inputDisabled: {
    opacity: 0.6,
  },
  inputContent: {
    color: '#1C1C1E',
  },
  inputContentCompact: {
    paddingVertical: 6,
    fontSize: 14,
  },
  inputOutline: {
    borderRadius: 12,
    // borderColor: '#E5E5EA', 
  },
  inputOutlineCompact: {
    borderRadius: 8,
  },
  inputOutlineFocused: {
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  inputOutlineError: {
    borderColor: '#FF3B30',
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
