import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRoutineNotifications } from "@/hooks/useRoutineNotifications";
import { useNotificationSetup } from "@/hooks/useNotificationSetup";

export default function TabLayout() {
  useNotificationSetup();        
  useRoutineNotifications();     

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#ff9db2", 
        tabBarInactiveTintColor: "#aaa",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
