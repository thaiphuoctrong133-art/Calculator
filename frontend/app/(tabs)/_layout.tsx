import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet } from "react-native";

import { colors } from "@/src/lib/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.cyan,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="calculator"
        options={{
          title: "Calculator",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calculator-outline" size={size} color={color} />
          ),
          tabBarButtonTestID: "tab-calculator",
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
          tabBarButtonTestID: "tab-history",
        }}
      />
      <Tabs.Screen
        name="reference"
        options={{
          title: "Reference",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
          tabBarButtonTestID: "tab-reference",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "rgba(5,5,5,0.95)",
    borderTopColor: colors.borderSubtle,
    borderTopWidth: 1,
    height: Platform.select({ ios: 84, default: 64 }),
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.4,
  },
});
