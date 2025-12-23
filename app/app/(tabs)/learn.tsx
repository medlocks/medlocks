import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { db } from "@/services/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import theme from "@/theme";
import AppContainer from "../../components/AppContainer";

export default function LearnScreen() {
  const router = useRouter();
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, "lessons"), orderBy("order"));
        const snap = await getDocs(q);
        setLessons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Load lessons", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <AppContainer>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <Text
        style={{
          fontSize: theme.fontSizes.xl,
          fontWeight: "800",
          color: theme.colors.text,
          marginBottom: theme.spacing.md,
        }}
      >
        Hair Academy ✨
      </Text>

      <FlatList
        data={lessons}
        keyExtractor={(i) => i.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/learn/${item.id}`)}
            activeOpacity={0.8}
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.lg,
              marginBottom: theme.spacing.md,
              ...theme.shadow.card,
            }}
          >
            <Text
              style={{
                fontSize: theme.fontSizes.lg,
                fontWeight: "700",
                color: theme.colors.text,
                marginBottom: 4,
              }}
            >
              {item.title}
            </Text>

            <Text
              style={{
                fontSize: theme.fontSizes.sm,
                color: theme.colors.textLight,
                marginBottom: 6,
              }}
            >
              {item.type === "quiz" ? "🧠 Quiz" : "📘 Lesson"} •{" "}
              {item.estimatedMinutes ?? 5} min
            </Text>

            <View
              style={{
                backgroundColor: theme.colors.primaryLight,
                alignSelf: "flex-start",
                paddingVertical: 4,
                paddingHorizontal: 10,
                borderRadius: theme.radius.sm,
              }}
            >
              <Text
                style={{
                  fontSize: theme.fontSizes.sm,
                  fontWeight: "600",
                  color: theme.colors.primary,
                }}
              >
                +{item.xpReward ?? 5} XP
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text
            style={{
              textAlign: "center",
              color: theme.colors.textLight,
              marginTop: theme.spacing.xl,
              fontSize: theme.fontSizes.md,
            }}
          >
            No lessons available yet 💭
          </Text>
        }
      />
    </AppContainer>
  );
}
