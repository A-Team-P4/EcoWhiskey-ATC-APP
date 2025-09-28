import React from 'react';
import { View } from 'react-native';
import { Spacer } from '../atoms/Spacer';
import { Typography } from '../atoms/Typography';

export const WelcomeSection: React.FC = () => {
  return (
    <View className='relative overflow-hidden '>
     
  
      <View className='flex items-center py-8 px-4 bg-white/60'>
        <Typography variant="h1" align="center" style={{ color: '#000', fontWeight: 'bold' }}>
          EcoWhiskey ATC
        </Typography>
        <Spacer size={8} />
        <Typography variant="caption" align="center" style={{ lineHeight: 22, color: '#333' }}>
          Entrena tu comunicación como en la cabina real
        </Typography>
      </View>
    </View>
  );
};