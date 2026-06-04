import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  label?: string;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

export function Checkbox({ checked, onPress, label, style, labelStyle }: CheckboxProps) {
  const { isDarkMode } = useAuth();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.container, style]}
    >
      <View
        style={[
          styles.checkbox,
          {
            borderColor: checked ? themeColors.primary : themeColors.border,
            backgroundColor: checked ? themeColors.primary : 'transparent',
          },
        ]}
      >
        {checked ? (
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        ) : null}
      </View>
      {label ? (
        <Text style={[styles.label, { color: themeColors.text }, labelStyle]}>
          {label}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  label: {
    ...Fonts.body,
  },
});
