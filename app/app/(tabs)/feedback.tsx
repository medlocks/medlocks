import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { auth, db } from "@/services/firebase";
import { doc, getDoc } from "firebase/firestore";
import AppContainer from "@/components/AppContainer";
import theme from "@/theme";
import { Button } from "react-native-paper";

export default function FeedbackScreen() {
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [tips, setTips] = useState<string[]>([]);
  const [weeklyFeedback, setWeeklyFeedback] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      // Load plan tips
      const planSnap = await getDoc(
        doc(db, "users", user.uid, "plan", "current")
      );

      if (planSnap.exists()) {
        setTips(planSnap.data()?.tips || []);
      }

      // Load last weekly feedback (if exists)
      const feedbackSnap = await getDoc(
        doc(db, "users", user.uid, "weeklyFeedback", "latest")
      );

      if (feedbackSnap.exists()) {
        setWeeklyFeedback(feedbackSnap.data());
      }

      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return (
      <AppContainer>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* HEADER */}
        <Text style={styles.title}>Your Hair Feedback 💭</Text>
        <Text style={styles.subtitle}>
          Reflections, tips, and insights from your AI hair coach.
        </Text>

        {/* WEEKLY FEEDBACK */}
        {weeklyFeedback ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>This Week’s Reflection</Text>

            <Text style={styles.body}>
              {weeklyFeedback.summary ||
                "Your hair has been responding steadily to your routine."}
            </Text>

            {weeklyFeedback.adjustments && (
              <>
                <Text style={styles.sectionTitle}>
                  Suggested Adjustments
                </Text>
                <Text style={styles.body}>
                  {weeklyFeedback.adjustments}
                </Text>
              </>
            )}
          </View>
        ) : (
          <View style={styles.softCard}>
            <Text style={styles.cardTitle}>No feedback yet 🌸</Text>
            <Text style={styles.body}>
              Complete your weekly check-in to unlock personalised insights and
              routine refinements.
            </Text>

            <Button
              mode="contained"
              onPress={() => {}}
              style={styles.primaryButton}
              labelStyle={{ fontWeight: "700" }}
            >
              Start Weekly Check-In →
            </Button>
          </View>
        )}

        {/* COACH TIPS */}
        {tips.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>
              Tips from your Hair Coach ✨
            </Text>

            {tips.map((tip, idx) => (
              <View key={idx} style={styles.tipCard}>
                <Text style={styles.tipIndex}>
                  {idx + 1}.
                </Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </>
        )}

        {/* REASSURANCE */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Consistency leads to perfection. Your hair journey is unfolding exactly as
            it should 💗
          </Text>
        </View>
      </ScrollView>
    </AppContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textLight,
    marginBottom: 20,
    lineHeight: 22,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F0D6E0",
  },
  softCard: {
    backgroundColor: "#FFF7FA",
    borderRadius: 22,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F4C6D8",
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 8,
    color: theme.colors.text,
  },

  sectionTitle: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.primary,
  },

  body: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
  },

  sectionHeader: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
    marginTop: 10,
  },

  tipCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },

  tipIndex: {
    fontWeight: "800",
    marginRight: 10,
    color: theme.colors.primary,
  },

  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },

  primaryButton: {
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
  },

  footer: {
    marginTop: 30,
    padding: 20,
    alignItems: "center",
  },

  footerText: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },
});
