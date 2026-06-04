import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FormOption } from '../constants/formSchema';
import { Colors, Fonts, Radius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

type FormSelectProps = {
  label: string;
  options: FormOption[];
  selectedKey?: string;
  onSelect: (key: string) => void;
  error?: string;
};

export function FormSelect({ label, options, selectedKey, onSelect, error }: FormSelectProps) {
  const { isDarkMode } = useAuth();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: themeColors.text }]}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((option) => {
          const isSelected = selectedKey === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected
                    ? (isDarkMode ? '#1B3A2E' : themeColors.primaryLight)
                    : themeColors.card,
                  borderColor: isSelected ? themeColors.primary : themeColors.border,
                },
              ]}
              onPress={() => onSelect(option.key)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isSelected ? (isDarkMode ? '#81C784' : themeColors.primary) : themeColors.text,
                    fontFamily: isSelected ? 'Poppins_600SemiBold' : 'Poppins_500Medium',
                  },
                ]}
              >
                {option.label}
              </Text>
              {option.description ? (
                <Text style={[styles.optionDescription, { color: themeColors.textSecondary }]}>
                  {option.description}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
      {error ? (
        <Text style={[styles.errorText, { color: themeColors.error }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
    alignSelf: 'stretch',
  },
  label: {
    ...Fonts.caption,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radius.button,
    borderWidth: 1.5,
    minWidth: 100,
    margin: 6,
    flexGrow: 1, // Full responsive layout wrapping
  },
  chipText: {
    fontSize: 14,
  },
  optionDescription: {
    marginTop: 4,
    fontSize: 11,
  },
  errorText: {
    ...Fonts.caption,
    fontWeight: '500',
    marginTop: 8,
  },
});
