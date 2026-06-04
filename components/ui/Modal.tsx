import React from 'react';
import { Modal as RNModal, View, StyleSheet, TouchableWithoutFeedback, ViewStyle, Dimensions } from 'react-native';
import { Colors, Radius } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  closeOnBackdropPress?: boolean;
  style?: ViewStyle;
}

const screenHeight = Dimensions.get('window').height;

export function Modal({
  visible,
  onClose,
  children,
  closeOnBackdropPress = true,
  style,
}: ModalProps) {
  const { isDarkMode } = useAuth();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={closeOnBackdropPress ? onClose : undefined}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.content,
                {
                  backgroundColor: themeColors.card,
                  borderColor: themeColors.border,
                },
                style,
              ]}
            >
              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '90%',
    maxWidth: 360,
    borderRadius: Radius.modal,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
    maxHeight: screenHeight * 0.85,
  },
});
