import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { auth, db } from "@/services/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import dayjs from "dayjs";

type RoutineItem = {
  id: string;
  day: string;
  task: string;
  completed: boolean;
};

export default function RoutineScreen() {
  const [routine, setRoutine] = useState<RoutineItem[]>([]);
  const [loading, setLoading] = useState(true);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (uid) loadRoutine();
  }, [uid]);

  const loadRoutine = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "users", uid!, "routine", "current");
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        setRoutine(snapshot.data().items);
      } else {
        const newRoutine = generateRoutine();
        await setDoc(docRef, { items: newRoutine });
        setRoutine(newRoutine);
      }
    } catch (err) {
      console.error("Error loading routine:", err);
    } finally {
      setLoading(false);
    }
  };

  
  const generateRoutine = (): RoutineItem[] => {
    const tasks = [
      "Wash hair with shampoo",
      "Deep condition / mask",
      "Apply leave-in conditioner",
      "Scalp oil massage",
      "Protective style maintenance",
      "Trim / detangle session",
      "Rest day (no product)"
    ];

    return tasks.map((task, i) => ({
      id: `${i}`,
      day: dayjs().add(i, "day").format("dddd"),
      task,
      completed: false
    }));
  };

  const toggleComplete = async (id: string) => {
    const updated = routine.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setRoutine(updated);
    await updateDoc(doc(db, "users", uid!, "routine", "current"), { items: updated });
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  const today = dayjs().format("dddd");
  const todayTask = routine.find(r => r.day === today);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Hair Routine</Text>

      {todayTask ? (
        <View style={styles.todayBox}>
          <Text style={styles.todayTitle}>Today: {todayTask.day}</Text>
          <Text style={styles.taskText}>{todayTask.task}</Text>
          <Button
            title={todayTask.completed ? "Completed ✅" : "Mark Complete"}
            onPress={() => toggleComplete(todayTask.id)}
            color={todayTask.completed ? "gray" : "#ff9db2"}
          />
        </View>
      ) : (
        <Text>No task today — rest day 🧘‍♀️</Text>
      )}

      <Text style={styles.subtitle}>This Week</Text>
      <FlatList
        data={routine}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => toggleComplete(item.id)}>
            <View style={styles.item}>
              <Text style={item.completed ? styles.doneText : styles.itemText}>
                {item.day}: {item.task}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <Button title="Regenerate Routine" onPress={loadRoutine} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 16 },
  subtitle: { fontSize: 18, fontWeight: "600", marginTop: 20 },
  todayBox: {
    padding: 16,
    backgroundColor: "#ffeaf0",
    borderRadius: 12,
    marginBottom: 16
  },
  todayTitle: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  taskText: { fontSize: 16, marginBottom: 8 },
  item: { paddingVertical: 8 },
  itemText: { fontSize: 16 },
  doneText: { fontSize: 16, textDecorationLine: "line-through", color: "gray" }
});
