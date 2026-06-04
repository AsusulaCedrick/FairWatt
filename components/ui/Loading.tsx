import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

interface LoadingProps {
  message?: string;
  overlay?: boolean;
}

export function Loading({ message, overlay = false }: LoadingProps) {
  const { isDarkMode } = useAuth();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  return (
    <View
      style={[
        styles.container,
        overlay && styles.overlay,
        { backgroundColor: overlay ? 'rgba(15, 23, 42, 0.45)' : 'transparent' },
      ]}
    >
      <View style={[styles.card, overlay && { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        {message ? (
          <Text style={[styles.message, { color: themeColors.text }]}>
            {message}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  card: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    ...Fonts.body,
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
  },
});
