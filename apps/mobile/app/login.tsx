import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const { login, register, googleLogin } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    
    if (!email.trim() || !email.includes("@"))
      return setError("Informe um e-mail válido");
    if (password.length < 6)
      return setError("A senha deve ter pelo menos 6 caracteres");

    if (isRegister && !name.trim())
      return setError("Informe seu nome completo");

    setLoading(true);
    try {
      if (isRegister) {
        await register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role: "client", // Default role during quick register
        });
        setError("Cadastro realizado! Agora faça login.");
        setIsRegister(false);
      } else {
        await login({
          email: email.trim().toLowerCase(),
          password,
        });
        router.replace("/");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao processar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      setGoogleLoading(true);
      setError("");
      await googleLogin();
      router.replace("/");
    } catch (err: any) {
      if (err.message !== "Sign in cancelled") {
        setError(err.message || "Erro ao entrar com Google");
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <LinearGradient
      colors={["#21284E", "#1a2040", "#0f1530"]}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoSection}>
          <Text style={styles.appName}>Trampaí</Text>
          <Text style={styles.slogan}>Faz tua grana,{"\n"}no teu tempo, do teu jeito.</Text>
          <View style={[styles.gearsRow, { marginTop: 20, marginBottom: 0 }]}>
            <MaterialCommunityIcons name="cog" size={48} color="#F69926" />
            <MaterialCommunityIcons name="cog" size={48} color="#5EB4B8" style={styles.gear2} />
          </View>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.formSection}
        >
          <Text style={styles.formTitle}>{isRegister ? "Crie sua conta" : "Bem-vindo de volta"}</Text>
          
          {isRegister && (
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="Seu nome completo"
                placeholderTextColor="#666666"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor="#666666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="Sua senha"
              placeholderTextColor="#666666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{isRegister ? "Cadastrar" : "Entrar"}</Text>}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleLogin}
            disabled={googleLoading}
            activeOpacity={0.8}
          >
            {googleLoading ? (
              <ActivityIndicator color="#21284E" />
            ) : (
              <>
                <MaterialCommunityIcons name="google" size={20} color="#EA4335" />
                <Text style={styles.googleBtnText}>Entrar com Google</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>
              {isRegister ? "Já possui uma conta?" : "Ainda não tem conta?"}
            </Text>
            <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
              <Text style={styles.switchBtnText}>
                {isRegister ? " Faça Login" : " Cadastre Agora"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        <View style={styles.supportSection}>
          <Text style={styles.supportTitle}>Precisa de ajuda?</Text>
          <View style={styles.supportRow}>
            <MaterialCommunityIcons name="email-outline" size={16} color="#5EB4B8" />
            <Text style={styles.supportText}>suporte@trampai.com.br</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.termsText}>
            Ao continuar, você concorda com os nossos
          </Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => router.push("/terms")}>
              <Text style={styles.termsLink}>Termos de Uso</Text>
            </TouchableOpacity>
            <Text style={styles.footerSeparator}> e </Text>
            <TouchableOpacity onPress={() => router.push("/privacy")}>
              <Text style={styles.termsLink}>Privacidade</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 32,
    alignItems: "center",
  },
  logoSection: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  gearsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  gear2: {
    marginLeft: -10,
  },
  appName: {
    color: "#fff",
    fontSize: 48,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
    marginBottom: 8,
  },
  slogan: {
    color: "#F7EFCF",
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 24,
    opacity: 0.9,
  },
  formSection: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 24,
  },
  formTitle: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 24,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8D0B5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#21284E",
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  submitBtn: {
    backgroundColor: "#F69926",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#F69926",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  dividerText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  googleBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#D8D0B5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  googleBtnText: {
    color: "#21284E",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    paddingVertical: 10,
  },
  switchLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  switchBtnText: {
    color: "#5EB4B8",
    fontFamily: "Inter_800ExtraBold",
    fontSize: 16,
    textDecorationLine: "underline",
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 13,
    marginBottom: 16,
    textAlign: "center",
    fontFamily: "Inter_500Medium",
  },
  supportSection: {
    alignItems: "center",
    marginBottom: 32,
    gap: 8,
  },
  supportTitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  supportRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  supportText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  footer: {
    alignItems: "center",
    marginBottom: 20,
  },
  termsText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  footerLinks: {
    flexDirection: "row",
    alignItems: "center",
  },
  termsLink: {
    color: "#5EB4B8",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textDecorationLine: "underline",
  },
  footerSeparator: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
  },
});
