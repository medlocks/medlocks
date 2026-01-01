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

  const todayKey = new Date().toISOString().split("T")[0];

  /**
   * LOAD PLAN + TODAY TASKS
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

      const tasks: Task[] = [];

      routine.forEach((r: any) => {
        if (!r.day) return;
        if (nextDate(r.day, start) === todayKey) {
          tasks.push({
            action: r.action,
            details: r.details,
            time: r.time,
          });
        }
      });

      setHasPlan(true);
      setTodayTasks(tasks);

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
   * AUTO-COMPLETE NO-TASK DAYS (STREAK SAFE)
   */
  useEffect(() => {
    if (!user || loading) return;

    if (todayTasks.length === 0) {
      const ref = doc(
        db,
        "users",
        user.uid,
        "dailyCompletions",
        todayKey
      );

      getDoc(ref).then(snap => {
        if (!snap.exists()) {
          setDoc(ref, {
            autoCompleted: true,
            date: todayKey,
            updatedAt: serverTimestamp(),
          }).then(() => updateStreakForDay(user.uid, todayKey));
        }
      });
    }
  }, [todayTasks, loading]);

  /**
   * LOAD STREAK
   */
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid, "stats", "streak")).then(snap => {
      if (snap.exists()) {
        setStreak(snap.data().currentStreak || 0);
      }
    });
  }, []);

  /**
   * TOGGLE TASK
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

    const updated = completed.includes(action)
      ? completed.filter(a => a !== action)
      : [...completed, action];

    setCompleted(updated);

    await setDoc(
      ref,
      {
        completedActions: updated,
        date: todayKey,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    if (
      todayTasks.length > 0 &&
      todayTasks.every(t => updated.includes(t.action))
    ) {
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
        </View>
      </AppContainer>
    );
  }

  const allDone =
    todayTasks.length > 0 &&
    todayTasks.every(t => completed.includes(t.action));

  return (
    <AppContainer>
      <Text style={{ fontSize: 26, fontWeight: "800" }}>
        Today 💖
      </Text>

      <Text style={{ marginBottom: 16, color: "#666" }}>
        🔥 {streak} day streak
      </Text>

      {/* 🌸 EMPTY DAY — CLEAN GIRL ACADEMY CTA */}
      {todayTasks.length === 0 ? (
        <View
          style={{
            marginTop: 48,
            alignItems: "center",
            paddingHorizontal: 24,
          }}
        >
          <MaterialCommunityIcons
            name="flower-outline"
            size={52}
            color={theme.colors.primary}
          />

          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              marginTop: 14,
            }}
          >
            No hair tasks today
          </Text>

          <Text
            style={{
              textAlign: "center",
              color: "#777",
              marginTop: 8,
              lineHeight: 20,
            }}
          >
            Your routine is working quietly ✨  
            Take a moment to learn something new.
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/learn")}
            activeOpacity={0.85}
            style={{
              marginTop: 20,
              backgroundColor: "#FFF0F5", // soft pink
              paddingVertical: 14,
              paddingHorizontal: 26,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: theme.colors.primary,
            }}
          >
            <Text
              style={{
                color: theme.colors.primary,
                fontWeight: "700",
                fontSize: 15,
                letterSpacing: 0.3,
              }}
            >
              Visit Hair Academy
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={todayTasks}
          keyExtractor={i => i.action}
          renderItem={({ item }) => {
            const isDone = completed.includes(item.action);
            return (
              <TouchableOpacity
                onPress={() => toggleComplete(item.action)}
                activeOpacity={0.85}
                style={{
                  padding: 18,
                  borderRadius: 18,
                  marginBottom: 12,
                  backgroundColor: isDone ? "#FFF0F5" : "#FFFFFF",
                  borderWidth: 1,
                  borderColor: isDone
                    ? theme.colors.primary
                    : "#EFEFEF",
                }}
              >
                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 16,
                    textDecorationLine: isDone
                      ? "line-through"
                      : "none",
                  }}
                >
                  {item.action}
                </Text>
                <Text style={{ color: "#666", marginTop: 4 }}>
                  {item.details}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {allDone && (
        <Text
          style={{
            color: "#1E7F4F",
            marginTop: 12,
            fontWeight: "600",
          }}
        >
          🎉 All tasks complete — your hair loves you
        </Text>
      )}
    </AppContainer>
  );
}
