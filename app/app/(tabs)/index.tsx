import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "@/services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "react-native-paper";
import theme from "@/theme";
import AppContainer from "../../components/AppContainer";

interface Task {
  action: string;
  details: string;
  time?: string;
  day?: string;
  week?: number;
}

export default function HomeScreen() {
  const user = auth.currentUser;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasPlan, setHasPlan] = useState(false);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [showCheckIn, setShowCheckIn] = useState(true); // TEMP: always true

  useEffect(() => {
    const fetchPlan = async () => {
      if (!user) return;

      const planRef = doc(db, "users", user.uid, "plan", "current");
      const snap = await getDoc(planRef);

      if (!snap.exists()) {
        setHasPlan(false);
        setLoading(false);
        return;
      }

      const data = snap.data();
      const routine = data?.routine || [];

      if (routine.length === 0) {
        setHasPlan(false);
        setLoading(false);
        return;
      }

      setHasPlan(true);

      // Determine today's tasks
      const today = new Date();
      const todayName = today.toLocaleDateString("en-US", { weekday: "long" });

      const startDate = data.startDate ? new Date(data.startDate) : today;
      const diffDays = Math.floor(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const currentWeek = Math.min(Math.floor(diffDays / 7) + 1, 4);

      const todayMatches = routine.filter(
        (r: any) =>
          r.day === todayName &&
          (r.week === currentWeek || r.week === undefined)
      );

      setTodayTasks(todayMatches);
      setLoading(false);
    };

    fetchPlan();
  }, []);

  // --- Loading State ---
  if (loading) {
    return (
      <AppContainer>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </AppContainer>
    );
  }

  // --- If user has NO plan yet ---
  if (!hasPlan) {
    return (
      <AppContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text
            style={{
              fontSize: theme.fontSizes.xl,
              fontWeight: "800",
              color: theme.colors.text,
              textAlign: "center",
              marginBottom: theme.spacing.sm,
            }}
          >
            Medlocks Hair Coach
          </Text>
          <Text
            style={{
              fontSize: theme.fontSizes.md,
              color: theme.colors.textLight,
              textAlign: "center",
              marginBottom: theme.spacing.lg,
              maxWidth: 280,
            }}
          >
            Your journey to healthy, dreamy hair starts here.
          </Text>

          <Button
            mode="contained"
            onPress={() => router.push("/profile")}
            style={{
              backgroundColor: theme.colors.primary,
              borderRadius: theme.radius.lg,
              paddingVertical: 8,
              paddingHorizontal: 24,
            }}
            labelStyle={{
              fontWeight: "600",
              fontSize: theme.fontSizes.md,
              color: "#fff",
            }}
          >
            Get Started →
          </Button>
        </View>
      </AppContainer>
    );
  }

  // --- If user HAS a plan ---
  return (
    <AppContainer>
      {showCheckIn && (
  <View
    style={{
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    }}
  >
    <Text
      style={{
        fontSize: theme.fontSizes.lg,
        fontWeight: "800",
        color: "#fff",
        marginBottom: theme.spacing.xs,
      }}
    >
      ✨ Weekly Hair Check-In
    </Text>

    <Text
      style={{
        fontSize: theme.fontSizes.sm,
        color: "rgba(255,255,255,0.9)",
        marginBottom: theme.spacing.md,
      }}
    >
      Help your AI refine your routine and get you closer to your goal hair.
    </Text>

    <Button
      mode="contained"
      onPress={() => router.push("../checkin")}
      style={{
        backgroundColor: "#fff",
        borderRadius: theme.radius.md,
      }}
      labelStyle={{
        color: theme.colors.primary,
        fontWeight: "700",
      }}
    >
      Start Check-In →
    </Button>
  </View>
)}

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: theme.fontSizes.xl,
            fontWeight: "800",
            color: theme.colors.text,
            marginBottom: theme.spacing.xs,
          }}
        >
          Welcome Back 💖
        </Text>
        <Text
          style={{
            fontSize: theme.fontSizes.md,
            color: theme.colors.textLight,
            marginBottom: theme.spacing.lg,
          }}
        >
          Here’s what’s on your hair care list for today:
        </Text>

        {todayTasks.length === 0 ? (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              marginTop: theme.spacing.lg,
            }}
          >
            <Text
              style={{
                fontSize: theme.fontSizes.lg,
                fontWeight: "700",
                color: theme.colors.text,
                marginBottom: theme.spacing.xs,
              }}
            >
              🎀 No tasks for today
            </Text>
            <Text
              style={{
                fontSize: theme.fontSizes.sm,
                color: theme.colors.textLight,
                textAlign: "center",
                marginBottom: theme.spacing.md,
              }}
            >
              Check your routine calendar to see what’s next.
            </Text>
            <Button
              mode="outlined"
              onPress={() => router.push("/routine")}
              textColor={theme.colors.primary}
              style={{
                borderColor: theme.colors.primary,
                borderWidth: 1.5,
                borderRadius: theme.radius.md,
                paddingHorizontal: theme.spacing.lg,
              }}
            >
              View Full Plan
            </Button>
          </View>
        ) : (
          <FlatList
            data={todayTasks}
            keyExtractor={(item, idx) => `${idx}-${item.action}`}
            renderItem={({ item }) => (
              <View
                style={{
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.lg,
                  padding: theme.spacing.lg,
                  marginBottom: theme.spacing.md,
                  ...theme.shadow.card,
                }}
              >
                <Text
                  style={{
                    fontSize: theme.fontSizes.md,
                    fontWeight: "700",
                    color: theme.colors.text,
                  }}
                >
                  {item.action}
                </Text>
                <Text
                  style={{
                    fontSize: theme.fontSizes.sm,
                    color: theme.colors.textLight,
                    marginTop: 4,
                  }}
                >
                  {item.details}
                </Text>
                {item.time && (
                  <Text
                    style={{
                      fontSize: theme.fontSizes.sm,
                      color: theme.colors.textLight,
                      marginTop: 6,
                    }}
                  >
                    ⏰ {item.time}
                  </Text>
                )}
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}
      </View>
    </AppContainer>
  );
}
