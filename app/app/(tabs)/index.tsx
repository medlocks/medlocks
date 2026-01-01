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
  const [tips, setTips] = useState<string[]>([]);

  const todayKey = new Date().toISOString().split("T")[0];
  const todayIndex = new Date().getDate(); // for rotating tips

  /**
   * LOAD PLAN + TODAY TASKS + TIPS
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
      setTips(data?.tips || []);

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
   * AUTO-COMPLETE DAYS WITH NO TASKS
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
   * TOGGLE TASK COMPLETION
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

  const todaysTip =
    tips.length > 0 ? tips[todayIndex % tips.length] : null;

  return (
    <AppContainer>
      <Text style={{ fontSize: 26, fontWeight: "800" }}>
        Today 💖
      </Text>

      <Text style={{ marginBottom: 16, color: "#666" }}>
        🔥 {streak} day streak
      </Text>

      {/* TASKS */}
      {todayTasks.length > 0 && (
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

      {/* HAIR COACH TIP */}
      {todaysTip && (
        <View
          style={{
            marginTop: 24,
            padding: 18,
            borderRadius: 20,
            backgroundColor: "#FFF7FA",
            borderWidth: 1,
            borderColor: "#F5C6D6",
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "800",
              marginBottom: 6,
              color: theme.colors.primary,
            }}
          >
            💡 Tip from your Hair Coach
          </Text>

          <Text
            style={{
              fontSize: 14,
              color: "#555",
              lineHeight: 20,
            }}
          >
            {todaysTip}
          </Text>
        </View>
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
