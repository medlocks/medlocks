import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "@/services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "react-native-paper";

interface Task {
  action: string;
  details: string;
  time?: string;
  day?: string;
  week?: number;
}

export default function HomeScreen() {
  const user = auth.currentUser;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasPlan, setHasPlan] = useState(false);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!user) return;

      const planRef = doc(db, "users", user.uid, "plan", "current");
      const snap = await getDoc(planRef);

      if (!snap.exists()) {
        setHasPlan(false);
        setLoading(false);
        return;
      }

      const data = snap.data();
      const routine = data?.routine || [];

      if (routine.length === 0) {
        setHasPlan(false);
        setLoading(false);
        return;
      }

      setHasPlan(true);

      // --- Determine today's tasks ---
      const today = new Date();
      const todayName = today.toLocaleDateString("en-US", { weekday: "long" });

      // Determine current week (capped at 4 weeks)
      const startDate = data.startDate ? new Date(data.startDate) : today;
      const diffDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const currentWeek = Math.min(Math.floor(diffDays / 7) + 1, 4);

      // Filter only today's tasks from the *current week*
      const todayMatches = routine.filter(
        (r: any) =>
          r.day === todayName &&
          (r.week === currentWeek || r.week === undefined)
      );

      setTodayTasks(todayMatches);
      setLoading(false);
    };

    fetchPlan();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#ff9db2" />
        </View>
      </SafeAreaView>
    );
  }

  // --- If user has NOT generated their plan yet ---
  if (!hasPlan) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.title}>Medlocks Hair Coach</Text>
          <Text style={styles.subtitle}>
            Your journey to healthy, dreamy hair starts here.
          </Text>

          <Button
            mode="contained"
            onPress={() => router.push("/profile")}
            style={styles.button}
            labelStyle={{ fontWeight: "600", fontSize: 16 }}
          >
            Get Started →
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // --- If user HAS a plan ---
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome Back 💖</Text>
        <Text style={styles.subtitle}>
          Here’s what’s on your hair care list for today:
        </Text>

        {todayTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>🎀 No tasks for today</Text>
            <Text style={styles.emptySubText}>
              Check your routine calendar to see what’s next.
            </Text>
            <Button
              mode="outlined"
              onPress={() => router.push("/routine")}
              textColor="#ff9db2"
              style={styles.outlinedButton}
            >
              View Full Plan
            </Button>
          </View>
        ) : (
          <FlatList
            data={todayTasks}
            keyExtractor={(item, idx) => `${idx}-${item.action}`}
            renderItem={({ item }) => (
              <View style={styles.taskCard}>
                <Text style={styles.taskAction}>{item.action}</Text>
                <Text style={styles.taskDetails}>{item.details}</Text>
                {item.time && <Text style={styles.taskTime}>⏰ {item.time}</Text>}
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}
      </View>
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
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    color: "#222",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: "#ff9db2",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  outlinedButton: {
    borderColor: "#ff9db2",
    borderWidth: 1.5,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 16,
  },
  taskCard: {
    width: "100%",
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  taskAction: { fontSize: 16, fontWeight: "700", color: "#333" },
  taskDetails: { fontSize: 14, color: "#666", marginTop: 4 },
  taskTime: { fontSize: 13, color: "#999", marginTop: 8 },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#555",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 15,
    color: "#888",
    textAlign: "center",
    paddingHorizontal: 10,
  },
});
