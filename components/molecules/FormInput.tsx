import React, { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';

import { Icon } from '../atoms/Icon';

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
  enableFocusControl?: boolean;
  leftIconName?: string;
  leftIconType?: React.ComponentProps<typeof Icon>['type'];
  leftIconColor?: string;
  onIconPress?: () => void;
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
  placeholder,
  enableFocusControl = false,
  leftIconName,
  leftIconType = 'MaterialIcons',
  leftIconColor,
  onIconPress,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<any>(null);

  const displayLabel = required ? `${label} *` : label;
  const isSecure = secureTextEntry && !showPassword;
  const shouldShowLeftIcon = Boolean(leftIconName);
  const resolvedIconColor = leftIconColor ?? '#6B7280';

  const customTheme = {
    colors: {
      onSurface: '#000000',
      onSurfaceVariant: '#000000',
      primary: '#2196F3',
    },
  };

  const handleIconPress = () => {
    if (onIconPress) {
      onIconPress();
    }
    if (enableFocusControl) {
      inputRef.current?.focus();
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        theme={customTheme}
        label={displayLabel}
        value={value}
        ref={inputRef}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[styles.input, isFocused && styles.inputFocused]}
        contentStyle={styles.inputContent}
        outlineStyle={[
          styles.inputOutline,
          isFocused && styles.inputOutlineFocused,
          error && styles.inputOutlineError,
        ]}
        error={!!error}
        secureTextEntry={isSecure}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholder={placeholder}
        mode="outlined"
        left={
          shouldShowLeftIcon ? (
            <TextInput.Icon
              icon={() => (
                <Icon
                  name={leftIconName as string}
                  type={leftIconType}
                  size={22}
                  color={resolvedIconColor}
                />
              )}
              onPress={enableFocusControl || onIconPress ? handleIconPress : undefined}
              forceTextInputFocus={false}
            />
          ) : undefined
        }
        right={
          secureTextEntry ? (
            <TextInput.Icon
              icon={showPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowPassword(!showPassword)}
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
    // backgroundColor: '#FFFFFF',
  },
  inputContent: {
    color: '#1C1C1E',
  },
  inputOutline: {
    borderRadius: 8,
    // borderColor: '#E5E5EA',
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
});
