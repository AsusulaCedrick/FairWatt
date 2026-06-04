import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from './Modal';
import { Button } from './Button';
import { Colors, Fonts } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBgColor?: string;
  isDestructive?: boolean;
}

export function ConfirmationModal({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
  confirmText = 'Continue',
  cancelText = 'Cancel',
  iconName = 'help-circle-outline',
  iconColor,
  iconBgColor,
  isDestructive = false,
}: ConfirmationModalProps) {
  const { isDarkMode } = useAuth();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  const defaultIconColor = iconColor || (isDestructive ? themeColors.error : themeColors.primary);
  const defaultIconBgColor = iconBgColor || (isDarkMode ? (isDestructive ? '#3A1E1E' : '#1B3A2E') : (isDestructive ? '#FDE8E8' : themeColors.primaryLight));

  return (
    <Modal visible={visible} onClose={onCancel} closeOnBackdropPress={false}>
      <View style={styles.container}>
        {/* Top Icon Circle */}
        <View style={[styles.iconContainer, { backgroundColor: defaultIconBgColor }]}>
          <Ionicons name={iconName} size={42} color={defaultIconColor} />
        </View>

        {/* Text Block */}
        <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
        <Text style={[styles.message, { color: themeColors.textSecondary }]}>{message}</Text>

        {/* Actions Button Layout */}
        <View style={styles.actionRow}>
          <Button
            title={cancelText}
            onPress={onCancel}
            variant="secondary"
            style={styles.halfButton}
          />
          <Button
            title={confirmText}
            onPress={onConfirm}
            variant={isDestructive ? 'destructive' : 'primary'}
            style={styles.halfButton}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    ...Fonts.h2,
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    ...Fonts.body,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  halfButton: {
    flex: 1,
  },
});
