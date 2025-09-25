import { Ionicons } from '@expo/vector-icons';
import React from 'react';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
}

export const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 24, 
  color = '#1C1C1E' 
}) => {
  return <Ionicons name={name as any} size={size} color={color} />;
};