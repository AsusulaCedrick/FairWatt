import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FormOption } from '../constants/formSchema';

type FormSelectProps = {
  label: string;
  options: FormOption[];
  selectedKey?: string;
  onSelect: (key: string) => void;
  error?: string;
};

export function FormSelect({ label, options, selectedKey, onSelect, error }: FormSelectProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[styles.chip, selectedKey === option.key && styles.selectedChip]}
            onPress={() => onSelect(option.key)}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, selectedKey === option.key && styles.selectedText]}>
              {option.label}
            </Text>
            {option.description ? <Text style={styles.optionDescription}>{option.description}</Text> : null}
          </TouchableOpacity>
        ))}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    minWidth: 100,
    margin: 6,
  },
  selectedChip: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0EA5E9',
  },
  chipText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  selectedText: {
    color: '#0C4A6E',
  },
  optionDescription: {
    marginTop: 4,
    fontSize: 11,
    color: '#64748B',
  },
  errorText: {
    color: '#B91C1C',
    marginTop: 10,
    fontSize: 12,
  },
});
