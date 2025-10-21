import React from 'react';
import { useWindowDimensions, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TopNavigation } from '@/components/organisms/TopNavigation';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  showTopNav?: boolean;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  showTopNav = false,
}) => {
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
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      {showTopNav && <TopNavigation />}
      <View className="w-full max-w-full md:max-w-2xl mx-auto flex-1">
        {children}
      </View>
    </SafeAreaView>
  )
};

export default ResponsiveLayout;
