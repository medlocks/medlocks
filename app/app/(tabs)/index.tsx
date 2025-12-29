import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "@/services/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { Button } from "react-native-paper";
import theme from "@/theme";
import AppContainer from "../../components/AppContainer";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Task {
  action: string;
  details: string;
  time?: string;
}

export default function HomeScreen() {
  const user = auth.currentUser;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [hasPlan, setHasPlan] = useState(false);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);

  const todayKey = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // 1️⃣ Load plan
      const planSnap = await getDoc(
        doc(db, "users", user.uid, "plan", "current")
      );

      if (!planSnap.exists()) {
        setHasPlan(false);
        setLoading(false);
        return;
      }

      const routine = planSnap.data()?.routine || [];
      if (routine.length === 0) {
        setHasPlan(false);
        setLoading(false);
        return;
      }

      setHasPlan(true);

      // Today = index 0 of rolling plan
      setTodayTasks([routine[0]]);

      // 2️⃣ Load completion state
      const completionRef = doc(
        db,
        "users",
        user.uid,
        "dailyCompletions",
        todayKey
      );
      const completionSnap = await getDoc(completionRef);

      if (completionSnap.exists()) {
        setCompleted(completionSnap.data().completedActions || []);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const toggleComplete = async (action: string) => {
    if (!user) return;

    const ref = doc(
      db,
      "users",
      user.uid,
      "dailyCompletions",
      todayKey
    );

    const newCompleted = completed.includes(action)
      ? completed.filter(a => a !== action)
      : [...completed, action];

    setCompleted(newCompleted);

    await setDoc(
      ref,
      { completedActions: newCompleted },
      { merge: true }
    );
  };

  // --- LOADING ---
  if (loading) {
    return (
      <AppContainer>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </AppContainer>
    );
  }

  // --- NO PLAN ---
  if (!hasPlan) {
    return (
      <AppContainer>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: theme.fontSizes.xl, fontWeight: "800" }}>
            Medlocks Hair Coach
          </Text>
          <Text
            style={{
              marginVertical: theme.spacing.md,
              color: theme.colors.textLight,
              textAlign: "center",
            }}
          >
            Your journey to healthy hair starts here.
          </Text>
          <Button mode="contained" onPress={() => router.push("/profile")}>
            Get Started →
          </Button>
        </View>
      </AppContainer>
    );
  }

  const allDone =
    todayTasks.length > 0 &&
    todayTasks.every(t => completed.includes(t.action));

  return (
    <AppContainer>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: theme.fontSizes.xl, fontWeight: "800" }}>
          Today 💖
        </Text>
        <Text style={{ color: theme.colors.textLight, marginBottom: 16 }}>
          Small steps = great hair.
        </Text>

        {allDone && (
          <View
            style={{
              backgroundColor: "#E8F7EE",
              borderRadius: theme.radius.lg,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.md,
            }}
          >
            <Text
              style={{
                fontWeight: "800",
                color: "#1E7F4F",
                fontSize: theme.fontSizes.md,
              }}
            >
              🎉 All tasks complete!
            </Text>
            <Text style={{ color: "#1E7F4F", marginTop: 4 }}>
              Your hair thanks you. Keep the streak alive ✨
            </Text>
          </View>
        )}

        <FlatList
          data={todayTasks}
          keyExtractor={item => item.action}
          renderItem={({ item }) => {
            const isDone = completed.includes(item.action);

            return (
              <TouchableOpacity
                onPress={() => toggleComplete(item.action)}
                activeOpacity={0.85}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isDone
                    ? "#FFF0F5"
                    : theme.colors.surface,
                  borderRadius: theme.radius.lg,
                  padding: theme.spacing.lg,
                  marginBottom: theme.spacing.md,
                  borderWidth: 1.5,
                  borderColor: isDone
                    ? theme.colors.primary
                    : theme.colors.border,
                }}
              >
                <MaterialCommunityIcons
                  name={
                    isDone
                      ? "checkbox-marked-circle"
                      : "checkbox-blank-circle-outline"
                  }
                  size={28}
                  color={
                    isDone ? theme.colors.primary : theme.colors.textLight
                  }
                  style={{ marginRight: 14 }}
                />

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: theme.fontSizes.md,
                      fontWeight: "700",
                      textDecorationLine: isDone
                        ? "line-through"
                        : "none",
                    }}
                  >
                    {item.action}
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.textLight,
                      marginTop: 4,
                    }}
                  >
                    {item.details}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </AppContainer>
  );
}
