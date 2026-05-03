import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
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
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scaleAnim = useRef(new Animated.Value(1)).current;

  function handleGooglePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(() => setShowModal(true));
  }

  async function handleLogin() {
    setError("");
    if (!name.trim()) return setError("Informe seu nome");
    if (!email.trim() || !email.includes("@"))
      return setError("Informe um e-mail válido");

    setLoading(true);
    try {
      await login({ name: name.trim(), email: email.trim().toLowerCase() });
      setShowModal(false);
      router.replace("/");
    } catch {
      setError("Erro ao entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient
      colors={["#21284E", "#1a2040", "#0f1530"]}
      style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}
    >
      <View style={styles.content}>
        <View style={styles.logoSection}>
          <View style={styles.gearsRow}>
            <MaterialCommunityIcons name="cog" size={48} color="#F69926" />
            <MaterialCommunityIcons
              name="cog"
              size={48}
              color="#5EB4B8"
              style={styles.gear2}
            />
          </View>
          <Text style={styles.appName}>Trampaí</Text>
          <Text style={styles.slogan}>
            Faz tua grana,{"\n"}no teu tempo, do teu jeito.
          </Text>
        </View>

        <View style={styles.featuresSection}>
          {[
            { icon: "briefcase-outline", text: "Poste serviços e receba prestadores" },
            { icon: "wallet-outline", text: "Pague apenas por leads qualificados" },
            { icon: "map-marker-outline", text: "Profissionais da sua região" },
          ].map((f, i) => (
            <View key={i} style={styles.feature}>
              <MaterialCommunityIcons name={f.icon as never} size={18} color="#5EB4B8" />
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGooglePress}
            activeOpacity={0.9}
          >
            <MaterialCommunityIcons name="google" size={20} color="#21284E" />
            <Text style={styles.googleBtnText}>Continuar com Google</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.terms}>
          Ao continuar, você concorda com os{"\n"}
          <Text style={styles.termsLink}>Termos de Uso</Text> e{" "}
          <Text style={styles.termsLink}>Política de Privacidade</Text>
        </Text>
      </View>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: colors.card, borderRadius: colors.radius * 2 },
            ]}
          >
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="google" size={24} color="#4285F4" />
              <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                Entrar com Google
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                Nome completo
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.muted,
                    color: colors.foreground,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                    fontFamily: "Inter_400Regular",
                  },
                ]}
                placeholder="Seu nome"
                placeholderTextColor={colors.mutedForeground}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                E-mail
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.muted,
                    color: colors.foreground,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                    fontFamily: "Inter_400Regular",
                  },
                ]}
                placeholder="seu@email.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {error ? (
              <Text style={[styles.errorText, { fontFamily: "Inter_400Regular" }]}>
                {error}
              </Text>
            ) : null}

            <TouchableOpacity
              style={[
                styles.loginBtn,
                { backgroundColor: colors.navy, borderRadius: colors.radius },
              ]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.loginBtnText, { fontFamily: "Inter_600SemiBold" }]}>
                  Entrar
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 48,
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
    opacity: 0.85,
  },
  featuresSection: {
    gap: 14,
    width: "100%",
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    color: "#ffffffCC",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  bottom: {
    paddingHorizontal: 24,
    gap: 16,
    alignItems: "center",
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7EFCF",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    gap: 10,
    minWidth: 260,
    justifyContent: "center",
  },
  googleBtnText: {
    color: "#21284E",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  terms: {
    color: "#ffffff60",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
  },
  termsLink: {
    color: "#5EB4B8",
    textDecorationLine: "underline",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000060",
  },
  modalContainer: {
    justifyContent: "flex-end",
  },
  modalSheet: {
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#D8D0B5",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
    marginBottom: 12,
  },
  loginBtn: {
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  loginBtnText: {
    color: "#fff",
    fontSize: 16,
  },
});
