import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Checkbox, Divider, HelperText, Surface, TextInput } from 'react-native-paper';
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
  searchable?: boolean;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  values,
  onSelect,
  options,
  error,
  required = false,
  placeholder = "Selecciona opciones",
  searchable = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);

  const displayLabel = required ? `${label} *` : label;
  const selectedOptions = options.filter(option => values.includes(option.value));
  const displayValue = selectedOptions.length > 0
    ? `${selectedOptions.length} seleccionado${selectedOptions.length > 1 ? 's' : ''}`
    : '';

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text === '') {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(option =>
        option.label.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  };

  const toggleSelection = (optionValue: string) => {
    const newValues = values.includes(optionValue)
      ? values.filter(v => v !== optionValue)
      : [...values, optionValue];
    onSelect(newValues);
  };

  const openDropdown = () => {
    setIsVisible(true);
    setIsFocused(true);
    setFilteredOptions(options);
  };

  const closeDropdown = () => {
    setIsVisible(false);
    setIsFocused(false);
    setSearchText('');
    setFilteredOptions(options);
  };

  const renderOption = ({ item }: { item: DropdownOption }) => (
    <TouchableOpacity
      style={[
        styles.optionItem,
        values.includes(item.value) && styles.optionItemSelected
      ]}
      onPress={() => toggleSelection(item.value)}
    >
      <Checkbox
        status={values.includes(item.value) ? 'checked' : 'unchecked'}
        onPress={() => toggleSelection(item.value)}
        color="#2196F3"
      />
      <Typography variant="body" style={styles.optionText}>
        {item.label}
      </Typography>
    </TouchableOpacity>
  );

  const customTheme = {
    colors: {
      onSurface: '#000000', // Label color when not focused
      onSurfaceVariant: '#000000', // Label color when not focused
      primary: '#2196F3', // Label and border color when focused
    },
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={openDropdown}>
        <TextInput
          theme={customTheme}
          label={displayLabel}
          value={displayValue}
          style={[styles.input, isFocused && styles.inputFocused]}
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
          right={
            <TextInput.Icon
              icon={isVisible ? "chevron-up" : "chevron-down"}
              onPress={openDropdown}
              color="#2196F3"
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

              {/* Search Input (if searchable) */}
              {searchable && (
                <View style={styles.searchContainer}>
                  <TextInput
                    placeholder="Buscar..."
                    value={searchText}
                    onChangeText={handleSearch}
                    style={styles.searchInput}
                    mode="outlined"
                    dense
                    left={<TextInput.Icon icon="magnify" color="#8E8E93" />}
                  />
                </View>
              )}

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
                data={filteredOptions}
                renderItem={renderOption}
                keyExtractor={(item) => item.value}
                style={styles.optionsList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Typography variant="body" style={styles.emptyText}>
                      {searchText ? 'No se encontraron resultados' : 'No hay opciones disponibles'}
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
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
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
