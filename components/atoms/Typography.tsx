import React from 'react';
import { Text as RNText, StyleSheet, TextStyle } from 'react-native';


interface TypographyProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'error';
  children: React.ReactNode;
  style?: TextStyle;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export const Typography: React.FC<TypographyProps> = ({ 
  variant = 'body', 
  children, 
  style, 
  color,
  align = 'left'
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'h1': return styles.h1;
      case 'h2': return styles.h2;
      case 'h3': return styles.h3;
      case 'body': return styles.body;
      case 'caption': return styles.caption;
      case 'error': return styles.error;
      default: return styles.body;
    }
  };

  const textStyle: TextStyle = { textAlign: align };
  if (color) {
    textStyle.color = color;
  }

  return (
    <RNText style={[
      getVariantStyle(),
      textStyle,
      style
    ]}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: '#1C1C1E' },
  h2: { fontSize: 20, fontWeight: '600', color: '#1C1C1E' },
  h3: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  body: { fontSize: 16, fontWeight: '400', color: '#1C1C1E' },
  caption: { fontSize: 16, fontWeight: '400', color: '#8E8E93' },
  error: { fontSize: 14, fontWeight: '400', color: '#FF3B30' },
});
