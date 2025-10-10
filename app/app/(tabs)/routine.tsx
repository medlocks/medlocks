import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { auth, db } from "@/services/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import * as Notifications from "expo-notifications";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Switch, Button } from "react-native-paper";

interface RoutineTask {
  id: string;
  name: string;
  completed: boolean;
  time: string; // "HH:mm"
  active: boolean;
}

export default function RoutineScreen() {
  const user = auth.currentUser;
  const [tasks, setTasks] = useState<RoutineTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<RoutineTask | null>(null);

  useEffect(() => {
    const fetchRoutine = async () => {
      if (!user) return;
      const docRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(docRef);

      if (userSnap.exists() && userSnap.data().routineTasks) {
        setTasks(userSnap.data().routineTasks);
      } else {
        const defaultTasks: RoutineTask[] = [
          { id: "1", name: "Wash hair with shampoo", completed: false, time: "08:00", active: true },
          { id: "2", name: "Apply conditioner", completed: false, time: "08:10", active: true },
          { id: "3", name: "Use hair mask", completed: false, time: "20:00", active: true },
          { id: "4", name: "Apply heat protection", completed: false, time: "07:50", active: true },
          { id: "5", name: "Oil scalp massage", completed: false, time: "21:00", active: true },
        ];
        setTasks(defaultTasks);
        await setDoc(docRef, { routineTasks: defaultTasks }, { merge: true });
      }
      setLoading(false);
    };

    fetchRoutine();
  }, []);

  useEffect(() => {
    tasks.forEach(async (task) => {
      if (!task.active) return;
      const [hour, minute] = task.time.split(":").map(Number);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Time to ${task.name} 💆🏽‍♀️`,
          body: "Stick to your routine for amazing results!",
        },
        trigger: { hour, minute, repeats: true },
      });
    });
  }, [tasks]);

  const saveTasks = async (updatedTasks: RoutineTask[]) => {
    setTasks(updatedTasks);
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, { routineTasks: updatedTasks }, { merge: true });
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    saveTasks(updated);
  };

  const toggleActive = (id: string) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, active: !t.active } : t
    );
    saveTasks(updated);
  };

  const showTimePicker = (task: RoutineTask) => {
    setSelectedTask(task);
    setPickerVisible(true);
  };

  const onTimeChange = (_event: any, selected?: Date) => {
    setPickerVisible(Platform.OS === "ios");
    if (selected && selectedTask) {
      const hours = selected.getHours().toString().padStart(2, "0");
      const minutes = selected.getMinutes().toString().padStart(2, "0");
      const updated = tasks.map((t) =>
        t.id === selectedTask.id ? { ...t, time: `${hours}:${minutes}` } : t
      );
      saveTasks(updated);
      setSelectedTask(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff9db2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Hair Routine</Text>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskWrapper}>
            <TouchableOpacity
              style={[styles.task, item.completed && styles.taskDone]}
              onPress={() => toggleTask(item.id)}
            >
              <Text style={[styles.taskText, item.completed && styles.taskTextDone]}>
                {item.name}
              </Text>
            </TouchableOpacity>

            <View style={styles.taskControls}>
              <Button
                mode="outlined"
                onPress={() => showTimePicker(item)}
              >
                {item.time}
              </Button>
              <Switch value={item.active} onValueChange={() => toggleActive(item.id)} />
            </View>
          </View>
        )}
      />

      {pickerVisible && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onTimeChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 20 },
  taskWrapper: { marginBottom: 20 },
  task: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#fafafa",
  },
  taskDone: {
    backgroundColor: "#ff9db2",
    borderColor: "#ff9db2",
  },
  taskText: { fontSize: 16 },
  taskTextDone: { color: "#fff", textDecorationLine: "line-through" },
  taskControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
