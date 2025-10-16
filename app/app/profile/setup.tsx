import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "expo-router";
import { generateHairPlan } from "@/services/aiHairPlan";
import { db, auth } from "@/services/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

// ------------------ Auth Hook ------------------
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

// ------------------ Validation ------------------
const hairTypes = ["Straight", "Wavy", "Curly", "Coily"];
const hairGoalsOptions = ["Growth", "Health", "Volume", "Shine", "Repair"];

const schema = yup.object().shape({
  hairType: yup.string().required("Select your hair type"),
  hairGoals: yup.array().min(1, "Select at least one goal"),
  washFrequency: yup.string().required("Enter wash frequency"),
  products: yup.string(),
});

// ------------------ Component ------------------
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

  // Fetch user profile from Firestore
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

  // Handle form submission + AI generation
  const onSubmit = async (data: any) => {
    if (authLoading) {
      alert("Auth is still loading, please wait.");
      return;
    }
    if (!user) {
      alert("You must be logged in to generate a hair plan.");
      return;
    }

    setSubmitting(true);

    const productsArray = data.products
      .split(",")
      .map((p: string) => p.trim())
      .filter((p: string) => p.length > 0);

    const userDoc = {
      hairType: data.hairType,
      hairGoals: data.hairGoals,
      currentRoutine: {
        washFrequency: data.washFrequency,
        products: productsArray,
      },
      products: productsArray,
      updatedAt: new Date(),
      uid: user.uid,
    };

    try {
      // 1️⃣ Save user profile
      await setDoc(doc(db, "users", user.uid), userDoc, { merge: true });

      // 2️⃣ Generate AI Hair Plan
      console.log("🧠 Sending AI request payload:", userDoc);

      const aiPlan = await generateHairPlan(userDoc);

      console.log("✅ AI Hair Plan received:", aiPlan);

      // 3️⃣ Save AI-generated plan
      await setDoc(
        doc(db, "users", user.uid),
        { hairPlan: aiPlan },
        { merge: true }
      );

      router.replace("/(tabs)");
    } catch (err: any) {
      console.error("💥 AI generation failed:", err);
      alert("Failed to generate AI hair plan. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <View style={styles.loading}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  const selectedGoals = watch("hairGoals");

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Your Hair Profile</Text>

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
                style={[styles.option, value === type && styles.optionSelected]}
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
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => {
                    if (selected)
                      onChange(value?.filter((g: string) => g !== goal));
                    else onChange([...(value || []), goal]);
                  }}
                >
                  <Text
                    style={
                      selected ? styles.optionTextSelected : styles.optionText
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
          />
        )}
      />
      {errors.washFrequency && (
        <Text style={styles.error}>{errors.washFrequency.message}</Text>
      )}

      {/* Products */}
      <Text style={styles.label}>Current Products (comma separated)</Text>
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

      <Button
        title={
          submitting ? "Generating AI Hair Plan..." : "Save Profile & Generate Plan"
        }
        onPress={handleSubmit(onSubmit)}
        disabled={submitting}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flexGrow: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 16, textAlign: "center" },
  label: { fontSize: 16, fontWeight: "600", marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  optionContainer: { flexDirection: "row", flexWrap: "wrap", marginVertical: 8 },
  option: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
  },
  optionSelected: { backgroundColor: "#ff9db2", borderColor: "#ff9db2" },
  optionText: { color: "#000" },
  optionTextSelected: { color: "#fff", fontWeight: "700" },
  error: { color: "red", marginBottom: 6 },
});
