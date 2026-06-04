import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, Fonts } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'primary';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({ label, variant = 'primary', style, textStyle }: BadgeProps) {
  const { isDarkMode } = useAuth();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  const getBadgeColors = () => {
    switch (variant) {
      case 'success':
        return {
          bg: isDarkMode ? '#1B3A2E' : '#E8F5E9',
          text: themeColors.success,
        };
      case 'error':
        return {
          bg: isDarkMode ? '#3A1E1E' : '#FDE8E8',
          text: themeColors.error,
        };
      case 'warning':
        return {
          bg: isDarkMode ? '#3A2E1E' : '#FEF3C7',
          text: themeColors.warning,
        };
      case 'info':
        return {
          bg: isDarkMode ? '#1E2E3A' : '#E0F2FE',
          text: themeColors.info,
        };
      case 'primary':
      default:
        return {
          bg: isDarkMode ? '#1E2A1E' : themeColors.primaryLight,
          text: themeColors.primary,
        };
    }
  };

  const colors = getBadgeColors();

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.text, { color: colors.text }, textStyle]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    ...Fonts.caption,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
