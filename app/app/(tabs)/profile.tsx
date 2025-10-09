import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/services/firebase";
import { logout } from "@/services/auth";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<any>(null);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      email: user?.email || "",
      hairType: "",
      goals: "",
      routine: "",
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const docRef = doc(db, "users", user.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setInitialData(snap.data());
        reset(snap.data());
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const onSubmit = async (data: any) => {
    try {
      await updateDoc(doc(db, "users", user!.uid), data);
      Alert.alert("Success", "Profile updated!");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Profile</Text>

      <Controller
        control={control}
        name="email"
        render={({ field: { value } }) => (
          <TextInput style={[styles.input, styles.disabled]} value={value} editable={false} />
        )}
      />

      <Controller
        control={control}
        name="hairType"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Hair Type (e.g. Curly, Straight)"
            value={value}
            onChangeText={onChange}
          />
        )}
      />

      <Controller
        control={control}
        name="goals"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Goals (e.g. Growth, Shine, Repair)"
            value={value}
            onChangeText={onChange}
          />
        )}
      />

      <Controller
        control={control}
        name="routine"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={[styles.input, { height: 100 }]}
            placeholder="Your current hair routine..."
            value={value}
            onChangeText={onChange}
            multiline
          />
        )}
      />

      <Button title="Save Changes" onPress={handleSubmit(onSubmit)} />
      <Button title="Logout" color="red" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 20, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  disabled: {
    backgroundColor: "#eee",
  },
});
