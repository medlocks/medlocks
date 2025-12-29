import React, { useState } from "react";
import {
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { db, auth } from "@/services/firebase";
import { collection, addDoc } from "firebase/firestore";
import AppContainer from "@/components/AppContainer";

const FEEL_OPTIONS = ["Better", "Same", "Worse"];

export default function WeeklyCheckIn() {
  const router = useRouter();
  const [hairFeel, setHairFeel] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!auth.currentUser || !hairFeel) return;

    try {
      setLoading(true);
      const uid = auth.currentUser.uid;

      await addDoc(collection(db, `users/${uid}/weeklyFeedback`), {
        hairFeel,
        notes,
        createdAt: new Date(),
      });

      const res = await fetch(
        "https://us-central1-medlocks-f3fe7.cloudfunctions.net/regenerateAIHairPlan",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid }),
        }
      );

      if (!res.ok) throw new Error("Plan update failed");

      router.replace("/");
    } catch (err) {
      console.error(err);
      alert("Could not update your plan. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppContainer>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.emoji}>✨</Text>
          <Text style={styles.title}>Weekly Hair Check-In</Text>
          <Text style={styles.subtitle}>
            Your answers help us adapt your routine.
          </Text>

          <Text style={styles.question}>
            How does your hair feel compared to last week?
          </Text>

          {FEEL_OPTIONS.map((option) => {
            const selected = hairFeel === option;
            return (
              <TouchableOpacity
                key={option}
                onPress={() => setHairFeel(option)}
                style={[
                  styles.option,
                  selected && styles.optionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    selected && styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}

          <Text style={styles.label}>Anything you noticed?</Text>
          <TextInput
            style={styles.input}
            placeholder="Dryness, shedding, scalp issues…"
            placeholderTextColor="#999"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <TouchableOpacity
            style={[styles.btn, (!hairFeel || loading) && styles.btnDisabled]}
            onPress={submit}
            disabled={!hairFeel || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Update My Plan →</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </AppContainer>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  scroll: { padding: 24, paddingBottom: 48 },

  emoji: { fontSize: 48, textAlign: "center", marginBottom: 8 },
  title: { fontSize: 28, fontWeight: "800", textAlign: "center" },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    color: "#666",
    marginBottom: 28,
  },

  question: { fontSize: 18, fontWeight: "700", marginBottom: 14 },

  option: {
    borderWidth: 1.5,
    borderColor: "#e6e6e6",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    backgroundColor: "#fafafa",
  },
  optionSelected: {
    borderColor: "#ff9db2",
    backgroundColor: "#ffebf0",
  },
  optionText: { fontSize: 16, fontWeight: "600" },
  optionTextSelected: { color: "#c2185b" },

  label: { fontSize: 15, fontWeight: "600", marginTop: 20 },
  input: {
    borderWidth: 1.5,
    borderColor: "#e6e6e6",
    borderRadius: 16,
    padding: 14,
    minHeight: 90,
    marginTop: 6,
    backgroundColor: "#fafafa",
  },

  btn: {
    backgroundColor: "#ff9db2",
    paddingVertical: 16,
    borderRadius: 18,
    marginTop: 28,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
    fontSize: 16,
  },
});
