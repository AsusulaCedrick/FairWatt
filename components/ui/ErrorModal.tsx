import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from './Modal';
import { Button } from './Button';
import { Colors, Fonts } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

interface ErrorModalProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
}

export function ErrorModal({
  visible,
  title,
  message,
  onConfirm,
  confirmText = 'Try Again',
}: ErrorModalProps) {
  const { isDarkMode } = useAuth();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  return (
    <Modal visible={visible} onClose={onConfirm} closeOnBackdropPress={false}>
      <View style={styles.container}>
        {/* Error Warning Circle */}
        <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#3A1E1E' : '#FDE8E8' }]}>
          <Ionicons name="alert-circle" size={48} color={themeColors.error} />
        </View>

        {/* Text Block */}
        <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
        <Text style={[styles.message, { color: themeColors.textSecondary }]}>{message}</Text>

        {/* Confirm Button */}
        <Button
          title={confirmText}
          onPress={onConfirm}
          variant="destructive"
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
