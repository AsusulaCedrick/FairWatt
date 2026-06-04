import React from 'react';
import { ConfirmationModal } from './ui/ConfirmationModal';

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
};

export function ConfirmModal({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}: ConfirmModalProps) {
  return (
    <ConfirmationModal
      visible={visible}
      title={title}
      message={message}
      onCancel={onCancel}
      onConfirm={onConfirm}
      confirmText={confirmText}
      cancelText={cancelText}
      iconName="help-circle"
    />
  );
}
