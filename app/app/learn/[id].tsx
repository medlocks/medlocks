import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import * as Haptics from "expo-haptics";
import ConfettiCannon from "react-native-confetti-cannon";

export default function LessonDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<"intro" | "quiz" | "result">("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);

  const [confettiKey, setConfettiKey] = useState(0);

  useEffect(() => {
    if (!id) return;
    const loadLesson = async () => {
      const snap = await getDoc(doc(db, "lessons", id as string));
      if (snap.exists()) {
        setLesson({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    };
    loadLesson();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff9db2" />
      </View>
    );
  }

  if (!lesson || lesson.type !== "quiz") {
    return (
      <View style={styles.center}>
        <Text>Quiz not found.</Text>
      </View>
    );
  }

  const questions = lesson.questions.map((q: any) => ({
  q: q.question,
  choices: q.choices,
  answer: q.correctIndex,
  explanation: q.explanation,
}));

  const q = questions[currentIndex];
  const isCorrect = selected === q.answer;

  const handleSelect = async (index: number) => {
    if (showFeedback) return;

    await Haptics.selectionAsync();
    setSelected(index);
    setShowFeedback(true);

    if (index === q.answer) {
      setScore((s) => s + 1);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setConfettiKey((k) => k + 1);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleNext = async () => {
    setSelected(null);
    setShowFeedback(false);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
      setStep("result");
      setConfettiKey((k) => k + 1);
    }
  };

  // ---------------- INTRO ----------------
  if (step === "intro") {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.title}>{lesson.title}</Text>
          <Text style={styles.meta}>
            {questions.length} quick questions • {lesson.xpReward ?? 10} XP
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setStep("quiz");
            }}
          >
            <Text style={styles.primaryText}>Start Quiz 🚀</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------- RESULT ----------------
  if (step === "result") {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <ConfettiCannon
            key={confettiKey}
            count={200}
            origin={{ x: 200, y: 0 }}
            fadeOut
          />

          <Text style={styles.celebrate}>🎉</Text>
          <Text style={styles.title}>You smashed it</Text>

          <Text style={styles.resultText}>
            {score} / {questions.length} correct
          </Text>

          <Text style={styles.meta}>+{lesson.xpReward ?? 10} XP earned</Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Text style={styles.primaryText}>Back to Academy</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------- QUIZ ----------------
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {showFeedback && isCorrect && (
          <ConfettiCannon
            key={confettiKey}
            count={80}
            origin={{ x: 200, y: 0 }}
            fadeOut
          />
        )}

        <View style={styles.progressBg}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentIndex + 1) / questions.length) * 100}%` },
            ]}
          />
        </View>

        <Text style={styles.progressText}>
          Question {currentIndex + 1} of {questions.length}
        </Text>

        <Text style={styles.question}>{q.q}</Text>

        {q.choices.map((choice: string, i: number) => {
          let bg = "#fff";
          let border = "#ddd";

          if (showFeedback) {
            if (q.answer === i) bg = "#e7f9ef";
            if (selected === i && q.answer !== i) bg = "#fdecea";
          } else if (selected === i) {
            bg = "#ffebf0";
            border = "#ff9db2";
          }

          return (
            <TouchableOpacity
              key={i}
              style={[styles.choice, { backgroundColor: bg, borderColor: border }]}
              onPress={() => handleSelect(i)}
            >
              <Text style={styles.choiceText}>{choice}</Text>
            </TouchableOpacity>
          );
        })}

        {showFeedback && (
          <View style={styles.feedback}>
            <Text style={styles.feedbackText}>
              {isCorrect ? "Correct! 🎉" : "Not quite 👀"}
            </Text>
            <Text style={styles.explanation}>{q.explanation}</Text>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
              <Text style={styles.primaryText}>
                {currentIndex + 1 === questions.length ? "Finish" : "Next"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ---------------- STYLES ----------------

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, padding: 24 },
  title: { fontSize: 28, fontWeight: "800", textAlign: "center", marginBottom: 10 },
  meta: { textAlign: "center", color: "#666", marginBottom: 30 },
  primaryBtn: {
    backgroundColor: "#ff9db2",
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 20,
  },
  primaryText: { color: "#fff", textAlign: "center", fontWeight: "700", fontSize: 16 },
  progressBg: {
    height: 8,
    backgroundColor: "#eee",
    borderRadius: 4,
    marginBottom: 12,
  },
  progressFill: {
    height: 8,
    backgroundColor: "#ff9db2",
    borderRadius: 4,
  },
  progressText: { textAlign: "center", color: "#888", marginBottom: 12 },
  question: { fontSize: 20, fontWeight: "700", marginBottom: 20 },
  choice: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  choiceText: { fontSize: 16, color: "#333" },
  feedback: { marginTop: 20 },
  feedbackText: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  explanation: { fontSize: 15, color: "#555", lineHeight: 22 },
  celebrate: { fontSize: 60, textAlign: "center" },
  resultText: { fontSize: 20, textAlign: "center", marginVertical: 10 },
});
