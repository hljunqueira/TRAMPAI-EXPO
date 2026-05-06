import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { API_BASE_URL } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function ResetPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token } = useLocalSearchParams();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (password.length < 6) {
      return setError("A senha deve ter pelo menos 6 caracteres");
    }
    if (password !== confirmPassword) {
      return setError("As senhas não coincidem");
    }
    if (!token) {
      return setError("Token de recuperação ausente. Use o link do e-mail.");
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setTimeout(() => {
          router.replace("/login");
        }, 2000);
      } else {
        setError(data.error || "Erro ao redefinir senha");
      }
    } catch (err) {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient
      colors={["#21284E", "#0f1530"]}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nova Senha</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="shield-key-outline" size={40} color="#5EB4B8" />
        </View>

        <Text style={styles.title}>Crie sua nova senha</Text>
        <Text style={styles.subtitle}>
          Escolha uma senha forte para manter sua conta protegida.
        </Text>

        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="Nova senha"
            placeholderTextColor="#666666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="Confirme a nova senha"
            placeholderTextColor="#666666"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {message ? <Text style={styles.successText}>{message}</Text> : null}

        <TouchableOpacity
          style={[styles.submitBtn, { opacity: loading ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Alterar Senha</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: "center",
    paddingVertical: 15,
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: "center",
    paddingTop: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(94, 180, 184, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    color: "#FFF",
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  inputGroup: {
    width: "100%",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#21284E",
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  submitBtn: {
    width: "100%",
    backgroundColor: "#5EB4B8",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
  },
  errorText: {
    color: "#ff6b6b",
    marginBottom: 20,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  successText: {
    color: "#22c55e",
    marginBottom: 20,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    fontSize: 15,
  },
});
