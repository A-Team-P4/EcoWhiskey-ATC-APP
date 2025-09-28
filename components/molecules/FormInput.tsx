import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';

interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  required?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  placeholder?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChangeText,
  error,
  required = false,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  placeholder
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const displayLabel = required ? `${label} *` : label;
  const isSecure = secureTextEntry && !showPassword;

  const customTheme = {
    colors: {
      onSurface: '#000000', // Label color when not focused
      onSurfaceVariant: '#000000', // Label color when focused
      primary: '#000000', // Label color when focused (primary color)
    },
  };

  return (
    <View style={styles.container}>
      <TextInput
        theme={customTheme}
        label={displayLabel}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[styles.input, isFocused && styles.inputFocused]}
        contentStyle={styles.inputContent}
        outlineStyle={[
          styles.inputOutline,
          isFocused && styles.inputOutlineFocused,
          error && styles.inputOutlineError
        ]}
        error={!!error}
        secureTextEntry={isSecure}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholder={placeholder}
        mode="outlined"
        right={
          secureTextEntry ? (
            <TextInput.Icon 
              icon={showPassword ? "eye-off" : "eye"} 
              onPress={() => setShowPassword(!showPassword)}
              //iconColor="#8E8E93"
            />
          ) : undefined
        }
      />
      <HelperText type="error" visible={!!error} style={styles.helperText}>
        {error || ' '}
      </HelperText>
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
 //   backgroundColor: '#FFFFFF',
  },
  inputContent: {
    color: '#1C1C1E',
  },
  inputOutline: {
    borderRadius: 8,
 //   borderColor: '#E5E5EA',
  },
  inputOutlineFocused: {
    borderColor: '#000',
    borderWidth: 1,
  },
  inputOutlineError: {
    borderColor: '#FF3B30',
  },
  helperText: {
    paddingHorizontal: 4,
    minHeight: 20,
  },
});