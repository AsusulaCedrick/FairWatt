import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: 'default' | 'numeric';
  editable?: boolean;
};

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType = 'default',
  editable = true,
}: FormFieldProps) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        placeholder={placeholder}
        style={[styles.input, error ? styles.inputError : null, !editable && styles.disabledInput]}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        editable={editable}
        placeholderTextColor="#94A3B8"
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: '#E2E8F0',
  },
  inputError: {
    borderColor: '#F43F5E',
  },
  errorText: {
    color: '#B91C1C',
    marginTop: 8,
    fontSize: 12,
  },
});
