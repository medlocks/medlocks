import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  FlatList,
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
  const [productInput, setProductInput] = useState("");

  const { control, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      email: user?.email || "",
      hairType: "",
      goals: "",
      routine: "",
      products: [] as string[],
    },
  });

  const products: string[] = watch("products") || [];

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, "users", user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          const productsFromDb =
            data.products && Array.isArray(data.products)
              ? data.products
              : typeof data.products === "string"
              ? data.products.split(",").map((s: string) => s.trim()).filter(Boolean)
              : [];

          const resetObj = {
            email: data.email || user.email || "",
            hairType: data.hairType || "",
            goals: Array.isArray(data.goals) ? data.goals.join(", ") : data.goals || "",
            routine: data.currentRoutine?.routine || data.routine || "",
            products: productsFromDb,
          };

          setInitialData(data);
          reset(resetObj);
          setValue("products", productsFromDb);
        } else {
          reset({
            email: user.email || "",
            hairType: "",
            goals: "",
            routine: "",
            products: [],
          });
        }
      } catch (err: any) {
        Alert.alert("Error", err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user, reset, setValue]);

  const onAddProduct = () => {
    const value = productInput.trim();
    if (!value) return;
    if (products.includes(value)) {
      setProductInput("");
      return;
    }
    const next = [...products, value];
    setValue("products", next);
    setProductInput("");
  };

  const onRemoveProduct = (p: string) => {
    const next = products.filter((x) => x !== p);
    setValue("products", next);
  };

  const onSubmit = async (data: any) => {
    try {
      if (!user) throw new Error("Not authenticated");
      const payload: any = {
        email: data.email || user.email,
        hairType: data.hairType || "",
        goals: data.goals ? data.goals.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        currentRoutine: {
          routine: data.routine || "",
        },
        products: Array.isArray(data.products) ? data.products : (data.products || "").split(",").map((s: string) => s.trim()).filter(Boolean),
        updatedAt: new Date(),
      };

      await updateDoc(doc(db, "users", user.uid), payload);
      Alert.alert("Success", "Profile updated!");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save profile");
    }
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
            placeholder="Goals (comma separated: Growth, Shine)"
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

      <Text style={styles.label}>Products you use</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="e.g. Olaplex No.3"
          value={productInput}
          onChangeText={setProductInput}
        />
        <View style={{ width: 12 }} />
        <Button title="Add" onPress={onAddProduct} />
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item}
        horizontal={false}
        numColumns={3}
        contentContainerStyle={{ paddingTop: 8 }}
        renderItem={({ item }) => (
          <View style={styles.chipContainer}>
            <Text style={styles.chipText}>{item}</Text>
            <TouchableOpacity style={styles.chipRemove} onPress={() => onRemoveProduct(item)}>
              <Text style={styles.chipRemoveText}>×</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <View style={{ height: 12 }} />
      <Button title="Save Changes" onPress={handleSubmit(onSubmit)} />
      <View style={{ height: 8 }} />
      <Button title="Logout" color="red" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 12, textAlign: "center" },
  label: { fontSize: 14, fontWeight: "600", marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  disabled: {
    backgroundColor: "#f2f2f2",
  },
  chipContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f6f6f6",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    margin: 6,
  },
  chipText: {
    fontSize: 13,
    marginRight: 8,
  },
  chipRemove: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ff9db2",
  },
  chipRemoveText: {
    color: "#fff",
    fontWeight: "700",
    lineHeight: 18,
  },
  row: { flexDirection: "row", alignItems: "center" },
});
