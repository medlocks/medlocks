import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { login } from "@/services/auth";
import { useRouter } from "expo-router";
import { db } from "@/services/firebase";
import { doc, getDoc } from "firebase/firestore";
import theme from "@/theme";

const schema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email required"),
  password: yup
    .string()
    .min(6, "Min 6 characters")
    .required("Password required"),
});

export default function LoginScreen() {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const [firebaseError, setFirebaseError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: any) => {
    setFirebaseError("");
    setLoading(true);
    try {
      const userCred = await login(data.email, data.password);
      const uid = userCred.user.uid;

      const userDocRef = doc(db, "users", uid);
      const userSnap = await getDoc(userDocRef);
      const profileData = userSnap.data();

      const profileComplete =
        profileData &&
        profileData.hairType &&
        profileData.hairGoals &&
        profileData.currentRoutine;

      if (profileComplete) {
        router.replace("/(tabs)");
      } else {
        router.replace("/profile/setup");
      }
    } catch (error: any) {
      switch (error.code) {
        case "auth/user-not-found":
          setFirebaseError("No account found with this email");
          break;
        case "auth/wrong-password":
          setFirebaseError("Incorrect password");
          break;
        case "auth/invalid-email":
          setFirebaseError("Invalid email address");
          break;
        default:
          setFirebaseError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/bgPrint.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back 👋</Text>
          <Text style={styles.subtitle}>
            Sign in to continue your hair journey
          </Text>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={theme.colors.textMuted}
                value={value}
                onChangeText={onChange}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />
          {errors.email && (
            <Text style={styles.error}>{errors.email.message}</Text>
          )}

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.password && (
            <Text style={styles.error}>{errors.password.message}</Text>
          )}

          {firebaseError ? (
            <Text style={styles.error}>{firebaseError}</Text>
          ) : null}

          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : (
            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit(onSubmit)}
            >
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
          )}

          <Text
            style={styles.link}
            onPress={() => router.push("/auth/signup")}
          >
            Need an account?{" "}
            <Text style={styles.linkHighlight}>Sign up →</Text>
          </Text>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadow.card,
  },
  title: {
    fontSize: theme.fontSizes.xl,
    fontWeight: "800",
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textMuted,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: "#fff",
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.md,
    ...theme.shadow.button,
  },
  buttonText: {
    color: "#fff",
    fontSize: theme.fontSizes.md,
    fontWeight: "700",
    textAlign: "center",
  },
  error: {
    color: theme.colors.error,
    marginBottom: theme.spacing.xs,
    textAlign: "center",
  },
  link: {
    textAlign: "center",
    color: theme.colors.textMuted,
    marginTop: theme.spacing.lg,
    fontSize: theme.fontSizes.sm,
  },
  linkHighlight: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
});
