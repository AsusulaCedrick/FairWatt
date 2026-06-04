import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmailSentModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function EmailSentModal({ visible, onClose }: EmailSentModalProps) {
  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="paper-plane" size={36} color="#1A442E" style={styles.icon} />
          </View>
          
          <Text style={styles.modalTitle}>Email verification sent.</Text>
          
          <TouchableOpacity style={styles.okButton} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.okButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    width: '85%',
    maxWidth: 320,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    marginLeft: -2, // slightly center align the paper plane icon offset
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A442E',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 26,
  },
  okButton: {
    backgroundColor: '#1A442E',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  okButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
