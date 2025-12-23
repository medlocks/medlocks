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
import theme from "@/theme";

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
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.spacing.xl * 2 }}
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
              <View style={[styles.card, theme.shadow.card]}>
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
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSizes.xl,
    fontWeight: "800",
    color: theme.colors.text,
    textAlign: "center",
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textLight,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  productName: {
    fontSize: theme.fontSizes.lg,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textLight,
    lineHeight: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    marginTop: 80,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyEmoji: {
    fontSize: 50,
    marginBottom: theme.spacing.sm,
  },
  emptyTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  emptyText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textLight,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.md,
    ...theme.shadow.button,
  },
  emptyButtonText: {
    color: theme.colors.background,
    fontWeight: "700",
    fontSize: theme.fontSizes.md,
  },
});
