import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Radius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

type Pair = {
  label: string;
  value: string;
};

type KeyValueCardProps = {
  items: Pair[];
};

export function KeyValueCard({ items }: KeyValueCardProps) {
  const { isDarkMode } = useAuth();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  return (
    <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
      {items.map((item) => (
        <View style={styles.row} key={item.label}>
          <Text style={[styles.label, { color: themeColors.textSecondary }]}>{item.label}</Text>
          <Text style={[styles.value, { color: themeColors.text }]}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    alignSelf: 'stretch',
  },
  row: {
    marginBottom: 14,
  },
  label: {
    ...Fonts.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    ...Fonts.body,
    fontWeight: '600',
  },
});
