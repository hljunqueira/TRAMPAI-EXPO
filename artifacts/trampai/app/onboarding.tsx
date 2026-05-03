import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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

const TOTAL_STEPS = 4;

type ProfileRole = "CLIENT" | "PROVIDER";

export default function OnboardingScreen() {
  const colors = useColors();
  const { user, completeOnboarding } = useAuth();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const [selectedRoles, setSelectedRoles] = useState<ProfileRole[]>(["CLIENT"]);
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [state, setState] = useState("GO");
  const [isAdult, setIsAdult] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleRole(role: ProfileRole) {
    Haptics.selectionAsync();
    setSelectedRoles((prev) => {
      if (prev.includes(role)) {
        if (prev.length === 1) return prev;
        return prev.filter((r) => r !== role);
      }
      return [...prev, role];
    });
  }

  function isRoleSelected(role: ProfileRole) {
    return selectedRoles.includes(role);
  }

  const isDual = selectedRoles.includes("CLIENT") && selectedRoles.includes("PROVIDER");
  const isProviderOnly = selectedRoles.includes("PROVIDER") && !selectedRoles.includes("CLIENT");

  function formatPhone(text: string) {
    const cleaned = text.replace(/\D/g, "").slice(0, 11);
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }

  function nextStep() {
    setError("");
    if (step === 2) {
      if (!phone.replace(/\D/g, "") || phone.replace(/\D/g, "").length < 10)
        return setError("Informe um telefone válido");
      if (!city.trim()) return setError("Informe sua cidade");
    }
    if (step === 3) {
      if (!isAdult) return setError("Você deve ter 18 anos ou mais");
      if (!acceptedTerms) return setError("Aceite os termos para continuar");
    }
    if (step < TOTAL_STEPS) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep((s) => s + 1);
    } else {
      handleFinish();
    }
  }

  async function handleFinish() {
    setLoading(true);
    try {
      const primaryRole = isProviderOnly ? "PROVIDER" : "CLIENT";
      await completeOnboarding({
        role: primaryRole,
        roles: selectedRoles,
        phone: phone.replace(/\D/g, ""),
        city: city.trim(),
        neighborhood: neighborhood.trim(),
        state,
        acceptedTerms,
        verificationStatus: selectedRoles.includes("PROVIDER") ? "PENDING" : undefined,
        referredById: referralCode.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/");
    } catch {
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const progress = step / TOTAL_STEPS;

  return (
    <LinearGradient
      colors={["#5EB4B8", "#F7EFCF"]}
      style={[
        styles.container,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
      <View style={styles.progressBarWrapper}>
        <View style={[styles.progressTrack, { backgroundColor: "#21284E30" }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
                backgroundColor: colors.accent,
              },
            ]}
          />
        </View>
        <Text style={[styles.stepCounter, { color: colors.navy, fontFamily: "Inter_500Medium" }]}>
          {step} de {TOTAL_STEPS}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>
              Como quer usar o Trampaí?
            </Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Selecione um ou os dois perfis — você pode trocar de modo a qualquer momento
            </Text>

            <View style={styles.roleCards}>
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  {
                    backgroundColor: isRoleSelected("CLIENT") ? colors.navy : colors.card,
                    borderColor: isRoleSelected("CLIENT") ? colors.accent : colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
                onPress={() => toggleRole("CLIENT")}
                activeOpacity={0.8}
              >
                {isRoleSelected("CLIENT") && (
                  <View style={styles.checkBadge}>
                    <MaterialCommunityIcons name="check-circle" size={18} color="#F69926" />
                  </View>
                )}
                <MaterialCommunityIcons
                  name="account-outline"
                  size={40}
                  color={isRoleSelected("CLIENT") ? "#F69926" : colors.navy}
                />
                <Text
                  style={[
                    styles.roleTitle,
                    {
                      color: isRoleSelected("CLIENT") ? "#fff" : colors.foreground,
                      fontFamily: "Inter_700Bold",
                    },
                  ]}
                >
                  Cliente
                </Text>
                <Text
                  style={[
                    styles.roleDesc,
                    {
                      color: isRoleSelected("CLIENT") ? "#ffffff90" : colors.mutedForeground,
                      fontFamily: "Inter_400Regular",
                    },
                  ]}
                >
                  Quero contratar serviços
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleCard,
                  {
                    backgroundColor: isRoleSelected("PROVIDER") ? colors.navy : colors.card,
                    borderColor: isRoleSelected("PROVIDER") ? colors.accent : colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
                onPress={() => toggleRole("PROVIDER")}
                activeOpacity={0.8}
              >
                {isRoleSelected("PROVIDER") && (
                  <View style={styles.checkBadge}>
                    <MaterialCommunityIcons name="check-circle" size={18} color="#F69926" />
                  </View>
                )}
                <MaterialCommunityIcons
                  name="briefcase-outline"
                  size={40}
                  color={isRoleSelected("PROVIDER") ? "#F69926" : colors.navy}
                />
                <Text
                  style={[
                    styles.roleTitle,
                    {
                      color: isRoleSelected("PROVIDER") ? "#fff" : colors.foreground,
                      fontFamily: "Inter_700Bold",
                    },
                  ]}
                >
                  Prestador
                </Text>
                <Text
                  style={[
                    styles.roleDesc,
                    {
                      color: isRoleSelected("PROVIDER") ? "#ffffff90" : colors.mutedForeground,
                      fontFamily: "Inter_400Regular",
                    },
                  ]}
                >
                  Quero oferecer serviços
                </Text>
              </TouchableOpacity>
            </View>

            {isDual && (
              <View
                style={[
                  styles.dualBadge,
                  {
                    backgroundColor: colors.accent + "18",
                    borderColor: colors.accent + "40",
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <MaterialCommunityIcons name="account-switch-outline" size={18} color={colors.accent} />
                <Text style={[styles.dualText, { color: colors.navy, fontFamily: "Inter_500Medium" }]}>
                  Perfil duplo ativo! Você poderá trocar de modo a qualquer hora nas configurações do perfil.
                </Text>
              </View>
            )}
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>
              Seus dados
            </Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Para conectar você a prestadores da sua região
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.navy, fontFamily: "Inter_500Medium" }]}>
                Telefone (WhatsApp)
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, borderRadius: colors.radius, fontFamily: "Inter_400Regular" }]}
                placeholder="(64) 99999-9999"
                placeholderTextColor={colors.mutedForeground}
                value={phone}
                onChangeText={(t) => setPhone(formatPhone(t))}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.navy, fontFamily: "Inter_500Medium" }]}>
                Cidade
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, borderRadius: colors.radius, fontFamily: "Inter_400Regular" }]}
                placeholder="Ex: Goiânia"
                placeholderTextColor={colors.mutedForeground}
                value={city}
                onChangeText={setCity}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.navy, fontFamily: "Inter_500Medium" }]}>
                Bairro
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, borderRadius: colors.radius, fontFamily: "Inter_400Regular" }]}
                placeholder="Ex: Setor Bueno"
                placeholderTextColor={colors.mutedForeground}
                value={neighborhood}
                onChangeText={setNeighborhood}
              />
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>
              Confirmação
            </Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Leia e confirme antes de prosseguir
            </Text>

            <TouchableOpacity
              style={[styles.checkRow, { backgroundColor: colors.card, borderRadius: colors.radius }]}
              onPress={() => { setIsAdult(!isAdult); Haptics.selectionAsync(); }}
            >
              <View style={[styles.checkbox, { borderColor: isAdult ? colors.accent : colors.border, backgroundColor: isAdult ? colors.accent : "transparent" }]}>
                {isAdult && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
              </View>
              <Text style={[styles.checkText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                Confirmo que tenho 18 anos ou mais
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.checkRow, { backgroundColor: colors.card, borderRadius: colors.radius }]}
              onPress={() => { setAcceptedTerms(!acceptedTerms); Haptics.selectionAsync(); }}
            >
              <View style={[styles.checkbox, { borderColor: acceptedTerms ? colors.accent : colors.border, backgroundColor: acceptedTerms ? colors.accent : "transparent" }]}>
                {acceptedTerms && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
              </View>
              <Text style={[styles.checkText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                Li e aceito os{" "}
                <Text style={{ color: colors.cyan, textDecorationLine: "underline" }}>
                  Termos de Uso
                </Text>
              </Text>
            </TouchableOpacity>

            {selectedRoles.includes("PROVIDER") && (
              <View style={[styles.infoBox, { backgroundColor: colors.accent + "15", borderRadius: colors.radius, borderColor: colors.accent + "40" }]}>
                <MaterialCommunityIcons name="shield-check-outline" size={18} color={colors.accent} />
                <Text style={[styles.infoText, { color: colors.navy, fontFamily: "Inter_400Regular" }]}>
                  {isDual
                    ? "Como prestador, você precisará enviar documentos para verificação antes de desbloquear leads. Como cliente, já pode postar serviços agora!"
                    : "Como prestador, você precisará enviar documentos para verificação antes de desbloquear leads. Seus dados estão seguros."}
                </Text>
              </View>
            )}

            {!selectedRoles.includes("PROVIDER") && (
              <View style={[styles.infoBox, { backgroundColor: colors.cyan + "15", borderRadius: colors.radius, borderColor: colors.cyan + "40" }]}>
                <MaterialCommunityIcons name="gift-outline" size={18} color={colors.cyan} />
                <Text style={[styles.infoText, { color: colors.navy, fontFamily: "Inter_400Regular" }]}>
                  Você recebeu 5 créditos de boas-vindas! Poste serviços gratuitamente e receba propostas de prestadores qualificados.
                </Text>
              </View>
            )}
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>
              Código de indicação
            </Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Opcional — pule se não tiver
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.navy, fontFamily: "Inter_500Medium" }]}>
                Código de quem te indicou
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, borderRadius: colors.radius, fontFamily: "Inter_400Regular" }]}
                placeholder="Ex: ABC123"
                placeholderTextColor={colors.mutedForeground}
                value={referralCode}
                onChangeText={(t) => setReferralCode(t.toUpperCase())}
                autoCapitalize="characters"
                maxLength={6}
              />
            </View>

            <Text style={[styles.shareCode, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Seu código de indicação:{" "}
              <Text style={{ color: colors.accent, fontFamily: "Inter_700Bold" }}>
                {user?.referralCode}
              </Text>
            </Text>

            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: colors.navy + "10",
                  borderRadius: colors.radius,
                  borderColor: colors.navy + "25",
                },
              ]}
            >
              <Text style={[styles.summaryTitle, { color: colors.navy, fontFamily: "Inter_600SemiBold" }]}>
                Resumo do seu perfil
              </Text>
              <View style={styles.summaryRow}>
                <MaterialCommunityIcons
                  name={isDual ? "account-switch-outline" : selectedRoles.includes("PROVIDER") ? "briefcase-outline" : "account-outline"}
                  size={16}
                  color={colors.navy}
                />
                <Text style={[styles.summaryText, { color: colors.navy, fontFamily: "Inter_400Regular" }]}>
                  {isDual
                    ? "Cliente + Prestador (perfil duplo)"
                    : selectedRoles.includes("PROVIDER")
                    ? "Prestador de serviços"
                    : "Cliente"}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.navy} />
                <Text style={[styles.summaryText, { color: colors.navy, fontFamily: "Inter_400Regular" }]}>
                  {city || "Cidade não informada"}{neighborhood ? `, ${neighborhood}` : ""}
                </Text>
              </View>
            </View>
          </View>
        )}

        {error ? (
          <Text style={[styles.error, { fontFamily: "Inter_400Regular" }]}>{error}</Text>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity
            style={[styles.backBtn, { borderColor: colors.navy }]}
            onPress={() => { setStep((s) => s - 1); setError(""); }}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.navy} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.nextBtn,
            { backgroundColor: colors.accent, borderRadius: colors.radius },
          ]}
          onPress={nextStep}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={[styles.nextBtnText, { fontFamily: "Inter_600SemiBold" }]}>
                {step === TOTAL_STEPS ? "Começar" : "Próximo"}
              </Text>
              <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressBarWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 10,
    marginBottom: 4,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  stepCounter: {
    fontSize: 12,
  },
  content: {
    padding: 24,
    paddingTop: 16,
  },
  stepContainer: {
    gap: 20,
  },
  stepTitle: {
    fontSize: 26,
    lineHeight: 32,
  },
  stepSub: {
    fontSize: 14,
    marginTop: -12,
    lineHeight: 20,
  },
  roleCards: {
    flexDirection: "row",
    gap: 12,
  },
  roleCard: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    borderWidth: 2,
    gap: 8,
    position: "relative",
  },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  roleTitle: {
    fontSize: 16,
  },
  roleDesc: {
    fontSize: 12,
    textAlign: "center",
  },
  dualBadge: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderWidth: 1,
  },
  dualText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
    borderWidth: 0,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    gap: 10,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  shareCode: {
    fontSize: 14,
    textAlign: "center",
  },
  summaryCard: {
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  summaryTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  summaryText: {
    fontSize: 13,
  },
  error: {
    color: "#ef4444",
    fontSize: 13,
    marginTop: 8,
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
    alignItems: "center",
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    gap: 8,
  },
  nextBtnText: {
    color: "#fff",
    fontSize: 16,
  },
});
