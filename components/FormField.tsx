import React from 'react';
import { Input } from './ui/Input';

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
    <Input
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      error={error}
      keyboardType={keyboardType === 'numeric' ? 'numeric' : 'default'}
      editable={editable}
    />
  );
}
