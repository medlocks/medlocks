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
import theme from "@/theme";

interface Task {
  action: string;
  details: string;
  time?: string;
}

export default function RoutineScreen() {
  const user = auth.currentUser;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [tasksByDate, setTasksByDate] = useState<Record<string, Task[]>>({});

  useEffect(() => {
    const fetchRoutine = async () => {
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

      const map: Record<string, Task[]> = {};
      const planStart = new Date(
        data.updatedAt || data.createdAt || new Date()
      );

      routine.forEach((r: any, index: number) => {
        const date = new Date(planStart);
        date.setDate(date.getDate() + index);

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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const markedDates = {
    ...Object.keys(tasksByDate).reduce((acc, date) => {
      acc[date] = { marked: true, dotColor: theme.colors.primary };
      return acc;
    }, {} as Record<string, any>),
    [selectedDate]: {
      selected: true,
      selectedColor: theme.colors.primary,
    },
  };

  const tasks = tasksByDate[selectedDate] || [];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Your Hair Calendar</Text>

        <Calendar
          onDayPress={(day: DateData) =>
            setSelectedDate(day.dateString)
          }
          markedDates={markedDates}
          theme={{
            selectedDayBackgroundColor: theme.colors.primary,
            todayTextColor: theme.colors.primary,
            arrowColor: theme.colors.primary,
            monthTextColor: theme.colors.text,
          }}
          style={styles.calendar}
        />

        {Object.keys(tasksByDate).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🗓️</Text>
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubText}>
              Generate your AI routine to get started.
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
            <Text style={styles.emptyEmoji}>🎀</Text>
            <Text style={styles.emptyText}>No tasks today</Text>
            <Text style={styles.emptySubText}>
              Check another day in your plan.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.dayTitle}>
              Tasks for {selectedDate}
            </Text>
            <FlatList
              data={tasks}
              keyExtractor={(item, idx) =>
                `${idx}-${item.action}`
              }
              renderItem={({ item }) => (
                <View style={[styles.taskCard, theme.shadow.card]}>
                  <Text style={styles.taskAction}>{item.action}</Text>
                  <Text style={styles.taskDetails}>{item.details}</Text>
                  <Text style={styles.taskTime}>⏰ {item.time}</Text>
                </View>
              )}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1, paddingHorizontal: theme.spacing.lg },
  title: {
    fontSize: theme.fontSizes.xl,
    fontWeight: "800",
    textAlign: "center",
    marginVertical: theme.spacing.md,
  },
  calendar: {
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  dayTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },
  taskCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  taskAction: { fontWeight: "700", fontSize: theme.fontSizes.md },
  taskDetails: { color: theme.colors.textLight },
  taskTime: { fontSize: theme.fontSizes.sm },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: {
    alignItems: "center",
    marginTop: theme.spacing.xl,
  },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontWeight: "700", fontSize: theme.fontSizes.lg },
  emptySubText: { color: theme.colors.textLight, textAlign: "center" },
  emptyButton: { marginTop: theme.spacing.md },
});
