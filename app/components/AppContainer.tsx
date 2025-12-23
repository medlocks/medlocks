import React from "react";
import { View, SafeAreaView, StatusBar } from "react-native";
import theme from "../theme";

export default function AppContainer({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <View style={{ flex: 1, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md }}>
        {children}
      </View>
    </SafeAreaView>
  );
}
