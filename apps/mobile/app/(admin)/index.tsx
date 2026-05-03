import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function AdminDashboard() {
  const colors = useColors();
  const { user, allUsers, services, transactions, leads, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const totalUsers = allUsers.length;
  const clients = allUsers.filter((u) => u.role === "CLIENT").length;
  const providers = allUsers.filter((u) => u.role === "PROVIDER").length;
  const pendingVerifications = allUsers.filter((u) => u.verificationStatus === "PENDING").length;
  const openServices = services.filter((s) => s.status === "OPEN").length;
  const totalRevenueCents = transactions
    .filter((t) => t.type === "PURCHASE")
    .reduce((sum, t) => sum + t.amountCents, 0);
  const totalLeads = leads.length;

  const recentServices = services
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.navy, "#1a2045"]}
        style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.adminLabel, { fontFamily: "Inter_400Regular" }]}>Admin</Text>
            <Text style={[styles.headerTitle, { fontFamily: "Inter_700Bold" }]}>Dashboard</Text>
          </View>
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: "#ffffff15" }]}
            onPress={async () => { await logout(); router.replace("/login"); }}
          >
            <MaterialCommunityIcons name="logout" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          {[
            { label: "Usuários", value: totalUsers, icon: "account-group-outline" as const, color: colors.cyan },
            { label: "Clientes", value: clients, icon: "account-outline" as const, color: "#6366f1" },
            { label: "Prestadores", value: providers, icon: "briefcase-outline" as const, color: "#f59e0b" },
            { label: "Verificações Pendentes", value: pendingVerifications, icon: "shield-alert-outline" as const, color: "#ef4444" },
            { label: "Serviços Abertos", value: openServices, icon: "clipboard-list-outline" as const, color: "#22c55e" },
            { label: "Leads Total", value: totalLeads, icon: "handshake-outline" as const, color: colors.accent },
          ].map((stat) => (
            <View
              key={stat.label}
              style={[styles.statCard, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}
            >
              <MaterialCommunityIcons name={stat.icon} size={22} color={stat.color} />
              <Text style={[styles.statValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                {stat.value}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.revenueCard, { backgroundColor: colors.navy, borderRadius: colors.radius }]}>
          <MaterialCommunityIcons name="cash-multiple" size={28} color={colors.accent} />
          <View>
            <Text style={[styles.revenueLabel, { fontFamily: "Inter_400Regular" }]}>Receita Total (PIX)</Text>
            <Text style={[styles.revenueValue, { fontFamily: "Inter_700Bold" }]}>
              R$ {(totalRevenueCents / 100).toFixed(2).replace(".", ",")}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Serviços Recentes
        </Text>

        {recentServices.map((s) => (
          <View key={s.id} style={[styles.serviceRow, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.serviceTitle, { color: colors.foreground, fontFamily: "Inter_500Medium" }]} numberOfLines={1}>
                {s.title}
              </Text>
              <Text style={[styles.serviceMeta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {s.category} · {s.city} · {s.clientName}
              </Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: s.status === "OPEN" ? "#22c55e" : "#6b7280" }]} />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.usersBtn, { backgroundColor: colors.accent, borderRadius: colors.radius }]}
          onPress={() => router.push("/(admin)/usuarios")}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="account-group-outline" size={18} color="#fff" />
          <Text style={[styles.usersBtnText, { fontFamily: "Inter_600SemiBold" }]}>
            Gerenciar Usuários
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  adminLabel: { color: "#ffffff80", fontSize: 13 },
  headerTitle: { color: "#fff", fontSize: 24 },
  logoutBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  content: { padding: 16, gap: 16 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "47%", alignItems: "center", padding: 16, borderWidth: 1, gap: 6 },
  statValue: { fontSize: 28 },
  statLabel: { fontSize: 11, textAlign: "center" },
  revenueCard: { flexDirection: "row", alignItems: "center", padding: 20, gap: 16 },
  revenueLabel: { color: "#ffffff80", fontSize: 13 },
  revenueValue: { color: "#fff", fontSize: 28 },
  sectionTitle: { fontSize: 18 },
  serviceRow: { flexDirection: "row", alignItems: "center", padding: 14, borderWidth: 1, gap: 10 },
  serviceTitle: { fontSize: 13 },
  serviceMeta: { fontSize: 11, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  usersBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, gap: 8 },
  usersBtnText: { color: "#fff", fontSize: 15 },
});
