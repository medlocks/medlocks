import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { auth, db } from "@/services/firebase";
import { collection, getDocs, doc, setDoc, getDoc } from "firebase/firestore";

export default function RoutineScreen() {
  const user = auth.currentUser;
  const [tasks, setTasks] = useState([
    { id: "1", name: "Wash hair with shampoo", completed: false },
    { id: "2", name: "Apply conditioner", completed: false },
    { id: "3", name: "Use hair mask", completed: false },
    { id: "4", name: "Apply heat protection", completed: false },
    { id: "5", name: "Oil scalp massage", completed: false },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoutine = async () => {
      if (!user) return;
      const docRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(docRef);

      if (userSnap.exists() && userSnap.data().routineTasks) {
        setTasks(userSnap.data().routineTasks);
      }
      setLoading(false);
    };
    fetchRoutine();
  }, []);

  const toggleTask = async (id: string) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);

    if (user) {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { routineTasks: updatedTasks }, { merge: true });
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
          <TouchableOpacity
            style={[styles.task, item.completed && styles.taskDone]}
            onPress={() => toggleTask(item.id)}
          >
            <Text style={[styles.taskText, item.completed && styles.taskTextDone]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 20 },
  task: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#fafafa",
  },
  taskDone: {
    backgroundColor: "#ff9db2",
    borderColor: "#ff9db2",
  },
  taskText: { fontSize: 16 },
  taskTextDone: { color: "#fff", textDecorationLine: "line-through" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
