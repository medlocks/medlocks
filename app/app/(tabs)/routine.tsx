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
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );

  const markedDates = Object.keys(tasksByDate).reduce(
    (acc, date) => {
      acc[date] = { marked: true, dotColor: theme.colors.primary };
      return acc;
    },
    {
      [selectedDate]: { selected: true, selectedColor: theme.colors.primary },
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
            selectedDayBackgroundColor: theme.colors.primary,
            todayTextColor: theme.colors.primary,
            arrowColor: theme.colors.primary,
            monthTextColor: theme.colors.text,
            textDayFontWeight: "500",
            textMonthFontWeight: "700",
            textDayHeaderFontWeight: "600",
          }}
          style={styles.calendar}
        />

        {Object.keys(tasksByDate).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🗓️</Text>
            <Text style={styles.emptyText}>No tasks in your calendar yet</Text>
            <Text style={styles.emptySubText}>
              Generate your bespoke AI routine to begin your healthy hair journey.
            </Text>
            <Button
              mode="contained"
              onPress={() => router.push("/profile")}
              style={styles.emptyButton}
              labelStyle={{ fontWeight: "700", fontSize: theme.fontSizes.md }}
            >
              Generate Routine
            </Button>
          </View>
        ) : tasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🎀</Text>
            <Text style={styles.emptyText}>No tasks for today</Text>
            <Text style={styles.emptySubText}>
              Check another day to see what’s next in your plan.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.dayTitle}>Tasks for {selectedDate}</Text>
            <FlatList
              data={tasks}
              keyExtractor={(item, idx) => `${idx}-${item.action}`}
              renderItem={({ item }) => (
                <View style={[styles.taskCard, theme.shadow.card]}>
                  <Text style={styles.taskAction}>{item.action}</Text>
                  <Text style={styles.taskDetails}>{item.details}</Text>
                  <Text style={styles.taskTime}>⏰ {item.time}</Text>
                </View>
              )}
              contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSizes.xl,
    fontWeight: "800",
    textAlign: "center",
    marginVertical: theme.spacing.md,
    color: theme.colors.text,
  },
  calendar: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  dayTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: "700",
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },
  taskCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  taskAction: {
    fontSize: theme.fontSizes.md,
    fontWeight: "700",
    color: theme.colors.text,
  },
  taskDetails: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  taskTime: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyEmoji: {
    fontSize: 50,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSizes.lg,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textLight,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    ...theme.shadow.button,
  },
});
