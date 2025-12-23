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
import theme from "@/theme";

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

  const handleGenerateAI = () => router.push("../profile/setup");
  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Your Hair Profile</Text>

      {/* Info section */}
      <View style={styles.card}>
        <ProfileField
          label="Email"
          value={profile?.email}
          editable={false}
        />
        <ProfileField
          label="Hair Type"
          value={profile?.hairType}
          placeholder="e.g. Curly, Wavy, Straight"
          onChangeText={(t: any) => setProfile({ ...profile, hairType: t })}
        />
        <ProfileField
          label="Hair Goals"
          value={
            Array.isArray(profile?.hairGoals)
              ? profile.hairGoals.join(", ")
              : profile?.hairGoals || ""
          }
          placeholder="e.g. Growth, Frizz Control"
          onChangeText={(t: any) => setProfile({ ...profile, hairGoals: t })}
        />
        <ProfileField
          label="Wash Frequency"
          value={profile?.washFrequency}
          placeholder="e.g. 2–3 times a week"
          onChangeText={(t: any) => setProfile({ ...profile, washFrequency: t })}
        />

        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          style={styles.saveButton}
          labelStyle={styles.saveLabel}
        >
          Save Preferences
        </Button>
      </View>

      {/* AI Section */}
      <View style={[styles.card, styles.aiCard]}>
        <Text style={styles.aiTitle}>✨ Your Routine</Text>
        {profile?.hasPlan ? (
          <>
            <Text style={styles.aiText}>
              Your personalized plan is active and synced with your hair goals.
            </Text>
            <Button
              mode="outlined"
              onPress={() => router.push("/routine")}
              textColor={theme.colors.primary}
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
              labelStyle={styles.saveLabel}
            >
              Generate My AI Routine →
            </Button>
          </>
        )}
      </View>

      {/* Logout */}
      <Button
        mode="outlined"
        textColor={theme.colors.error}
        onPress={handleLogout}
        style={styles.logoutButton}
      >
        Logout
      </Button>
    </ScrollView>
  );
}

function ProfileField({ label, value, onChangeText, editable = true, placeholder }: any) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, !editable && styles.disabled]}
        value={value}
        editable={editable}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textLight}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  title: {
    fontSize: theme.fontSizes.xl,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: theme.spacing.xl,
    color: theme.colors.text,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    ...theme.shadow.card,
  },
  section: { marginBottom: theme.spacing.md },
  label: {
    fontSize: theme.fontSizes.sm,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
  },
  disabled: { backgroundColor: "#f0f0f0", color: "#999" },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    marginTop: theme.spacing.md,
  },
  saveLabel: { fontWeight: "600", fontSize: 16 },
  aiCard: { alignItems: "center" },
  aiTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: "700",
    marginBottom: theme.spacing.sm,
  },
  aiText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textLight,
    textAlign: "center",
    marginBottom: theme.spacing.md,
  },
  aiButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.sm,
  },
  outlinedButton: {
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.sm,
  },
  logoutButton: {
    borderColor: theme.colors.primary,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    marginBottom: 80,
  },
});
