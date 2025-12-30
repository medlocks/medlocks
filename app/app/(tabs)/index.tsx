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

const weekdayMap: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

function nextDate(day: string, start: Date) {
  const target = weekdayMap[day];
  const d = new Date(start);
  const diff = (target + 7 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
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
   * 1️⃣ LOAD PLAN + CALCULATE TODAY TASKS (MATCHES CALENDAR)
   */
  useEffect(() => {
    const load = async () => {
      if (!user) return;

      const snap = await getDoc(
        doc(db, "users", user.uid, "plan", "current")
      );

      if (!snap.exists()) {
        setHasPlan(false);
        setLoading(false);
        return;
      }

      const data = snap.data();
      const routine = data?.routine || [];
      const start = new Date(data.createdAt || new Date());

      const tasksForToday: Task[] = [];

      routine.forEach((r: any) => {
        if (!r.day) return;
        const dateKey = nextDate(r.day, start);
        if (dateKey === todayKey) {
          tasksForToday.push({
            action: r.action,
            details: r.details,
            time: r.time,
          });
        }
      });

      setHasPlan(true);
      setTodayTasks(tasksForToday);

      // Load completion state
      const completionSnap = await getDoc(
        doc(db, "users", user.uid, "dailyCompletions", todayKey)
      );

      if (completionSnap.exists()) {
        setCompleted(completionSnap.data().completedActions || []);
      }

      setLoading(false);
    };

    load();
  }, []);

  /**
   * 2️⃣ AUTO-COMPLETE DAYS WITH ZERO TASKS
   */
  useEffect(() => {
    if (!user || loading) return;

    if (todayTasks.length === 0) {
      const autoComplete = async () => {
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

      autoComplete();
    }
  }, [todayTasks, loading]);

  /**
   * 3️⃣ LOAD STREAK
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
   * 4️⃣ TOGGLE COMPLETION
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

    const allDone =
      todayTasks.length > 0 &&
      todayTasks.every(t => newCompleted.includes(t.action));

    if (allDone) {
      await updateStreakForDay(user.uid, todayKey);
    }
  };

  if (loading) {
    return (
      <AppContainer>
        <ActivityIndicator size="large" />
      </AppContainer>
    );
  }

  if (!hasPlan) {
    return (
      <AppContainer>
        <View style={{ alignItems: "center", marginTop: 80 }}>
          <Text style={{ fontSize: 22, fontWeight: "800" }}>
            Medlocks Hair Coach
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
      <Text style={{ fontSize: 22, fontWeight: "800" }}>
        Today 💖
      </Text>

      <Text style={{ marginBottom: 8 }}>
        🔥 {streak} day streak
      </Text>

      {allDone && (
        <Text style={{ color: "#1E7F4F", marginBottom: 12 }}>
          🎉 All tasks complete!
        </Text>
      )}

      <FlatList
        data={todayTasks}
        keyExtractor={i => i.action}
        renderItem={({ item }) => {
          const isDone = completed.includes(item.action);
          return (
            <TouchableOpacity
              onPress={() => toggleComplete(item.action)}
              style={{
                padding: 16,
                borderRadius: 14,
                marginBottom: 12,
                backgroundColor: isDone ? "#FFF0F5" : "#fff",
              }}
            >
              <Text style={{ fontWeight: "700" }}>
                {item.action}
              </Text>
              <Text>{item.details}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </AppContainer>
  );
}