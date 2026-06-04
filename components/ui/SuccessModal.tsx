import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from './Modal';
import { Button } from './Button';
import { Colors, Fonts } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

interface SuccessModalProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
}

export function SuccessModal({
  visible,
  title,
  message,
  onConfirm,
  confirmText = 'OK',
}: SuccessModalProps) {
  const { isDarkMode } = useAuth();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  return (
    <Modal visible={visible} onClose={onConfirm} closeOnBackdropPress={false}>
      <View style={styles.container}>
        {/* Success Checkmark Circle */}
        <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#1B3A2E' : '#E8F5E9' }]}>
          <Ionicons name="checkmark-circle" size={48} color={themeColors.success} />
        </View>

        {/* Text Block */}
        <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
        <Text style={[styles.message, { color: themeColors.textSecondary }]}>{message}</Text>

        {/* Confirm Button */}
        <Button
          title={confirmText}
          onPress={onConfirm}
          variant="primary"
          style={styles.button}
        />
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
  button: {
    width: '100%',
  },
});
