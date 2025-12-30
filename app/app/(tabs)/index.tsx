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
  serverTimestamp,
} from "firebase/firestore";
import { Button } from "react-native-paper";
import theme from "@/theme";
import AppContainer from "../../components/AppContainer";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { updateStreakForDay } from "@/services/streaks";

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
  const [streak, setStreak] = useState(0);
  const [showWeeklyCheckIn] = useState(true);

  const todayKey = new Date().toISOString().split("T")[0];

  /**
   * 1️⃣ LOAD PLAN + TODAY TASKS
   */
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

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

      // 👉 Rolling plan: today = index 0
      setTodayTasks([routine[0]]);

      // Load completion state
      const completionSnap = await getDoc(
        doc(db, "users", user.uid, "dailyCompletions", todayKey)
      );

      if (completionSnap.exists()) {
        setCompleted(completionSnap.data().completedActions || []);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  /**
   * 2️⃣ AUTO-COMPLETE DAYS WITH NO TASKS
   */
  useEffect(() => {
    if (!user || loading) return;

    if (todayTasks.length === 0) {
      const autoCompleteDay = async () => {
        const ref = doc(
          db,
          "users",
          user.uid,
          "dailyCompletions",
          todayKey
        );

        const snap = await getDoc(ref);

        if (!snap.exists()) {
          await setDoc(ref, {
            autoCompleted: true,
            date: todayKey,
            updatedAt: serverTimestamp(),
          });

          await updateStreakForDay(user.uid, todayKey);
        }
      };

      autoCompleteDay();
    }
  }, [todayTasks, loading]);

  /**
   * 3️⃣ LOAD CURRENT STREAK
   */
  useEffect(() => {
    if (!user) return;

    const loadStreak = async () => {
      const snap = await getDoc(
        doc(db, "users", user.uid, "stats", "streak")
      );

      if (snap.exists()) {
        setStreak(snap.data().currentStreak || 0);
      }
    };

    loadStreak();
  }, []);

  /**
   * 4️⃣ TOGGLE TASK COMPLETION + UPDATE STREAK
   */
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
      {
        completedActions: newCompleted,
        date: todayKey,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    const allTasksDone =
      todayTasks.length > 0 &&
      todayTasks.every(t => newCompleted.includes(t.action));

    if (allTasksDone) {
      await updateStreakForDay(user.uid, todayKey);
    }
  };

  /**
   * LOADING STATE
   */
  if (loading) {
    return (
      <AppContainer>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </AppContainer>
    );
  }

  /**
   * NO PLAN STATE
   */
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

  /**
   * MAIN UI
   */
  return (
    <AppContainer>
      {showWeeklyCheckIn && (
        <View
          style={{
            backgroundColor: theme.colors.primary,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.lg,
          }}
        >
          <Text
            style={{
              fontSize: theme.fontSizes.lg,
              fontWeight: "800",
              color: "#fff",
              marginBottom: theme.spacing.xs,
            }}
          >
            ✨ Weekly Hair Check-In
          </Text>

          <Text
            style={{
              fontSize: theme.fontSizes.sm,
              color: "rgba(255,255,255,0.9)",
              marginBottom: theme.spacing.md,
            }}
          >
            Tell your AI coach how your hair felt this week.
          </Text>

          <Button
            mode="contained"
            onPress={() => router.push("../checkin")}
            style={{ backgroundColor: "#fff" }}
            labelStyle={{ color: theme.colors.primary, fontWeight: "800" }}
          >
            Start Check-In →
          </Button>
        </View>
      )}

      <Text style={{ fontSize: theme.fontSizes.xl, fontWeight: "800" }}>
        Today 💖
      </Text>
      <Text style={{ color: theme.colors.textLight, marginBottom: 12 }}>
        Small steps = great hair.
      </Text>

      <Text style={{ fontSize: 22, fontWeight: "800", marginBottom: 12 }}>
        🔥 {streak} day streak
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
          <Text style={{ fontWeight: "800", color: "#1E7F4F" }}>
            🎉 All tasks complete!
          </Text>
          <Text style={{ color: "#1E7F4F", marginTop: 4 }}>
            Keep the streak alive ✨
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
                backgroundColor: isDone ? "#FFF0F5" : theme.colors.surface,
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
                <Text style={{ color: theme.colors.textLight, marginTop: 4 }}>
                  {item.details}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </AppContainer>
  );
}
