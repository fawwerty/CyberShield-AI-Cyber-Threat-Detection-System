/**
 * CyberShield Mobile App
 * Root entry point with bottom tab navigation - REVERTED
 */

import "react-native-url-polyfill/auto";

import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import DashboardScreen from "./src/screens/DashboardScreen";
import AlertsScreen from "./src/screens/AlertsScreen";
import AnalyzeScreen from "./src/screens/AnalyzeScreen";
import { colors } from "./src/components/theme";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: colors.accent,
          background: colors.bg,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.red,
        },
      }}
    >
      <StatusBar style="light" backgroundColor={colors.bg} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: {
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontFamily: "monospace",
            fontWeight: "700",
            fontSize: 16,
          },
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingBottom: 4,
            height: 60,
          },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.muted,
          tabBarLabelStyle: {
            fontFamily: "monospace",
            fontSize: 10,
            marginTop: -2,
          },
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === "Dashboard") {
              iconName = focused ? "grid" : "grid-outline";
            } else if (route.name === "Alerts") {
              iconName = focused ? "notifications" : "notifications-outline";
            } else if (route.name === "Analyze") {
              iconName = focused ? "flash" : "flash-outline";
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: "CyberShield" }}
        />
        <Tab.Screen
          name="Alerts"
          component={AlertsScreen}
          options={{ title: "Alerts" }}
        />
        <Tab.Screen
          name="Analyze"
          component={AnalyzeScreen}
          options={{ title: "Analyze" }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
