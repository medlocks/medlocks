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
import { MaterialCommunityIcons } from "@expo/vector-icons";

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

  const markedDates = {
    ...Object.keys(tasksByDate).reduce((acc, d) => {
      acc[d] = { marked: true, dotColor: theme.colors.primary };
      return acc;
    }, {} as any),
    [selectedDate]: {
      selected: true,
      selectedColor: theme.colors.primary,
    },
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Your Hair Calendar</Text>
        <Text style={styles.subtitle}>
          Your personalised routine, day by day
        </Text>

        <View style={styles.calendarCard}>
          <Calendar
            onDayPress={(d: DateData) => setSelectedDate(d.dateString)}
            markedDates={markedDates}
            theme={{
              todayTextColor: theme.colors.primary,
              arrowColor: theme.colors.primary,
              selectedDayBackgroundColor: theme.colors.primary,
              dotColor: theme.colors.primary,
            }}
          />
        </View>

        {tasks.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons
              name="calendar-heart"
              size={42}
              color={theme.colors.primary}
            />
            <Text style={styles.emptyTitle}>Rest & Recover</Text>
            <Text style={styles.emptyText}>
              No hair tasks today — your routine is still working in the
              background 💆‍♀️
            </Text>
          </View>
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(_, idx) => `${idx}`}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons
                    name="hair-dryer"
                    size={18}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.action}>{item.action}</Text>
                </View>
                <Text style={styles.details}>{item.details}</Text>
                {item.time && (
                  <Text style={styles.time}>⏰ {item.time}</Text>
                )}
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAFA" },
  container: { padding: 16 },
  title: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 16,
    color: "#666",
  },
  calendarCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 8,
    marginBottom: 16,
    elevation: 2,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginVertical: 8,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  action: { fontWeight: "700", fontSize: 16 },
  details: { color: "#444" },
  time: { marginTop: 6, color: "#777" },
  empty: {
    alignItems: "center",
    marginTop: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 6,
    color: "#666",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
