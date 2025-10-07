import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
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
  } = useForm({
    resolver: yupResolver(schema),
  });
  const [firebaseError, setFirebaseError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: any) => {
    setFirebaseError("");
    setLoading(true);

    try {
      // 1️⃣ Login with Firebase Auth
      const userCred = await login(data.email, data.password);
      const uid = userCred.user.uid;

      // 2️⃣ Fetch the user’s Firestore profile
      const userDocRef = doc(db, "users", uid);
      const userSnap = await getDoc(userDocRef);

      // 3️⃣ Check if the profile exists and has required fields
      const profileData = userSnap.data();
      const profileComplete =
        profileData &&
        profileData.hairType &&
        profileData.hairGoals &&
        profileData.currentRoutine;

      // 4️⃣ Route based on completeness
      if (profileComplete) {
        router.replace("/(tabs)");
      } else {
        router.replace("/profile/setup");
      }
    } catch (error: any) {
      console.error(error);
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
      <View style={styles.inner}>
        <Text style={styles.title}>Welcome Back</Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Email"
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
              secureTextEntry
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        {errors.password && (
          <Text style={styles.error}>{errors.password.message}</Text>
        )}

        {firebaseError ? <Text style={styles.error}>{firebaseError}</Text> : null}

        {loading ? (
          <ActivityIndicator size="large" color="#ff9db2" />
        ) : (
          <Button title="Login" onPress={handleSubmit(onSubmit)} />
        )}

        <Text style={styles.link} onPress={() => router.push("/auth/signup")}>
          Need an account? Sign up →
        </Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
    backgroundColor: "#fff",
  },
  error: {
    color: "red",
    marginBottom: 6,
  },
  link: {
    color: "#ff9db2",
    textAlign: "center",
    marginTop: 16,
  },
});
