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

  const todayKey = new Date().toISOString().split("T")[0];

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

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid, "stats", "streak")).then(snap => {
      if (snap.exists()) setStreak(snap.data().currentStreak || 0);
    });
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
      <Text style={{ fontSize: 24, fontWeight: "800" }}>
        Today 💖
      </Text>

      <Text style={{ marginBottom: 12 }}>
        🔥 {streak} day streak
      </Text>

      {todayTasks.length === 0 ? (
        <View style={{ marginTop: 40, alignItems: "center" }}>
          <MaterialCommunityIcons
            name="school"
            size={48}
            color={theme.colors.primary}
          />
          <Text style={{ fontSize: 18, fontWeight: "700", marginTop: 12 }}>
            No tasks today
          </Text>
          <Text
            style={{
              textAlign: "center",
              color: "#666",
              marginVertical: 8,
            }}
          >
            Why not level up your hair knowledge while your routine does its
            thing?
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push("/learn")}
          >
            Visit Hair Academy
          </Button>
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
                style={{
                  padding: 16,
                  borderRadius: 16,
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
      )}

      {allDone && (
        <Text style={{ color: "#1E7F4F", marginTop: 12 }}>
          🎉 All tasks complete!
        </Text>
      )}
    </AppContainer>
  );
}
