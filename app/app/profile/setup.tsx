import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "expo-router";
import { generateHairPlan } from "@/services/aiHairPlan";
import { db, auth } from "@/services/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { LinearGradient } from "expo-linear-gradient";
import theme from "@/theme";

const hairTypes = ["Straight", "Wavy", "Curly", "Coily"];
const hairGoalsOptions = ["Growth", "Health", "Volume", "Shine", "Repair"];

/* ---------------------------- */
/* ✅ VALIDATION SCHEMA */
/* ---------------------------- */
const schema = yup.object({
  hairType: yup.string().required("Select your hair type"),
  hairGoals: yup.array().of(yup.string()).min(1, "Select at least one goal"),
  washFrequency: yup.string().required("Enter wash frequency"),
  products: yup.string(),
  dateOfBirth: yup
    .string()
    .required("Date of birth is required")
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
});

/* ---------------------------- */
/* AUTH HOOK */
/* ---------------------------- */
const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { user, loading };
};

/* ---------------------------- */
/* SCREEN */
/* ---------------------------- */
export default function UserProfile() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      hairType: "",
      hairGoals: [],
      washFrequency: "",
      products: "",
      dateOfBirth: "",
    },
  });

  /* ---------------------------- */
  /* LOAD EXISTING PROFILE */
  /* ---------------------------- */
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setValue("hairType", data.hairType || "");
          setValue("hairGoals", data.hairGoals || []);
          setValue("washFrequency", data.currentRoutine?.washFrequency || "");
          setValue(
            "products",
            (data.currentRoutine?.products || []).join(", ")
          );
          setValue("dateOfBirth", data.dateOfBirth || "");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  /* ---------------------------- */
  /* SUBMIT */
  /* ---------------------------- */
  const onSubmit = async (data: any) => {
    if (!user) return;

    setSubmitting(true);

    const productsArray = data.products
      .split(",")
      .map((p: string) => p.trim())
      .filter(Boolean);

    const userDoc = {
      uid: user.uid,
      hairType: data.hairType,
      hairGoals: data.hairGoals,
      dateOfBirth: data.dateOfBirth,
      products: productsArray,
      currentRoutine: {
        washFrequency: data.washFrequency,
        products: productsArray,
      },
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, "users", user.uid), userDoc, { merge: true });
      await generateHairPlan(userDoc);
      router.replace("/(tabs)");
    } catch (err) {
      console.error("AI generation failed:", err);
      alert("Failed to generate AI hair plan.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------- */
  /* LOADING */
  /* ---------------------------- */
  if (loading || authLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ color: theme.colors.textMuted, marginTop: 12 }}>
          Loading profile...
        </Text>
      </View>
    );
  }

  /* ---------------------------- */
  /* RENDER */
  /* ---------------------------- */
  return (
    <LinearGradient
      colors={[theme.colors.background, theme.colors.surface]}
      style={styles.safe}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Your Hair Profile 💆‍♀️</Text>
          <Text style={styles.subtitle}>
            This helps us personalise your routine properly.
          </Text>

          {/* DOB */}
          <Text style={styles.label}>Date of Birth</Text>
          <Controller
            control={control}
            name="dateOfBirth"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={value}
                onChangeText={onChange}
                placeholderTextColor={theme.colors.textMuted}
              />
            )}
          />
          {errors.dateOfBirth && (
            <Text style={styles.error}>{errors.dateOfBirth.message}</Text>
          )}

          {/* Hair Type */}
          <Text style={styles.label}>Hair Type</Text>
          <Controller
            control={control}
            name="hairType"
            render={({ field: { value, onChange } }) => (
              <View style={styles.optionContainer}>
                {hairTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.option,
                      value === type && styles.optionSelected,
                    ]}
                    onPress={() => onChange(type)}
                  >
                    <Text
                      style={
                        value === type
                          ? styles.optionTextSelected
                          : styles.optionText
                      }
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />

          {/* Hair Goals — ✅ FIXED */}
          <Text style={styles.label}>Hair Goals</Text>
          <Controller
            control={control}
            name="hairGoals"
            render={({ field: { value, onChange } }) => {
              const goals: string[] = (value ?? []).filter(
  (g): g is string => typeof g === "string"
);


              return (
                <View style={styles.optionContainer}>
                  {hairGoalsOptions.map((goal) => {
                    const selected = goals.includes(goal);

                    return (
                      <TouchableOpacity
                        key={goal}
                        style={[
                          styles.option,
                          selected && styles.optionSelected,
                        ]}
                        onPress={() =>
                          selected
                            ? onChange(goals.filter((g) => g !== goal))
                            : onChange([...goals, goal])
                        }
                      >
                        <Text
                          style={
                            selected
                              ? styles.optionTextSelected
                              : styles.optionText
                          }
                        >
                          {goal}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            }}
          />

          {/* Wash Frequency */}
          <Text style={styles.label}>Wash Frequency</Text>
          <Controller
            control={control}
            name="washFrequency"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="e.g. 3x/week"
                value={value}
                onChangeText={onChange}
              />
            )}
          />

          {/* Products */}
          <Text style={styles.label}>Current Products</Text>
          <Controller
            control={control}
            name="products"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Shampoo X, Conditioner Y"
                value={value}
                onChangeText={onChange}
              />
            )}
          />

          {/* SUBMIT */}
          <TouchableOpacity onPress={handleSubmit(onSubmit)}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.accent]}
              style={styles.button}
            >
              <Text style={styles.buttonText}>
                {submitting ? "Generating..." : "Save & Generate Plan"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ---------------------------- */
/* STYLES */
/* ---------------------------- */
const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: theme.spacing.lg },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 26, fontWeight: "800", textAlign: "center" },
  subtitle: { textAlign: "center", marginBottom: 16 },
  label: { fontWeight: "600", marginTop: 16 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 6,
    backgroundColor: "#fff",
  },
  optionContainer: { flexDirection: "row", flexWrap: "wrap" },
  option: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 10,
    margin: 4,
  },
  optionSelected: { backgroundColor: theme.colors.primary },
  optionText: { color: theme.colors.text },
  optionTextSelected: { color: "#fff", fontWeight: "700" },
  button: { marginTop: 24, padding: 16, borderRadius: 16 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "700" },
  error: { color: theme.colors.error },
});
