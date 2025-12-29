import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
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
    <AppContainer>
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.emoji}>✨</Text>

        <Text style={styles.title}>Weekly Hair Check-In</Text>

        <Text style={styles.subtitle}>
          Tell us how your hair felt this week so your plan can adapt.
        </Text>

        {/* QUESTION — THIS WAS INVISIBLE BEFORE */}
        <Text style={styles.question}>
          How does your hair feel compared to last week?
        </Text>

        {/* OPTIONS */}
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

        {/* NOTES */}
        <Text style={styles.label}>Anything you noticed?</Text>
        <TextInput
          placeholder="Dryness, breakage, shedding, scalp issues…"
          placeholderTextColor="#999"
          style={styles.input}
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        {/* CTA */}
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
      </ScrollView>
    </SafeAreaView>
    </AppContainer>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#ffffff", // FORCE LIGHT
  },
  scroll: {
    padding: 24,
    paddingBottom: 48,
  },

  emoji: {
    fontSize: 48,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    color: "#111111",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    color: "#666666",
    marginTop: 6,
    marginBottom: 28,
    lineHeight: 20,
  },

  question: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222222", // EXPLICIT
    marginBottom: 14,
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
    color: "#333333",
  },
  optionTextSelected: {
    color: "#c2185b",
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#444444",
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
    color: "#111111",
    backgroundColor: "#fafafa",
    textAlignVertical: "top",
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
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "800",
    fontSize: 16,
  },
});

