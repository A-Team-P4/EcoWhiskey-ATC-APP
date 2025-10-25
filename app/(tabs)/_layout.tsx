import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";

import { Icon } from "@/components/atoms/Icon";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2196F3",
        tabBarInactiveTintColor: "#6B7280",
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarStyle: isMobile ? {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0,
          height: Platform.OS === "ios" ? 88 : 68,
          paddingBottom: Platform.OS === "ios" ? 28 : 12,
          paddingTop: 0,
          paddingHorizontal: 16,
          elevation: 20,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        } : {
          display: 'none',
        },
        tabBarItemStyle: {
          paddingVertical: 4,
          marginHorizontal: 4,
        },
      }}
    >
      <Tabs.Screen
        name="ATCTrainingTab"
        options={{
          title: "ATC Practice",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabContainer}>
              {focused && <View style={styles.activeIndicator} />}
              <Icon
                type="FontAwesome5"
                name="plane-departure"
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="TrainingHistoryTab"
        options={{
          title: "Historial",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="clock.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="UserProfileTab"
        options={{
          title: "Score",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabContainer}>
              {focused && <View style={styles.activeIndicator} />}
              <Icon
                type="MaterialIcons"
                name="scoreboard"
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    width: 60,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingTop: 8,
  },
  activeIndicator: {
    position: "absolute",
    top: 0,
    left: 10,
    right: 10,
    height: 4,
    backgroundColor: "#2196F3",
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
});
