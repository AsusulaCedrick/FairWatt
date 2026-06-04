import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Fonts, Radius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function ScreenHeader({ title, subtitle, actionLabel, onAction }: ScreenHeaderProps) {
  const { isDarkMode } = useAuth();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: themeColors.primary }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0' }]}
          onPress={onAction}
          activeOpacity={0.75}
        >
          <Text style={[styles.actionText, { color: isDarkMode ? '#FFFFFF' : '#1E293B' }]}>
            {actionLabel}
          </Text>
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
    marginBottom: 24,
    alignSelf: 'stretch',
  },
  textBlock: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    ...Fonts.h1,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 6,
    ...Fonts.body,
  },
  actionButton: {
    borderRadius: Radius.button,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
