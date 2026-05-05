import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Image,
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

export default function ProviderPerfil() {
  const colors = useColors();
  const { user, logout, leads, activeMode, switchActiveMode } = useAuth();
  const insets = useSafeAreaInsets();

  const myLeads = leads.filter((l) => l.providerId === user?.id);
  const totalSpent = myLeads.reduce((sum, l) => sum + l.cost, 0);

  const isVerified = user?.verificationStatus === "APPROVED" || user?.role === "admin";

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (user?.role === "admin") {
      switchActiveMode("ADMIN");
      router.replace("/(admin)");
    } else {
      switchActiveMode("CLIENT");
      router.replace("/(client)");
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return "??";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 20 : 10), borderBottomWidth: 1, borderBottomColor: colors.border + "30", backgroundColor: "#fff" }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerLogo, { fontFamily: "Inter_800ExtraBold", color: colors.primary }]}>Trampaí</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleSwitchMode}>
            <MaterialCommunityIcons name="swap-horizontal" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 + insets.bottom }} showsVerticalScrollIndicator={false}>
        {/* Profile Hero Section */}
        <View style={[styles.profileHero, { backgroundColor: "#FFF" }]}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: "#FFF", fontFamily: "Inter_700Bold" }]}>{getInitials(user?.name)}</Text>
            </View>
            {isVerified && (
              <View style={[styles.verifiedBadge, { backgroundColor: "#e8c08a" }]}>
                <MaterialCommunityIcons name="check-decagram" size={18} color={colors.primary} />
              </View>
            )}
          </View>

          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>{user?.name}</Text>
              <View style={[styles.ratingChip, { backgroundColor: colors.secondary + "15" }]}>
                <MaterialCommunityIcons name="star" size={12} color={colors.secondary} />
                <Text style={[styles.ratingText, { color: colors.secondary, fontFamily: "Inter_700Bold" }]}>{user?.rating || "5.0"}</Text>
              </View>
            </View>
            
            <Text style={[styles.userRole, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {user?.providerBio ? user.providerBio.substring(0, 80) + (user.providerBio.length > 80 ? "..." : "") : "Profissional de Serviços"}
            </Text>

            <View style={styles.chipsRow}>
              <View style={[styles.chip, { backgroundColor: colors.primary + "08" }]}>
                <MaterialCommunityIcons name="map-marker" size={12} color={colors.primary} />
                <Text style={[styles.chipText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>{user?.city || "Local não informado"}</Text>
              </View>
              <View style={[styles.chip, { backgroundColor: colors.primary + "08" }]}>
                <MaterialCommunityIcons name="shield-check" size={12} color={colors.primary} />
                <Text style={[styles.chipText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>{isVerified ? "Verificado" : "Pendente"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={[styles.statsGrid, { backgroundColor: "#FFF" }]}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>{myLeads.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Serviços</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border + "40" }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>{user?.creditBalance ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Créditos</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border + "40" }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.secondary, fontFamily: "Inter_800ExtraBold" }]}>{user?.reviewCount || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Avaliações</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={[styles.primaryAction, { backgroundColor: "#e8c08a" }]}>
            <MaterialCommunityIcons name="account-edit" size={20} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Editar Perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.secondaryAction, { borderColor: colors.primary + "30" }]}
            onPress={() => router.push("/(provider)/carteira")}
          >
            <MaterialCommunityIcons name="wallet" size={20} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Minha Carteira</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={[styles.sectionCard, { backgroundColor: "#FFF" }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Sobre o Profissional</Text>
          <Text style={[styles.sectionDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {user?.providerBio || "Você ainda não preencheu sua biografia. Complete seu perfil para passar mais confiança aos clientes."}
          </Text>
        </View>

        {/* Portfolio Section */}
        <View style={[styles.sectionCard, { backgroundColor: "#FFF" }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Portfólio</Text>
            <TouchableOpacity><Text style={[styles.seeAll, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Editar</Text></TouchableOpacity>
          </View>
          <View style={styles.emptyPortfolio}>
            <MaterialCommunityIcons name="image-outline" size={32} color={colors.mutedForeground + "40"} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Nenhuma foto adicionada</Text>
          </View>
        </View>

        {/* Reviews Section */}
        <View style={[styles.sectionCard, { backgroundColor: "#FFF", marginBottom: 32 }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Avaliações Recentes</Text>
          {user?.reviewCount ? (
             <View style={styles.reviewCard}>
              {/* This would be a real review loop if we had reviews data */}
             </View>
          ) : (
            <View style={styles.emptyPortfolio}>
              <MaterialCommunityIcons name="star-outline" size={32} color={colors.mutedForeground + "40"} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Nenhuma avaliação recebida</Text>
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
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  profileHero: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0b1339",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarText: {
    fontSize: 32,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFF",
  },
  headerInfo: {
    alignItems: "center",
    width: "100%",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  userName: {
    fontSize: 22,
  },
  ratingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  ratingText: {
    fontSize: 13,
  },
  userRole: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  chipText: {
    fontSize: 12,
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  primaryAction: {
    flex: 1,
    flexDirection: "row",
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    gap: 8,
    shadowColor: "#e8c08a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: "row",
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
  },
  actionText: {
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: "#0b1339",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  sectionCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#0b1339",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 13,
    lineHeight: 20,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 12,
  },
  portfolioGrid: {
    flexDirection: "row",
    gap: 12,
  },
  portfolioImg: {
    flex: 1,
    height: 80,
    borderRadius: 12,
  },
  emptyPortfolio: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: "#00000008",
    borderRadius: 16,
    backgroundColor: "#FDFBF7",
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
  },
  reviewCard: {
    gap: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  miniAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  miniAvatarText: {
    fontSize: 14,
  },
  reviewName: {
    fontSize: 14,
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 11,
  },
  reviewStars: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F6992615",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  reviewRate: {
    fontSize: 12,
  },
  reviewText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
