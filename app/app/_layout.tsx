import React, { useEffect, useState, useRef } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/services/firebase";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();
  const redirectRef = useRef(false); // prevents multiple redirects

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (loading || redirectRef.current) return;

    const inAuth = segments[0] === "auth";
    const inSetup = segments[0] === "profile" && segments[1] === "setup";

    const checkProfile = async () => {
      if (!user && !inAuth) {
        redirectRef.current = true;
        router.replace("/auth/login");
        return;
      }

      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const snapshot = await getDoc(userRef);
          const data = snapshot.exists() ? snapshot.data() : null;

          const hasHairType = !!data?.hairType;
          const hasHairGoals = Array.isArray(data?.hairGoals) && data.hairGoals.length > 0;

          if (!snapshot.exists() || !hasHairType || !hasHairGoals) {
            if (!inSetup) {
              redirectRef.current = true;
              router.replace("/profile/setup");
            }
            return;
          }

          // User has profile; redirect away from auth/setup pages
          if (inAuth || inSetup) {
            redirectRef.current = true;
            router.replace("/(tabs)");
          }
        } catch (err) {
          console.error("Error checking user profile:", err);
          if (!inSetup) {
            redirectRef.current = true;
            router.replace("/profile/setup");
          }
        }
      }
    };

    checkProfile();
  }, [user, loading, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#ff9db2" />
      </View>
    );
  }

  return <Slot />;
}

