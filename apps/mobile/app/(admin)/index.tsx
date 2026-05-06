import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { SimpleChart } from "@/components/admin/SimpleChart";


export default function AdminDashboard() {
  const colors = useColors();
  const {
    user,
    adminStats,
    adminRecentJobs,
    fetchAdminData,
    logout,
    switchActiveMode,
  } = useAuth();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchAdminData();
    setRefreshing(false);
  }, []);

  const handleLogout = () => {
    router.replace("/login");
    logout();
  };

  const getInitials = (name?: string) => {
    if (!name) return "??";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  if (!adminStats) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.mutedForeground, marginTop: 12, fontFamily: "Inter_500Medium" }}>Carregando painel...</Text>
      </View>
    );
  }

  const { users, jobs, revenue, leads } = adminStats;
  const firstName = user?.name?.split(" ")[0] || "Admin";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Standardized Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 20 : 10), borderBottomWidth: 1, borderBottomColor: colors.border + "30", backgroundColor: "#fff" }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerLogo, { fontFamily: "Inter_800ExtraBold", color: colors.primary }]}>Trampaí</Text>
          <View style={[styles.adminBadge, { backgroundColor: colors.primary + "10" }]}>
            <Text style={[styles.adminBadgeText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>ADMIN</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={[styles.initialsAvatar, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(admin)/perfil")}
          >
            <Text style={[styles.initialsText, { color: "#FFF", fontFamily: "Inter_700Bold" }]}>
              {getInitials(user?.name)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeSub, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Visão Geral</Text>
          <Text style={[styles.welcomeTitle, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>Olá, {firstName}!</Text>
        </View>

        {/* Financial Card */}
        <View style={[styles.revenueCard, { backgroundColor: colors.primary }]}>
          <View style={styles.revContent}>
            <View>
              <Text style={[styles.revLabel, { color: "#ffffff90", fontFamily: "Inter_500Medium" }]}>Faturamento Total</Text>
              <Text style={[styles.revValue, { color: "#fff", fontFamily: "Inter_800ExtraBold" }]}>
                R$ {(revenue.totalCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={[styles.revIconBox, { backgroundColor: "#ffffff20" }]}>
              <MaterialCommunityIcons name="finance" size={28} color="#fff" />
            </View>
          </View>
          <View style={[styles.revFooter, { borderTopColor: "#ffffff20", borderTopWidth: 1 }]}>
            <MaterialCommunityIcons name="trending-up" size={16} color={colors.secondary} />
            <Text style={[styles.revFooterText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>Receita Bruta Acumulada</Text>
          </View>
        </View>

        {/* BI Charts */}
        {revenue.history && revenue.history.length > 0 && (
          <SimpleChart data={revenue.history} title="Faturamento Diário (Últimos 7 dias)" />
        )}


        {/* Quick Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: "#fff" }]}
            onPress={() => router.push("/(admin)/usuarios")}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.secondary + "20" }]}>
              <MaterialCommunityIcons name="account-check" size={24} color={colors.secondary} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Validar Usuários</Text>
            {users.pending > 0 && (
              <View style={[styles.countBadge, { backgroundColor: "#ef4444" }]}>
                <Text style={styles.countText}>{users.pending}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: "#fff" }]}
            onPress={() => router.push("/(admin)/configuracoes")}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primary + "10" }]}>
              <MaterialCommunityIcons name="tune" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Configurações</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>Métricas</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: "#fff" }]}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Usuários</Text>
            <Text style={[styles.statValue, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>{users.total}</Text>
            <View style={styles.statMeta}>
              <Text style={[styles.statSub, { color: colors.secondary, fontFamily: "Inter_700Bold" }]}>{users.providers}p</Text>
              <Text style={[styles.statSub, { color: colors.mutedForeground }]}> / {users.clients}c</Text>
            </View>
          </View>

          <View style={[styles.statBox, { backgroundColor: "#fff" }]}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Jobs</Text>
            <Text style={[styles.statValue, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>{jobs.open}</Text>
            <Text style={[styles.statSub, { color: colors.secondary, fontFamily: "Inter_700Bold" }]}>{jobs.total} total</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: "#fff" }]}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Indicações</Text>
            <Text style={[styles.statValue, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>{adminStats.referrals?.total || 0}</Text>
            <Text style={[styles.statSub, { color: colors.secondary, fontFamily: "Inter_700Bold" }]}>{adminStats.referrals?.bonusGiven || 0} cr bônus</Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_800ExtraBold", marginBottom: 0 }]}>Atividade Recente</Text>
          <TouchableOpacity onPress={() => router.push("/(admin)/usuarios")}>
            <Text style={[styles.seeAll, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Ver Tudo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityCard}>
          {adminRecentJobs.map((job, idx) => (
            <View key={job.id} style={[styles.activityItem, idx !== adminRecentJobs.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border + "10" }]}>
              <View style={[styles.activityIcon, { backgroundColor: colors.primary + "10" }]}>
                <MaterialCommunityIcons name="briefcase-variant" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.activityTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]} numberOfLines={1}>
                  {job.title}
                </Text>
                <Text style={[styles.activityMeta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {job.category?.name} · {job.location}
                </Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: job.status === "open" ? colors.secondary : colors.border }]} />
            </View>
          ))}
          {adminRecentJobs.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="history" size={32} color={colors.mutedForeground + "40"} />
              <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium" }}>Nenhuma atividade recente</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerLogo: {
    fontSize: 22,
    letterSpacing: -1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  adminBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminBadgeText: {
    fontSize: 10,
  },
  initialsAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: {
    fontSize: 16,
  },
  content: {
    padding: 20,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeSub: {
    fontSize: 14,
    marginBottom: 4,
  },
  welcomeTitle: {
    fontSize: 28,
    letterSpacing: -0.5,
  },
  revenueCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#0b1339",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  revContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  revLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  revValue: {
    fontSize: 28,
  },
  revIconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  revFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 12,
  },
  revFooterText: {
    fontSize: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    shadowColor: "#0b1339",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: "relative",
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  countBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  countText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    shadowColor: "#0b1339",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
  },
  statMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  statSub: {
    fontSize: 11,
  },
  activityCard: {
    borderRadius: 24,
    backgroundColor: "#fff",
    padding: 16,
    shadowColor: "#0b1339",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  activityTitle: {
    fontSize: 14,
  },
  activityMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 8,
  },
});
