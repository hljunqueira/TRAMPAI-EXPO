import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function ClientPerfil() {
  const colors = useColors();
  const { user, logout, transactions } = useAuth();
  const insets = useSafeAreaInsets();
  const [showReferral, setShowReferral] = useState(false);

  const myTransactions = transactions
    .filter((t) => t.userId === user?.id)
    .slice(-5)
    .reverse();

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

  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.navy,
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
          },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Text style={[styles.avatarText, { fontFamily: "Inter_700Bold" }]}>
            {initials}
          </Text>
        </View>
        <Text style={[styles.name, { fontFamily: "Inter_700Bold" }]}>
          {user?.name}
        </Text>
        <Text style={[styles.email, { fontFamily: "Inter_400Regular" }]}>
          {user?.email}
        </Text>
        <View style={[styles.roleBadge, { backgroundColor: colors.accent }]}>
          <Text style={[styles.roleText, { fontFamily: "Inter_600SemiBold" }]}>
            Cliente
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.section, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="star-circle" size={20} color={colors.accent} />
            <Text style={[styles.infoLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Créditos
            </Text>
            <Text style={[styles.infoValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              {user?.creditBalance ?? 0}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="phone-outline" size={20} color={colors.cyan} />
            <Text style={[styles.infoLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Telefone
            </Text>
            <Text style={[styles.infoValue, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
              {user?.phone || "Não informado"}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={20} color={colors.cyan} />
            <Text style={[styles.infoLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Cidade
            </Text>
            <Text style={[styles.infoValue, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
              {user?.city || "Não informada"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.referralCard, { backgroundColor: colors.navy + "10", borderRadius: colors.radius, borderColor: colors.navy + "30" }]}
          onPress={() => setShowReferral(!showReferral)}
        >
          <View style={styles.referralHeader}>
            <MaterialCommunityIcons name="account-plus-outline" size={20} color={colors.navy} />
            <Text style={[styles.referralTitle, { color: colors.navy, fontFamily: "Inter_600SemiBold" }]}>
              Indique e Ganhe
            </Text>
            <MaterialCommunityIcons
              name={showReferral ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.navy}
            />
          </View>
          {showReferral && (
            <View style={styles.referralContent}>
              <Text style={[styles.referralDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Seu código de indicação. Quando alguém usar seu código e fizer a primeira compra, você ganha 10 créditos!
              </Text>
              <View style={[styles.codeBox, { backgroundColor: colors.card, borderRadius: 8 }]}>
                <Text style={[styles.code, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>
                  {user?.referralCode}
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {myTransactions.length > 0 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              Últimas Transações
            </Text>
            <View style={[styles.section, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}>
              {myTransactions.map((tx, i) => (
                <View key={tx.id}>
                  {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                  <View style={styles.txRow}>
                    <View style={[styles.txIcon, { backgroundColor: tx.credits > 0 ? "#22c55e15" : "#ef444415" }]}>
                      <MaterialCommunityIcons
                        name={tx.credits > 0 ? "arrow-down" : "arrow-up"}
                        size={14}
                        color={tx.credits > 0 ? "#22c55e" : "#ef4444"}
                      />
                    </View>
                    <Text style={[styles.txDesc, { color: colors.foreground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
                      {tx.description}
                    </Text>
                    <Text
                      style={[
                        styles.txAmount,
                        {
                          color: tx.credits > 0 ? "#22c55e" : "#ef4444",
                          fontFamily: "Inter_700Bold",
                        },
                      ]}
                    >
                      {tx.credits > 0 ? "+" : ""}{tx.credits} cr
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: "#ef4444", borderRadius: colors.radius }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="logout" size={18} color="#ef4444" />
          <Text style={[styles.logoutText, { fontFamily: "Inter_600SemiBold" }]}>
            Sair da conta
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarText: { color: "#fff", fontSize: 28 },
  name: { color: "#fff", fontSize: 20 },
  email: { color: "#ffffff80", fontSize: 14 },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 12 },
  roleText: { color: "#fff", fontSize: 12 },
  content: { padding: 16, gap: 16 },
  section: { borderWidth: 1, overflow: "hidden" },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  infoLabel: { flex: 1, fontSize: 14 },
  infoValue: { fontSize: 14 },
  divider: { height: StyleSheet.hairlineWidth },
  referralCard: { borderWidth: 1, padding: 14, gap: 10 },
  referralHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  referralTitle: { flex: 1, fontSize: 15 },
  referralContent: { gap: 10 },
  referralDesc: { fontSize: 13, lineHeight: 18 },
  codeBox: { alignItems: "center", paddingVertical: 12 },
  code: { fontSize: 28, letterSpacing: 6 },
  sectionTitle: { fontSize: 18, marginBottom: 4 },
  txRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  txIcon: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  txDesc: { flex: 1, fontSize: 13 },
  txAmount: { fontSize: 14 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderWidth: 1.5, gap: 8 },
  logoutText: { color: "#ef4444", fontSize: 15 },
});
