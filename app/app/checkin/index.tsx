import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { db, auth } from "@/services/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function WeeklyCheckIn() {
  const router = useRouter();
  const [hairFeel, setHairFeel] = useState("");
  const [issue, setIssue] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [notes, setNotes] = useState("");

  const submit = async () => {
    if (!auth.currentUser) return;

    await addDoc(
      collection(db, `users/${auth.currentUser.uid}/weeklyFeedback`),
      {
        hairFeel,
        issue,
        difficulty,
        notes,
        createdAt: new Date(),
      }
    );

    router.replace("/profile"); // or regenerate plan screen
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Check-In ✨</Text>

      {["Better", "Same", "Worse"].map(v => (
        <TouchableOpacity key={v} onPress={() => setHairFeel(v)}>
          <Text style={styles.option}>{v}</Text>
        </TouchableOpacity>
      ))}

      <TextInput
        placeholder="Anything to note?"
        style={styles.input}
        value={notes}
        onChangeText={setNotes}
      />

      <TouchableOpacity style={styles.btn} onPress={submit}>
        <Text style={styles.btnText}>Update My Plan</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 20 },
  option: { padding: 14, backgroundColor: "#f3f3f3", marginBottom: 8 },
  input: { borderWidth: 1, padding: 12, marginTop: 10 },
  btn: { backgroundColor: "#ff9db2", padding: 14, marginTop: 20 },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "700" },
});
