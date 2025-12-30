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

const schema = yup.object().shape({
  hairType: yup.string().required("Select your hair type"),
  hairGoals: yup.array().min(1, "Select at least one goal"),
  washFrequency: yup.string().required("Enter wash frequency"),
  products: yup.string(),
});

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
    },
  });

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setValue("hairType", data.hairType || "");
          setValue("hairGoals", data.hairGoals || []);
          setValue("washFrequency", data.currentRoutine?.washFrequency || "");
          setValue(
            "products",
            (data.currentRoutine?.products || []).join(", ")
          );
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const onSubmit = async (data: any) => {
    if (authLoading || !user) return alert("Please log in first.");
    setSubmitting(true);

    const productsArray = data.products
      .split(",")
      .map((p: string) => p.trim())
      .filter((p: string) => p.length > 0);

    const userDoc = {
      hairType: data.hairType,
      hairGoals: data.hairGoals,
      dateOfBirth: data.dateOfBirth,
      products: productsArray,
      currentRoutine: {
        washFrequency: data.washFrequency,
        products: productsArray,
      },
      updatedAt: new Date(),
      uid: user.uid,
    };

    try {
      await setDoc(doc(db, "users", user.uid), userDoc, { merge: true });
      const aiPlan = await generateHairPlan(userDoc);
      await setDoc(
        doc(db, "users", user.uid),
        { hairPlan: aiPlan },
        { merge: true }
      );
      router.replace("/(tabs)");
    } catch (err) {
      console.error("💥 AI generation failed:", err);
      alert("Failed to generate AI hair plan.");
    } finally {
      setSubmitting(false);
    }
  };

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

  const selectedGoals = watch("hairGoals");

  return (
    <LinearGradient
      colors={[theme.colors.background, theme.colors.surface]}
      style={styles.safe}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Your Hair Profile 💆‍♀️</Text>
          <Text style={styles.subtitle}>
            Let’s get to know your hair so we can build your perfect routine.
          </Text>

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
          {errors.hairType && (
            <Text style={styles.error}>{errors.hairType.message}</Text>
          )}

          {/* Hair Goals */}
          <Text style={styles.label}>Hair Goals</Text>
          <Controller
            control={control}
            name="hairGoals"
            render={({ field: { value, onChange } }) => (
              <View style={styles.optionContainer}>
                {hairGoalsOptions.map((goal) => {
                  const selected = value?.includes(goal);
                  return (
                    <TouchableOpacity
                      key={goal}
                      style={[
                        styles.option,
                        selected && styles.optionSelected,
                      ]}
                      onPress={() => {
                        if (selected)
                          onChange(value?.filter((g: string) => g !== goal));
                        else onChange([...(value || []), goal]);
                      }}
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
            )}
          />
          {errors.hairGoals && (
            <Text style={styles.error}>{errors.hairGoals.message}</Text>
          )}

          {/* Wash Frequency */}
          <Text style={styles.label}>Wash Frequency</Text>
          <Controller
            control={control}
            name="washFrequency"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="e.g., 3x/week"
                value={value}
                onChangeText={onChange}
                placeholderTextColor={theme.colors.textMuted}
              />
            )}
          />
          {errors.washFrequency && (
            <Text style={styles.error}>{errors.washFrequency.message}</Text>
          )}

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
                placeholderTextColor={theme.colors.textMuted}
              />
            )}
          />

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={submitting}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.button, submitting && { opacity: 0.6 }]}
            >
              <Text style={styles.buttonText}>
                {submitting ? "Generating Plan..." : "Save & Generate Plan"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: theme.fontSizes.xl,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
    color: theme.colors.text,
  },
  subtitle: {
    textAlign: "center",
    color: theme.colors.textMuted,
    fontSize: theme.fontSizes.md,
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSizes.md,
    fontWeight: "600",
    marginTop: theme.spacing.md,
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.xs,
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
    backgroundColor: "#fff",
  },
  optionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: theme.spacing.xs,
  },
  option: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 4,
    backgroundColor: theme.colors.surface,
  },
  optionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionText: { color: theme.colors.text, fontSize: theme.fontSizes.sm },
  optionTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  button: {
    marginTop: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: theme.fontSizes.md,
    fontWeight: "700",
  },
  error: {
    color: theme.colors.error,
    fontSize: theme.fontSizes.sm,
    marginTop: theme.spacing.xs,
  },
});
