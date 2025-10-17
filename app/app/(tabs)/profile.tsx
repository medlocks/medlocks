import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { Button } from "react-native-paper";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/services/firebase";
import { useRouter } from "expo-router";
import { logout } from "@/services/auth";

export default function ProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setProfile(snap.data());
        } else {
          setProfile({
            email: user.email,
            hairType: "",
            hairGoals: [],
            washFrequency: "",
          });
        }
      } catch (err: any) {
        Alert.alert("Error", err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const ref = doc(db, "users", user.uid);
      await updateDoc(ref, {
        hairType: profile.hairType || "",
        hairGoals: Array.isArray(profile.hairGoals)
          ? profile.hairGoals
          : profile.hairGoals
              .split(",")
              .map((g: string) => g.trim())
              .filter(Boolean),
        currentRoutine: {
          washFrequency: profile.washFrequency || "",
        },
        updatedAt: new Date(),
      });
      Alert.alert("Saved", "Your preferences have been updated!");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Couldn't update your profile");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAI = () => {
    router.push("../profile/setup"); 
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff9db2" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Your Hair Profile</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Email</Text>
        <TextInput style={[styles.input, styles.disabled]} value={profile?.email} editable={false} />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Hair Type</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Curly, Wavy, Straight"
          value={profile?.hairType || ""}
          onChangeText={(t) => setProfile({ ...profile, hairType: t })}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Hair Goals</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Growth, Frizz control"
          value={
            Array.isArray(profile?.hairGoals)
              ? profile.hairGoals.join(", ")
              : profile?.hairGoals || ""
          }
          onChangeText={(t) => setProfile({ ...profile, hairGoals: t })}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Wash Frequency</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 2-3 times a week"
          value={profile?.washFrequency || ""}
          onChangeText={(t) => setProfile({ ...profile, washFrequency: t })}
        />
      </View>

      <Button
        mode="contained"
        onPress={handleSave}
        loading={saving}
        style={styles.saveButton}
        labelStyle={{ fontWeight: "600" }}
      >
        Save Preferences
      </Button>

      <View style={styles.divider} />

      <View style={styles.aiSection}>
        <Text style={styles.aiTitle}>✨ Your Routine</Text>
        {profile?.hasPlan ? (
          <>
            <Text style={styles.aiText}>
              Your personalized plan is active and synced with your hair goals.
            </Text>
            <Button
              mode="outlined"
              onPress={() => router.push("/routine")}
              textColor="#ff9db2"
              style={styles.outlinedButton}
            >
              View Routine
            </Button>
          </>
        ) : (
          <>
            <Text style={styles.aiText}>
              You haven’t generated your AI plan yet. Let’s build one that adapts to your hair type
              and lifestyle.
            </Text>
            <Button
              mode="contained"
              onPress={handleGenerateAI}
              style={styles.aiButton}
              labelStyle={{ fontWeight: "600" }}
            >
              Generate My AI Routine →
            </Button>
          </>
        )}
      </View>

      <View style={styles.divider} />

      <Button
        mode="outlined"
        textColor="red"
        onPress={handleLogout}
        style={styles.logoutButton}
      >
        Logout
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 20, textAlign: "center" },
  section: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#444", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fafafa",
  },
  disabled: { backgroundColor: "#f0f0f0", color: "#999" },
  saveButton: {
    backgroundColor: "#ff9db2",
    borderRadius: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 20 },
  aiSection: { alignItems: "center" },
  aiTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  aiText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  aiButton: {
    backgroundColor: "#ff9db2",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  outlinedButton: {
    borderColor: "#ff9db2",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  logoutButton: {
    borderColor: "#ff9db2",
    borderWidth: 1,
    marginBottom: 40,
  },
});
