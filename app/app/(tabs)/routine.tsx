import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { auth, db } from "@/services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "react-native-paper";
import { useRouter } from "expo-router";

interface Task {
  action: string;
  details: string;
  time?: string;
}

export default function RoutineScreen() {
  const user = auth.currentUser;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [tasksByDate, setTasksByDate] = useState<Record<string, Task[]>>({});

  useEffect(() => {
    const fetchRoutine = async () => {
      if (!user) return;
      const docRef = doc(db, "users", user.uid, "plan", "current");
      const snap = await getDoc(docRef);

      if (!snap.exists()) {
        setLoading(false);
        return;
      }

      const data = snap.data();
      const map: Record<string, Task[]> = {};

      const getDayOffset = (day: string) => {
        const days = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        return days.indexOf(day);
      };

      const planStart = new Date();

      data.routine?.forEach((r: any) => {
        const dayOffset = (r.week - 1) * 7 + getDayOffset(r.day);
        const date = new Date(planStart);
        date.setDate(date.getDate() + dayOffset);
        const key = date.toISOString().split("T")[0];
        if (!map[key]) map[key] = [];
        map[key].push({
          action: r.action,
          details: r.details,
          time: r.time || "08:00",
        });
      });

      setTasksByDate(map);
      setLoading(false);
    };

    fetchRoutine();
  }, []);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff9db2" />
      </View>
    );

  const markedDates = Object.keys(tasksByDate).reduce(
    (acc, date) => {
      acc[date] = { marked: true, dotColor: "#ff9db2" };
      return acc;
    },
    {
      [selectedDate]: { selected: true, selectedColor: "#ff9db2" },
    } as Record<string, any>
  );

  const tasks = tasksByDate[selectedDate] || [];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Your Hair Calendar</Text>

        <Calendar
          onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          theme={{
            selectedDayBackgroundColor: "#ff9db2",
            todayTextColor: "#ff9db2",
            arrowColor: "#ff9db2",
            monthTextColor: "#222",
            textDayFontWeight: "500",
            textMonthFontWeight: "700",
            textDayHeaderFontWeight: "600",
          }}
          style={styles.calendar}
        />

        {Object.keys(tasksByDate).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>😢 No tasks in your calendar yet!</Text>
            <Text style={styles.emptySubText}>
              Generate your bespoke AI routine and start your healthy hair journey today.
            </Text>
            <Button
              mode="contained"
              onPress={() => router.push("/profile")}
              style={styles.emptyButton}
            >
              Generate Routine
            </Button>
          </View>
        ) : tasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>🎀 No tasks for today</Text>
            <Text style={styles.emptySubText}>
              Check another day to see what’s next in your routine.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.dayTitle}>Tasks for {selectedDate}</Text>
            <FlatList
              data={tasks}
              keyExtractor={(item, idx) => `${idx}-${item.action}`}
              renderItem={({ item }) => (
                <View style={styles.taskCard}>
                  <Text style={styles.taskAction}>{item.action}</Text>
                  <Text style={styles.taskDetails}>{item.details}</Text>
                  <Text style={styles.taskTime}>⏰ {item.time}</Text>
                </View>
              )}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 15,
    color: "#222",
  },
  calendar: {
    borderRadius: 16,
    elevation: 3,
    backgroundColor: "#fff",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#444",
    marginBottom: 10,
    textAlign: "center",
  },
  taskCard: {
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
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#555",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  emptyButton: {
    backgroundColor: "#ff9db2",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
});
