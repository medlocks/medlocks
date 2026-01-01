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
   * LOAD PLAN + TODAY TASKS (MATCHES CALENDAR)
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
   * AUTO-COMPLETE NO-TASK DAYS
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
   * TOGGLE COMPLETION
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
      {/* HEADER */}
      <Text style={{ fontSize: 26, fontWeight: "800" }}>
        Today 💖
      </Text>

      <Text style={{ marginBottom: 16, color: "#777" }}>
        🔥 {streak} day streak
      </Text>

      {/* TASKS */}
      {todayTasks.length > 0 ? (
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
      ) : (
        <View
          style={{
            backgroundColor: "#FFF7FA",
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: "#F4C6D8",
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontWeight: "800",
              fontSize: 16,
              marginBottom: 6,
            }}
          >
            No hair tasks today 🌸
          </Text>
          <Text style={{ color: "#666", lineHeight: 20 }}>
            Rest days matter too. Your consistency is what keeps your hair
            thriving.
          </Text>
        </View>
      )}

      {/* ALL DONE MESSAGE */}
      {allDone && (
        <Text
          style={{
            color: "#1E7F4F",
            marginBottom: 16,
            fontWeight: "600",
          }}
        >
          🎉 All tasks complete — streak secured
        </Text>
      )}

      {/* HAIR FEEDBACK CTA */}
      <TouchableOpacity
        onPress={() => router.push("./feedback")}
        activeOpacity={0.85}
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 20,
          padding: 18,
          borderWidth: 1,
          borderColor: "#F2D6E2",
          marginTop: 8,
        }}
      >
        <Text
          style={{
            fontSize: 15,
            fontWeight: "800",
            color: theme.colors.primary,
            marginBottom: 4,
          }}
        >
          💭 Review your Hair Feedback
        </Text>
        <Text style={{ color: "#666", lineHeight: 20 }}>
          See how your hair has been responding and help your coach personalise
          what’s next.
        </Text>
      </TouchableOpacity>
    </AppContainer>
  );
}
