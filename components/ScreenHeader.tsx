import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function ScreenHeader({ title, subtitle, actionLabel, onAction }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.actionButton} onPress={onAction} activeOpacity={0.75}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  textBlock: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A442E',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#475569',
  },
  actionButton: {
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  actionText: {
    color: '#1E293B',
    fontWeight: '700',
  },
});
