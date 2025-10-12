import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { db, auth } from "@/services/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "expo-router";
import { generateHairPlan } from "../../services/aiHairPlan";

const hairTypes = ["Straight", "Wavy", "Curly", "Coily"];
const hairGoalsOptions = ["Growth", "Health", "Volume", "Shine", "Repair"];

const schema = yup.object().shape({
  hairType: yup.string().required("Select your hair type"),
  hairGoals: yup.array().min(1, "Select at least one goal"),
  washFrequency: yup.string().required("Enter wash frequency"),
  products: yup.string(),
});

export default function UserProfile() {
  const router = useRouter();
  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      hairType: "",
      hairGoals: [],
      washFrequency: "",
      products: "",
    },
  });

  const [loading, setLoading] = useState(true);
  const uid = auth.currentUser?.uid;

  // Fetch existing profile
  useEffect(() => {
    if (!uid) return;

    const fetchProfile = async () => {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setValue("hairType", data.hairType || "");
        setValue("hairGoals", data.hairGoals || []);
        setValue("washFrequency", data.currentRoutine?.washFrequency || "");
        setValue("products", (data.currentRoutine?.products || []).join(", "));
      }
      setLoading(false);
    };

    fetchProfile();
  }, [uid]);

  const onSubmit = async (data: any) => {
    if (!uid) return;

    const userDoc = {
      hairType: data.hairType,
      hairGoals: data.hairGoals,
      currentRoutine: {
        washFrequency: data.washFrequency,
        products: data.products.split(",").map((p: string) => p.trim()),
      },
      updatedAt: new Date(),
    };

    // Save user profile
    await setDoc(doc(db, "users", uid), userDoc, { merge: true });

    try {
      // --- AI Integration: generate bespoke hair plan ---
      const aiPlan = await generateHairPlan({
        hairType: data.hairType,
        hairGoals: data.hairGoals,
        currentRoutine: userDoc.currentRoutine,
        products: userDoc.currentRoutine.products,
      });

      // Save AI-generated plan to Firestore
      await setDoc(doc(db, "users", uid), { hairPlan: aiPlan }, { merge: true });

    } catch (err: any) {
      console.error("AI generation failed:", err.message);
    }

    router.replace("/(tabs)"); // Go to main app
  };

  if (loading) {
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
                <Text style={value === type ? styles.optionTextSelected : styles.optionText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />
      {errors.hairType && <Text style={styles.error}>{errors.hairType.message}</Text>}

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
                    if (selected) onChange(value?.filter((g: string) => g !== goal));
                    else onChange([...(value || []), goal]);
                  }}
                >
                  <Text style={selected ? styles.optionTextSelected : styles.optionText}>{goal}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      />
      {errors.hairGoals && <Text style={styles.error}>{errors.hairGoals.message}</Text>}

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
      {errors.washFrequency && <Text style={styles.error}>{errors.washFrequency.message}</Text>}

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

      <Button title="Save Profile & Generate Plan" onPress={handleSubmit(onSubmit)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flexGrow: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 16, textAlign: "center" },
  label: { fontSize: 16, fontWeight: "600", marginTop: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 12 },
  optionContainer: { flexDirection: "row", flexWrap: "wrap", marginVertical: 8 },
  option: { borderWidth: 1, borderColor: "#ccc", borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, margin: 4 },
  optionSelected: { backgroundColor: "#ff9db2", borderColor: "#ff9db2" },
  optionText: { color: "#000" },
  optionTextSelected: { color: "#fff", fontWeight: "700" },
  error: { color: "red", marginBottom: 6 },
});
