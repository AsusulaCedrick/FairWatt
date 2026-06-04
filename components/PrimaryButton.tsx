import React from 'react';
import { Button } from './ui/Button';

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: object;
};

export function PrimaryButton({ title, onPress, disabled, style }: PrimaryButtonProps) {
  return (
    <Button
      title={title}
      onPress={onPress}
      disabled={disabled}
      variant="primary"
      style={style}
    />
  );
}
