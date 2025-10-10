import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/services/firebase";

type Product = {
  id: string;
  name: string;
  description: string;
  suitableFor: string[];
  goalTags: string[];
};

const PRODUCT_DB: Product[] = [
  {
    id: "1",
    name: "Medlocks Nourish Shampoo",
    description: "Strengthens and hydrates dry or damaged hair.",
    suitableFor: ["dry", "wavy", "curly"],
    goalTags: ["hydration", "damage-repair"],
  },
  {
    id: "2",
    name: "Medlocks Smooth Serum",
    description: "Adds shine and reduces frizz for sleek styles.",
    suitableFor: ["straight", "frizzy", "coarse"],
    goalTags: ["shine", "frizz-control"],
  },
  {
    id: "3",
    name: "Medlocks Curl Define Cream",
    description: "Defines and holds curls without stiffness.",
    suitableFor: ["curly", "coily"],
    goalTags: ["definition", "moisture"],
  },
  {
    id: "4",
    name: "Medlocks Scalp Restore Oil",
    description: "Stimulates growth and nourishes scalp health.",
    suitableFor: ["all"],
    goalTags: ["growth", "scalp-care"],
  },
];

export default function RecommendationsScreen() {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [recommended, setRecommended] = useState<Product[]>([]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const profile = docSnap.data();
        setUserProfile(profile);

        const filtered = PRODUCT_DB.filter(
          (p) =>
            (p.suitableFor.includes(profile.hairType) || p.suitableFor.includes("all")) &&
            p.goalTags.some((g) => profile.hairGoals?.includes(g))
        );

        setRecommended(filtered);
      }

      setLoading(false);
    };

    fetchUserProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff9db2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recommended For You</Text>
      {recommended.length === 0 ? (
        <Text style={styles.empty}>No products matched yet — update your profile!</Text>
      ) : (
        <FlatList
          data={recommended}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.description}>{item.description}</Text>
              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Add to Routine</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 16 },
  empty: { textAlign: "center", color: "#888", marginTop: 50 },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#fafafa",
  },
  productName: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  description: { color: "#555", marginBottom: 12 },
  button: {
    backgroundColor: "#ff9db2",
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
