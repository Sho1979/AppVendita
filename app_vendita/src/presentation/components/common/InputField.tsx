import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import SafeTouchableOpacity from './SafeTouchableOpacity';
import { Colors } from '../../../constants/Colors';
import { Spacing } from '../../../constants/Spacing';

interface InputFieldProps extends TextInputProps {
  label?: string;
  placeholder?: string;
  error?: string | null;
  helperText?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'small' | 'medium' | 'large';
}

export default function InputField({
  label,
  placeholder,
  error,
  helperText,
  required = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  variant = 'outlined',
  size = 'medium',
  style,
  ...props
}: InputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  const getContainerStyle = () => {
    const baseStyle = [styles.container];

    if (variant === 'outlined') {
      baseStyle.push(styles.outlined as any);
    } else if (variant === 'filled') {
      baseStyle.push(styles.filled as any);
    }

    // Applica stili condizionali separatamente
    if (isFocused) {
      baseStyle.push(styles.focused as any);
    }
    if (error) {
      baseStyle.push(styles.error as any);
    }
    if (size === 'small') {
      baseStyle.push(styles.small as any);
    }
    if (size === 'large') {
      baseStyle.push(styles.large as any);
    }

    return baseStyle;
  };

  const getInputStyle = () => {
    const baseStyle = [styles.input];

    // Applica stili condizionali separatamente
    if (size === 'small') {
      baseStyle.push(styles.inputSmall as any);
    }
    if (size === 'large') {
      baseStyle.push(styles.inputLarge as any);
    }
    if (leftIcon) {
      baseStyle.push(styles.inputWithLeftIcon as any);
    }
    if (rightIcon) {
      baseStyle.push(styles.inputWithRightIcon as any);
    }

    return baseStyle;
  };

  return (
    <View style={styles.wrapper}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}

      <View style={getContainerStyle()}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[getInputStyle(), style]}
          placeholder={placeholder}
          placeholderTextColor={Colors.warmTextSecondary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {rightIcon && (
          <SafeTouchableOpacity
            style={styles.rightIcon}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </SafeTouchableOpacity>
        )}
      </View>

      {(error || helperText) && (
        <View style={styles.helperContainer}>
          {error && <Text style={styles.errorText}>{error}</Text>}
          {helperText && !error && (
            <Text style={styles.helperText}>{helperText}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.medium,
  },
  labelContainer: {
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warmText,
  },
  required: {
    color: Colors.warmError,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
    backgroundColor: Colors.warmBackground,
    minHeight: 48,
  },
  outlined: {
    backgroundColor: Colors.warmBackground,
  },
  filled: {
    backgroundColor: Colors.warmSurface,
    borderColor: 'transparent',
  },
  focused: {
    borderColor: Colors.warmPrimary,
    backgroundColor: Colors.warmBackground,
  },
  error: {
    borderColor: Colors.warmError,
  },
  small: {
    minHeight: 40,
  },
  large: {
    minHeight: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.warmText,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
  },
  inputSmall: {
    fontSize: 14,
    paddingHorizontal: Spacing.small,
    paddingVertical: Spacing.xs,
  },
  inputLarge: {
    fontSize: 18,
    paddingHorizontal: Spacing.large,
    paddingVertical: Spacing.medium,
  },
  inputWithLeftIcon: {
    paddingLeft: Spacing.small,
  },
  inputWithRightIcon: {
    paddingRight: Spacing.small,
  },
  leftIcon: {
    paddingLeft: Spacing.medium,
    paddingRight: Spacing.small,
  },
  rightIcon: {
    paddingRight: Spacing.medium,
    paddingLeft: Spacing.small,
  },
  helperContainer: {
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.small,
  },
  helperText: {
    fontSize: 12,
    color: Colors.warmTextSecondary,
  },
  errorText: {
    fontSize: 12,
    color: Colors.warmError,
  },
});
