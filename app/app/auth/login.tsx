import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ImageBackground,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { login } from "@/services/auth";
import { useRouter } from "expo-router";

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

  const onSubmit = async (data: any) => {
    setFirebaseError("");
    try {
      await login(data.email, data.password);
      router.replace("/(tabs)");
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
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/bgPrint.png")}
      style={styles.container}
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

        <Button title="Login" onPress={handleSubmit(onSubmit)} />
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

