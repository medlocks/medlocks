import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { db } from "@/services/firebase";
import { doc, getDoc } from "firebase/firestore";
import theme from "@/theme";
import AppContainer from "@/components/AppContainer";

export default function QuizScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const snap = await getDoc(doc(db, "lessons", id as string));
      if (snap.exists()) {
        setLesson({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading || !lesson) {
    return (
      <AppContainer>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </AppContainer>
    );
  }

  const question = lesson.questions[currentIndex];
  const isCorrect = selected === question.correctIndex;

  const handleSelect = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
    if (index === question.correctIndex) setScore((s) => s + 1);
    setShowExplanation(true);
  };

  const handleNext = () => {
    setSelected(null);
    setShowExplanation(false);

    if (currentIndex + 1 < lesson.questions.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      router.replace("/learn"); // later: results screen
    }
  };

  return (
    <AppContainer>
      <Text style={{ color: theme.colors.textLight, marginBottom: 6 }}>
        Question {currentIndex + 1} of {lesson.questions.length}
      </Text>

      <Text
        style={{
          fontSize: theme.fontSizes.lg,
          fontWeight: "700",
          marginBottom: theme.spacing.lg,
        }}
      >
        {question.question}
      </Text>

      {question.choices.map((choice: string, i: number) => {
        const isSelected = selected === i;
        const isAnswer = i === question.correctIndex;

        let background = theme.colors.surface;
        let border = theme.colors.border;

        if (showExplanation) {
          if (isAnswer) background = "#E6FAEF";
          else if (isSelected) background = "#FDECEC";
        } else if (isSelected) {
          background = theme.colors.primaryLight;
          border = theme.colors.primary;
        }

        return (
          <TouchableOpacity
            key={i}
            onPress={() => handleSelect(i)}
            style={{
              padding: 16,
              borderRadius: theme.radius.md,
              borderWidth: 1,
              borderColor: border,
              backgroundColor: background,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: theme.fontSizes.md }}>{choice}</Text>
          </TouchableOpacity>
        );
      })}

      {showExplanation && (
        <View
          style={{
            backgroundColor: theme.colors.surface,
            padding: 16,
            borderRadius: theme.radius.md,
            marginTop: 10,
            ...theme.shadow.card,
          }}
        >
          <Text style={{ fontWeight: "700", marginBottom: 4 }}>
            {isCorrect ? "✅ Correct!" : "❌ Not quite"}
          </Text>
          <Text style={{ color: theme.colors.textLight }}>
            {question.explanation}
          </Text>
        </View>
      )}

      {showExplanation && (
        <TouchableOpacity
          onPress={handleNext}
          style={{
            marginTop: theme.spacing.lg,
            backgroundColor: theme.colors.primary,
            padding: 16,
            borderRadius: theme.radius.md,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>
            {currentIndex + 1 === lesson.questions.length
              ? "Finish"
              : "Continue"}
          </Text>
        </TouchableOpacity>
      )}
    </AppContainer>
  );
}
