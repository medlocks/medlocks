import React from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { signup } from "@/services/auth";
import { useRouter } from "expo-router";

const schema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email required"),
  password: yup.string().min(6, "Min 6 chars").required("Password required"),
});

export default function SignupScreen() {
  const router = useRouter();
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: any) => {
    try {
      await signup(data.email, data.password);
      router.replace("/"); // go home
    } catch (error: any) {
      Alert.alert("Signup failed", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

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
          />
        )}
      />

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

      <Button title="Sign Up" onPress={handleSubmit(onSubmit)} />
      <Text style={styles.link} onPress={() => router.push("/auth/login")}>
        Already have an account? Log in →
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 16, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  link: { color: "#ff9db2", textAlign: "center", marginTop: 16 },
});
