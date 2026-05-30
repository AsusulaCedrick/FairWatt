import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

type SecondaryButtonProps = {
  title: string;
  onPress: () => void;
  style?: object;
};

export function SecondaryButton({ title, onPress, style }: SecondaryButtonProps) {
  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#1E293B',
    fontWeight: '700',
    fontSize: 15,
  },
});
