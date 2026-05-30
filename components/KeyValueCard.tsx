import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Pair = {
  label: string;
  value: string;
};

type KeyValueCardProps = {
  items: Pair[];
};

export function KeyValueCard({ items }: KeyValueCardProps) {
  return (
    <View style={styles.card}>
      {items.map((item) => (
        <View style={styles.row} key={item.label}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.value}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  row: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 6,
  },
  value: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600',
  },
});
