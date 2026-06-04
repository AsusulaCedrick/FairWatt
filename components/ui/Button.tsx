import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors, Fonts, Radius } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const { isDarkMode } = useAuth();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  const getButtonStyles = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: themeColors.primary,
        };
      case 'secondary':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: themeColors.primary,
        };
      case 'destructive':
        return {
          backgroundColor: themeColors.error,
        };
      case 'tertiary':
      default:
        return {
          backgroundColor: 'transparent',
          paddingVertical: 8,
          paddingHorizontal: 12,
        };
    }
  };

  const getTextStyles = (): TextStyle => {
    switch (variant) {
      case 'primary':
        return {
          color: '#FFFFFF',
        };
      case 'secondary':
        return {
          color: themeColors.primary,
        };
      case 'destructive':
        return {
          color: '#FFFFFF',
        };
      case 'tertiary':
      default:
        return {
          color: themeColors.primary,
          textDecorationLine: 'underline',
        };
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.baseButton,
        getButtonStyles(),
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? themeColors.primary : '#FFFFFF'} />
      ) : (
        <Text
          style={[
            styles.baseText,
            getTextStyles(),
            disabled && styles.disabledText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  baseButton: {
    height: 52,
    borderRadius: Radius.button,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignSelf: 'stretch',
  },
  disabledButton: {
    backgroundColor: '#CBD5E1',
    borderColor: '#CBD5E1',
    opacity: 0.6,
  },
  baseText: {
    ...Fonts.button,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledText: {
    color: '#94A3B8',
  },
});
