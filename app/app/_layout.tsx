import React, { useEffect, useState } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/services/firebase";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Redirect based on auth state
  useEffect(() => {
    if (loading) return; // wait until we know auth state

    const inAuthGroup = segments[0] === "auth";

    if (!user && !inAuthGroup) {
      router.replace("/auth/login");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, loading, segments]);

  // Loading screen while checking auth
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#ff9db2" />
      </View>
    );
  }

  return <Slot />; // render child routes
}


