import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function ProviderPerfil() {
  const colors = useColors();
  const { user, logout, leads, switchActiveMode } = useAuth();
  const insets = useSafeAreaInsets();

  const myLeads = leads.filter((l) => l.providerId === user?.id);
  const totalSpent = myLeads.reduce((sum, l) => sum + l.creditsSpent, 0);

  const isDual =
    user?.roles?.includes("CLIENT") && user?.roles?.includes("PROVIDER");

  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
    : "?";

  const verificationColor =
    user?.verificationStatus === "APPROVED"
      ? "#22c55e"
      : user?.verificationStatus === "REJECTED"
      ? "#ef4444"
      : "#f59e0b";

  const verificationLabel =
    user?.verificationStatus === "APPROVED"
      ? "Verificado"
      : user?.verificationStatus === "REJECTED"
      ? "Rejeitado"
      : "Verificação Pendente";

  function handleLogout() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Sair", "Deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  }

  function handleSwitchMode() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    switchActiveMode("CLIENT");
    router.replace("/");
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.navy, paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Text style={[styles.avatarText, { fontFamily: "Inter_700Bold" }]}>{initials}</Text>
        </View>
        <Text style={[styles.name, { fontFamily: "Inter_700Bold" }]}>{user?.name}</Text>
        <Text style={[styles.email, { fontFamily: "Inter_400Regular" }]}>{user?.email}</Text>
        <View style={styles.badgesRow}>
          <View style={[styles.verificationBadge, { backgroundColor: verificationColor + "20", borderColor: verificationColor + "40" }]}>
            <MaterialCommunityIcons
              name={user?.verificationStatus === "APPROVED" ? "shield-check" : "shield-alert"}
              size={14}
              color={verificationColor}
            />
            <Text style={[styles.verificationText, { color: verificationColor, fontFamily: "Inter_600SemiBold" }]}>
              {verificationLabel}
            </Text>
          </View>
          {isDual && (
            <View style={[styles.verificationBadge, { backgroundColor: "#ffffff15", borderColor: "#ffffff25" }]}>
              <MaterialCommunityIcons name="account-outline" size={14} color="#ffffff80" />
              <Text style={[styles.verificationText, { color: "#ffffff80", fontFamily: "Inter_600SemiBold" }]}>
                Cliente
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        {isDual && (
          <TouchableOpacity
            style={[
              styles.switchModeCard,
              {
                backgroundColor: colors.cyan + "10",
                borderRadius: colors.radius,
                borderColor: colors.cyan + "30",
              },
            ]}
            onPress={handleSwitchMode}
            activeOpacity={0.8}
          >
            <View style={[styles.switchModeIcon, { backgroundColor: colors.cyan + "15" }]}>
              <MaterialCommunityIcons name="account-switch-outline" size={22} color={colors.cyan} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.switchModeTitle, { color: colors.navy, fontFamily: "Inter_600SemiBold" }]}>
                Alternar para Modo Cliente
              </Text>
              <Text style={[styles.switchModeDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Poste serviços e receba propostas de prestadores
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}

        <View style={styles.statsRow}>
          {[
            { label: "Leads", value: myLeads.length, icon: "briefcase-outline" as const },
            { label: "Créditos Gastos", value: totalSpent, icon: "star-circle" as const },
            { label: "Saldo", value: user?.creditBalance ?? 0, icon: "wallet-outline" as const },
          ].map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}>
              <MaterialCommunityIcons name={stat.icon} size={20} color={colors.accent} />
              <Text style={[styles.statValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="phone-outline" size={20} color={colors.cyan} />
            <Text style={[styles.infoLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Telefone</Text>
            <Text style={[styles.infoValue, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{user?.phone || "Não informado"}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={20} color={colors.cyan} />
            <Text style={[styles.infoLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Cidade</Text>
            <Text style={[styles.infoValue, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{user?.city || "Não informada"}</Text>
          </View>
        </View>

        {user?.verificationStatus !== "APPROVED" && (
          <View style={[styles.verificationCard, { backgroundColor: colors.accent + "10", borderRadius: colors.radius, borderColor: colors.accent + "30" }]}>
            <MaterialCommunityIcons name="shield-alert-outline" size={24} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.verCardTitle, { color: colors.navy, fontFamily: "Inter_600SemiBold" }]}>
                {user?.verificationStatus === "REJECTED" ? "Verificação rejeitada" : "Verificação pendente"}
              </Text>
              <Text style={[styles.verCardDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {user?.verificationStatus === "REJECTED"
                  ? "Sua verificação foi rejeitada. Entre em contato com o suporte."
                  : "Sua conta está sendo verificada. Enquanto isso, você pode explorar o mural."}
              </Text>
            </View>
          </View>
        )}

        <View style={[styles.referralCard, { backgroundColor: colors.navy + "08", borderRadius: colors.radius }]}>
          <View style={styles.referralRow}>
            <MaterialCommunityIcons name="account-plus-outline" size={18} color={colors.navy} />
            <Text style={[styles.referralTitle, { color: colors.navy, fontFamily: "Inter_600SemiBold" }]}>Código de Indicação</Text>
          </View>
          <View style={[styles.codeBox, { backgroundColor: colors.card, borderRadius: 8 }]}>
            <Text style={[styles.code, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>{user?.referralCode}</Text>
          </View>
          <Text style={[styles.referralDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Compartilhe e ganhe 10 créditos quando alguém usar seu código na primeira compra.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: "#ef4444", borderRadius: colors.radius }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="logout" size={18} color="#ef4444" />
          <Text style={[styles.logoutText, { fontFamily: "Inter_600SemiBold" }]}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: "center", paddingHorizontal: 20, paddingBottom: 28, gap: 8 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  avatarText: { color: "#fff", fontSize: 28 },
  name: { color: "#fff", fontSize: 20 },
  email: { color: "#ffffff80", fontSize: 14 },
  badgesRow: { flexDirection: "row", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "center" },
  verificationBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, borderWidth: 1, gap: 5 },
  verificationText: { fontSize: 12 },
  content: { padding: 16, gap: 16 },
  switchModeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  switchModeIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  switchModeTitle: { fontSize: 14, marginBottom: 2 },
  switchModeDesc: { fontSize: 12, lineHeight: 16 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, alignItems: "center", padding: 14, borderWidth: 1, gap: 4 },
  statValue: { fontSize: 22 },
  statLabel: { fontSize: 11, textAlign: "center" },
  section: { borderWidth: 1, overflow: "hidden" },
  infoRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  infoLabel: { flex: 1, fontSize: 14 },
  infoValue: { fontSize: 14 },
  divider: { height: StyleSheet.hairlineWidth },
  verificationCard: { flexDirection: "row", padding: 16, gap: 12, borderWidth: 1 },
  verCardTitle: { fontSize: 14, marginBottom: 4 },
  verCardDesc: { fontSize: 13, lineHeight: 18 },
  referralCard: { padding: 16, gap: 10 },
  referralRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  referralTitle: { fontSize: 15 },
  codeBox: { alignItems: "center", paddingVertical: 12 },
  code: { fontSize: 28, letterSpacing: 6 },
  referralDesc: { fontSize: 13, lineHeight: 18 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderWidth: 1.5, gap: 8 },
  logoutText: { color: "#ef4444", fontSize: 15 },
});
