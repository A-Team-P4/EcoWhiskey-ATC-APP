import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from '../atoms/Icon';
import { Spacer } from '../atoms/Spacer';
import { Typography } from '../atoms/Typography';

interface WelcomeSectionProps {
  title: string;
  subtitle: string;
  iconName?: string;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  title,
  subtitle,
  iconName = 'person-add'
}) => {
  return (
    <View style={welcomeStyles.container}>
      <View style={welcomeStyles.logoCircle}>
        <Icon name={iconName} size={32} color="#007AFF" />
      </View>
      <Spacer size={16} />
      <Typography variant="h1" align="center">
        {title}
      </Typography>
      <Spacer size={8} />
      <Typography variant="caption" align="center" style={welcomeStyles.subtitle}>
        {subtitle}
      </Typography>
    </View>
  );
};

const welcomeStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    lineHeight: 22,
  },
});
