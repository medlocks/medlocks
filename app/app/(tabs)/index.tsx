import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
// app/index.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Link } from "expo-router";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Medlocks Hair Coach</Text>
      <Text style={styles.subtitle}>
        Your journey to healthy, dreamy hair starts here.
      </Text>

      {/* Example navigation link */}
      <Link href="/signup" style={styles.link}>
        Get Started →
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  link: {
    fontSize: 16,
    color: "#ff9db2",
    fontWeight: "600",
  },
});
