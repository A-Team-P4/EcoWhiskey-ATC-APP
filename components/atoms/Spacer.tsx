import React from 'react';
import { View } from 'react-native';

interface SpacerProps {
  size: number;
  horizontal?: boolean;
}

export const Spacer: React.FC<SpacerProps> = ({ size, horizontal = false }) => {
  return (
    <View 
      style={{
        width: horizontal ? size : undefined,
        height: horizontal ? undefined : size,
      }} 
    />
  );
};