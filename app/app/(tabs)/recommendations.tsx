import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/services/firebase";

interface Product {
  id: string;
  name: string;
  description?: string;
}

export default function RecommendationsScreen() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchAIRecommendations = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const planRef = doc(db, "users", user.uid, "plan", "current");
      const planSnap = await getDoc(planRef);

      if (planSnap.exists()) {
        const data = planSnap.data();
        if (data?.recommendedProducts?.length) {
          const aiList = data.recommendedProducts.map((p: string, i: number) => ({
            id: `ai-${i}`,
            name: p,
            description: "Chosen for optimal hair health.",
          }));
          setProducts(aiList);
        }
      }

      setLoading(false);
    };

    fetchAIRecommendations();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff9db2" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text style={styles.title}>Your Recommended Products</Text>
        <Text style={styles.subtitle}>
          Curated exclusively for your hair type and goals 💫
        </Text>

        {products.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🧴</Text>
            <Text style={styles.emptyTitle}>No Recommendations Yet</Text>
            <Text style={styles.emptyText}>
              Generate your AI routine to see personalized product picks made just for you.
            </Text>
            <TouchableOpacity
              onPress={() => alert("Navigate to AI Generator")}
              style={styles.emptyButton}
            >
              <Text style={styles.emptyButtonText}>Generate My Routine</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>
            )}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#222",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: "#f3f3f3",
  },
  productName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 14,
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#ff9db2",
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 15,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyState: {
    alignItems: "center",
    marginTop: 80,
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: "#ff9db2",
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 14,
  },
  emptyButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});

