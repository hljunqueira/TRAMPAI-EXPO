import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useImageUpload } from "@/hooks/useImageUpload";

export default function ClientPerfil() {
  const colors = useColors();
  const { user, logout, reviews, switchActiveMode, fetchMyData, api } = useAuth();
  const insets = useSafeAreaInsets();
  const { uploading, pickImage, takePhoto } = useImageUpload();

  async function pickAvatarImage() {
    Alert.alert(
      "Selecionar Foto",
      "Escolha a origem da sua foto de perfil",
      [
        { text: "Câmera", onPress: async () => {
          const url = await takePhoto();
          if (url) updateAvatar(url);
        }},
        { text: "Galeria", onPress: async () => {
          const url = await pickImage();
          if (url) updateAvatar(url);
        }},
        { text: "Cancelar", style: "cancel" },
      ]
    );
  }

  async function updateAvatar(url: string) {
    try {
      await api.patch("/auth/me", { avatarUrl: url });
      fetchMyData();
    } catch (e) {
      Alert.alert("Erro", "Não foi possível atualizar a foto de perfil.");
    }
  }

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
      switchActiveMode("PROVIDER");
      router.replace("/(provider)/mural");
    }
  }

  const initials = user?.name
    ? user.name
        .trim()
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 20 : 10), borderBottomWidth: 1, borderBottomColor: colors.border + "30", backgroundColor: colors.background }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerLogo, { fontFamily: "Inter_800ExtraBold", color: colors.primary }]}>Perfil</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={handleSwitchMode} 
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              gap: 6, 
              backgroundColor: colors.primary + "08",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 100,
              borderWidth: 1,
              borderColor: colors.primary + "10"
            }}
          >
            <MaterialCommunityIcons name="swap-horizontal" size={16} color={colors.primary} />
            <Text style={{ color: colors.primary, fontFamily: "Inter_700Bold", fontSize: 12 }}>
              {user?.role === "admin" ? "Modo Admin" : "Modo Prestador"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileHero, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={pickAvatarImage} disabled={uploading}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={{ width: 90, height: 90, borderRadius: 45 }} contentFit="cover" />
              ) : (
                <Text style={[styles.avatarText, { color: colors.card, fontFamily: "Inter_700Bold" }]}>{initials}</Text>
              )}
            </View>
            <View style={[styles.editBadge, { backgroundColor: colors.secondary }]}>
              {uploading ? (
                <ActivityIndicator size="small" color={colors.card} />
              ) : (
                <MaterialCommunityIcons name="camera" size={16} color={colors.card} />
              )}
            </View>
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.userName, { color: colors.primary, fontFamily: "Inter_800ExtraBold", textAlign: 'center' }]}>{user?.name}</Text>
            
            <View style={[styles.badgesRowBelow, { marginTop: 4 }]}>
              {(!user?.reviewCount || user.reviewCount === 0) && (
                <View style={[styles.ratingChip, { backgroundColor: colors.secondary + "15" }]}>
                  <MaterialCommunityIcons name="leaf" size={12} color={colors.secondary} />
                  <Text style={[styles.ratingText, { color: colors.secondary, fontFamily: "Inter_700Bold" }]}>Novo</Text>
                </View>
              )}
              {user?.isPremium && (
                <View style={[styles.premiumBadge, { backgroundColor: colors.accent }]}>
                  <MaterialCommunityIcons name="crown" size={12} color={colors.navy} />
                  <Text style={[styles.premiumBadgeText, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>PREMIUM</Text>
                </View>
              )}
              {user?.reviewCount ? user.reviewCount > 0 && (
                <View style={[styles.ratingChip, { backgroundColor: colors.secondary + "15" }]}>
                  <MaterialCommunityIcons name="star" size={12} color={colors.secondary} />
                  <Text style={[styles.ratingText, { color: colors.secondary, fontFamily: "Inter_700Bold" }]}>{String(user.rating || "0.0")}</Text>
                </View>
              ) : null}
            </View>

            <Text style={[styles.userEmail, { color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: 'center', marginTop: 12, marginBottom: 12 }]}>
              {user?.email}
            </Text>

            <View style={[styles.chipsRow, { justifyContent: 'center' }]}>
              <View style={[styles.chip, { backgroundColor: colors.primary + "08" }]}>
                <MaterialCommunityIcons name="map-marker" size={12} color={colors.primary} />
                <Text style={[styles.chipText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>{user?.city || "Local não informado"}</Text>
              </View>
              <View style={[styles.chip, { backgroundColor: colors.primary + "08" }]}>
                <MaterialCommunityIcons name="shield-check" size={12} color={colors.primary} />
                <Text style={[styles.chipText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Verificado</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.statsGrid, { backgroundColor: colors.card }]}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>{user?.jobsPostedCount ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Trampos</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border + "40" }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.secondary, fontFamily: "Inter_800ExtraBold" }]}>{user?.reviewCount || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Avaliações</Text>
          </View>
        </View>

        <View style={styles.quickActionsVertical}>
          <TouchableOpacity 
            style={[styles.primaryActionFull, { backgroundColor: colors.secondary + "20" }]}
            onPress={() => router.push("/editar-perfil")}
          >
            <MaterialCommunityIcons name="account-edit" size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Editar Perfil</Text>
              <Text style={{ color: colors.primary, fontSize: 11, opacity: 0.8 }}>Atualize seus dados pessoais e contato</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.primary + "40"} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.secondaryActionFull, { borderColor: colors.primary + "15", backgroundColor: colors.card }]}
            onPress={handleSwitchMode}
          >
            <MaterialCommunityIcons name="swap-horizontal" size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                {user?.role === "admin" ? "Painel Admin" : "Sou Prestador"}
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Alternar visão do aplicativo</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.primary + "40"} />
          </TouchableOpacity>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Suporte e Ajuda</Text>
          <TouchableOpacity style={styles.supportRow} onPress={() => Alert.alert("Suporte", "Abrindo WhatsApp do suporte...")}>
            <View style={[styles.infoIcon, { backgroundColor: "#25d36620" }]}>
              <MaterialCommunityIcons name="whatsapp" size={22} color="#25d366" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>Falar com Atendente</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Dúvidas ou problemas técnicos</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.primary + "20"} />
          </TouchableOpacity>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: "#FFF", marginBottom: 12 }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Avaliações Recebidas</Text>
          {user?.reviewCount && reviews && reviews.length > 0 ? (
            <View style={styles.reviewCard}>
              {reviews.map((rev: any) => (
                <View key={rev.id} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    {rev.fromUserAvatar ? (
                      <Image source={{ uri: rev.fromUserAvatar }} style={styles.reviewerAvatar} />
                    ) : (
                      <View style={[styles.reviewerAvatar, { backgroundColor: colors.primary + "10", alignItems: 'center', justifyContent: 'center' }]}>
                        <Text style={{ fontSize: 10, color: colors.primary, fontFamily: 'Inter_700Bold' }}>{rev.fromUserName?.[0]}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.reviewerName, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>{rev.fromUserName}</Text>
                      <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <MaterialCommunityIcons 
                            key={star} 
                            name="star" 
                            size={12} 
                            color={star <= rev.rating ? colors.secondary : colors.border} 
                          />
                        ))}
                      </View>
                    </View>
                    <Text style={[styles.reviewDate, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  {rev.comment ? (
                    <Text style={[styles.reviewComment, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>{rev.comment}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyPortfolio}>
              <MaterialCommunityIcons name="star-outline" size={32} color={colors.mutedForeground + "40"} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Nenhuma avaliação recebida como cliente</Text>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={styles.logoutBtnFull} 
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="logout" size={22} color="#dc2626" />
          <Text style={[styles.logoutBtnText, { color: "#dc2626", fontFamily: "Inter_700Bold" }]}>Encerrar Sessão</Text>
        </TouchableOpacity>
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
  profileHero: { alignItems: "center", paddingTop: 24, paddingBottom: 24, paddingHorizontal: 20, gap: 12 },
  avatarWrapper: { position: "relative", marginBottom: 12 },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center", shadowColor: "#0b1339", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4, overflow: "hidden" },
  editBadge: { position: "absolute", bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#FFF" },
  userName: { fontSize: 20 },
  badgesRowBelow: { flexDirection: "row", alignItems: "center", gap: 8 },
  ratingChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100 },
  ratingText: { fontSize: 13 },
  premiumBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  premiumBadgeText: { fontSize: 10 },
  userEmail: { fontSize: 14, marginBottom: 12 },
  chipsRow: { flexDirection: "row", gap: 10 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  chipText: { fontSize: 12 },
  avatarText: { fontSize: 32 },
  statsGrid: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, padding: 20, borderRadius: 24, marginBottom: 20, shadowColor: "#0b1339", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  statBox: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 20, marginBottom: 2 },
  statLabel: { fontSize: 11 },
  statDivider: { width: 1, height: 24 },
  quickActionsVertical: { paddingHorizontal: 20, gap: 12, marginBottom: 24 },
  primaryActionFull: { flexDirection: "row", padding: 16, alignItems: "center", borderRadius: 20, gap: 16, shadowColor: "#e8c08a", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 3 },
  secondaryActionFull: { flexDirection: "row", padding: 16, alignItems: "center", borderRadius: 20, borderWidth: 1.5, gap: 16 },
  actionText: {
    fontSize: 15,
  },
  reviewCard: { gap: 16 },
  reviewItem: { borderBottomWidth: 1, borderBottomColor: "#00000008", paddingBottom: 16 },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  reviewerAvatar: { width: 32, height: 32, borderRadius: 16 },
  reviewerName: { fontSize: 14 },
  starsRow: { flexDirection: "row", gap: 2 },
  reviewDate: { fontSize: 11 },
  reviewComment: { fontSize: 13, lineHeight: 18 },
  supportRow: { flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 8 },
  infoIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sectionCard: { marginHorizontal: 20, borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: "#0b1339", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 16, marginBottom: 12 },
  emptyPortfolio: { alignItems: "center", justifyContent: "center", paddingVertical: 24, borderWidth: 1, borderColor: "#00000008", borderRadius: 16, backgroundColor: "#FDFBF7", gap: 8 },
  emptyText: { fontSize: 13 },
  logoutBtnFull: { 
    marginHorizontal: 20, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    padding: 16, 
    borderRadius: 20, 
    gap: 12, 
    marginBottom: 40,
    backgroundColor: "#fee2e2",
    borderColor: "#fecaca",
    borderWidth: 1
  },
  logoutBtnText: { fontSize: 16 },
});
