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
import theme from "@/theme";

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

export default function RoutineScreen() {
  const user = auth.currentUser;
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [tasksByDate, setTasksByDate] = useState<Record<string, Task[]>>({});

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      const snap = await getDoc(
        doc(db, "users", user.uid, "plan", "current")
      );

      if (!snap.exists()) {
        setLoading(false);
        return;
      }

      const data = snap.data();
      const routine = data?.routine || [];
      const start = new Date(data.createdAt || new Date());

      const map: Record<string, Task[]> = {};

      routine.forEach((r: any) => {
        if (!r.day) return;
        const dateKey = nextDate(r.day, start);
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push({
          action: r.action,
          details: r.details,
          time: r.time,
        });
      });

      setTasksByDate(map);
      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const tasks = tasksByDate[selectedDate] || [];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Your Hair Calendar</Text>

        <Calendar
          onDayPress={(d: DateData) => setSelectedDate(d.dateString)}
          markedDates={{
            ...Object.keys(tasksByDate).reduce((a, d) => {
              a[d] = { marked: true };
              return a;
            }, {} as any),
            [selectedDate]: { selected: true },
          }}
        />

        <FlatList
          data={tasks}
          keyExtractor={(i, idx) => `${idx}`}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.action}>{item.action}</Text>
              <Text>{item.details}</Text>
              {item.time && <Text>⏰ {item.time}</Text>}
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 16 },
  title: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginVertical: 8,
  },
  action: { fontWeight: "700", fontSize: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
