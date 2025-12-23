// app/learn/[id].tsx
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { db } from "@/services/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function LessonDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // quiz state (always defined, but only used when type === "quiz")
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!id) return;
    const loadLesson = async () => {
      try {
        const docRef = doc(db, "lessons", id as string);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          console.log("Loaded lesson:", data);
          setLesson({ id: snap.id, ...data });
        }
      } catch (e) {
        console.error("Failed to load lesson", e);
      } finally {
        setLoading(false);
      }
    };
    loadLesson();
  }, [id]);

  const handleSelect = (qIndex: number, choiceIndex: number) => {
    setSelectedAnswers(prev => ({ ...prev, [qIndex]: choiceIndex }));
  };

  const handleQuizComplete = () => {
    if (!lesson?.questions) return;
    let correct = 0;
    lesson.questions.forEach((q: any, i: number) => {
      if (selectedAnswers[i] === q.answer) correct++;
    });
    setScore(correct);
    setQuizCompleted(true);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#ff9db2" />
      </View>
    );
  }

  if (!lesson) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Lesson not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: "#fff" }}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 10 }}>{lesson.title}</Text>
      <Text style={{ color: "#666", marginBottom: 20 }}>
        {lesson.estimatedMinutes ?? 5} min • {lesson.xpReward ?? 5} XP
      </Text>

      {lesson.type === "lesson" && (
        <>
          <Text style={{ fontSize: 16, lineHeight: 22, color: "#333" }}>{lesson.content}</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              backgroundColor: "#ff9db2",
              padding: 14,
              borderRadius: 12,
              alignItems: "center",
              marginTop: 30,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Complete Lesson</Text>
          </TouchableOpacity>
        </>
      )}

      {lesson.type === "quiz" && (
        <>
          {lesson.questions?.map((q: any, i: number) => (
            <View key={i} style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 10 }}>{q.q}</Text>
              {q.choices.map((c: string, ci: number) => (
                <TouchableOpacity
                  key={ci}
                  onPress={() => handleSelect(i, ci)}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: selectedAnswers[i] === ci ? "#ff9db2" : "#ddd",
                    backgroundColor: selectedAnswers[i] === ci ? "#ffebf0" : "#fff",
                    marginBottom: 6,
                  }}
                >
                  <Text style={{ color: "#333" }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {!quizCompleted ? (
            <TouchableOpacity
              onPress={handleQuizComplete}
              style={{
                backgroundColor: "#ff9db2",
                padding: 14,
                borderRadius: 12,
                alignItems: "center",
                marginTop: 20,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Submit Quiz</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ alignItems: "center", marginTop: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 10 }}>
                You scored {score}/{lesson.questions.length}!
              </Text>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{
                  backgroundColor: "#ff9db2",
                  padding: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  marginTop: 10,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Back to Lessons</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
