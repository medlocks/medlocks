
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";

export default function Layout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false, // hides default header for now
          animation: "slide_from_right",
        }}
      />
    </>
  );
}

