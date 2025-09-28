import React from 'react';
import { useWindowDimensions, View, ViewStyle } from 'react-native';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children }) => {
  const { width } = useWindowDimensions();

  const isMobile = width < 768;

  // Explicitly cast as ViewStyle
  const mobileContainerStyle: ViewStyle = {
    flex: 1,
    width: '100%',
    minHeight: '100%',
    //paddingHorizontal: 16,
   // paddingVertical: 16,
    maxWidth: '100%',
    alignSelf: 'center' as const,
  };

   const webContainerStyle: ViewStyle = {
    flex: 1,
    width: '100%',
    minHeight: '100%',
   // paddingHorizontal: isMobile ? 16 : 40,
    //paddingVertical: isMobile ? 16 : 32,
   // maxWidth: isMobile ? '100%' : 1200,
    alignSelf: 'center' as const, 
  };

  return (
    <View className="flex-1 bg-white">
      <View className="w-full max-w-full md:max-w-2xl mx-auto flex-1">
        {children}
      </View>
    </View>
      )
};

export default ResponsiveLayout;
