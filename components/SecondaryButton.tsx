import React from 'react';
import { Button } from './ui/Button';

type SecondaryButtonProps = {
  title: string;
  onPress: () => void;
  style?: object;
};

export function SecondaryButton({ title, onPress, style }: SecondaryButtonProps) {
  return (
    <Button
      title={title}
      onPress={onPress}
      variant="secondary"
      style={style}
    />
  );
}
