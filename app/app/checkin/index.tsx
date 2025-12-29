import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { db, auth } from "@/services/firebase";
import { collection, addDoc } from "firebase/firestore";

const FEEL_OPTIONS = ["Better", "Same", "Worse"];

export default function WeeklyCheckIn() {
  const router = useRouter();

  const [hairFeel, setHairFeel] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const submit = async () => {
    if (!auth.currentUser || !hairFeel) return;

    await addDoc(
      collection(db, `users/${auth.currentUser.uid}/weeklyFeedback`),
      {
        hairFeel,
        notes,
        createdAt: new Date(),
      }
    );

    router.replace("/profile");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <Text style={styles.emoji}>✨</Text>
        <Text style={styles.title}>Weekly Hair Check-In</Text>
        <Text style={styles.subtitle}>
          Help your AI fine-tune your routine for even better results.
        </Text>

        {/* Question */}
        <Text style={styles.question}>
          How does your hair feel compared to last week?
        </Text>

        {/* Options */}
        {FEEL_OPTIONS.map((option) => {
          const selected = hairFeel === option;

          return (
            <TouchableOpacity
              key={option}
              onPress={() => setHairFeel(option)}
              activeOpacity={0.85}
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

        {/* Notes */}
        <Text style={styles.label}>Anything you'd like to add?</Text>
        <TextInput
          placeholder="Dryness, breakage, scalp issues, styling struggles…"
          placeholderTextColor="#999"
          style={styles.input}
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.btn,
            !hairFeel && styles.btnDisabled,
          ]}
          disabled={!hairFeel}
          onPress={submit}
        >
          <Text style={styles.btnText}>Update My Plan →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    padding: 24,
  },

  emoji: {
    fontSize: 48,
    textAlign: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    color: "#111",
  },
  subtitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: 28,
    marginTop: 6,
    lineHeight: 20,
  },

  question: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    marginBottom: 12,
  },

  option: {
    borderWidth: 1.5,
    borderColor: "#e6e6e6",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    backgroundColor: "#fafafa",
  },
  optionSelected: {
    borderColor: "#ff9db2",
    backgroundColor: "#ffebf0",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  optionTextSelected: {
    color: "#c2185b",
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#444",
    marginTop: 20,
    marginBottom: 6,
  },

  input: {
    borderWidth: 1.5,
    borderColor: "#e6e6e6",
    borderRadius: 16,
    padding: 14,
    minHeight: 90,
    fontSize: 15,
    color: "#111",
    backgroundColor: "#fafafa",
  },

  btn: {
    backgroundColor: "#ff9db2",
    paddingVertical: 16,
    borderRadius: 18,
    marginTop: 28,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
    fontSize: 16,
  },
});

