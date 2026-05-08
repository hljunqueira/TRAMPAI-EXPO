import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import React, { useLayoutEffect } from "react";
import {
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth, API_BASE_URL } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { storage } from "@/lib/storage";

export default function DetalhesProposta() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id, providerId } = useLocalSearchParams();
  const { user, fetchJobById } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [job, setJob] = React.useState<any>(null);
  const [selectedLead, setSelectedLead] = React.useState<any>(null);
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      tabBarStyle: { display: "none" },
    });
  }, [navigation]);

  React.useEffect(() => {
    loadData();
  }, [id, providerId]);

  async function loadData() {
    setLoading(true);
    const data = await fetchJobById(id as string);
    if (data) {
      setJob(data);
      // If we have a providerId, find that lead. Otherwise pick the first one.
      const lead = providerId 
        ? data.leads.find((l: any) => l.providerId === providerId)
        : data.leads[0];
      setSelectedLead(lead);
    }
    setLoading(false);
  }

  const handleRespond = async (action: "ACCEPT" | "REJECT") => {
    try {
      const token = await storage.getItem("trampai_auth_token");
      const res = await fetch(`${API_BASE_URL}/api/jobs/${job.id}/respond-exclusive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      if (res.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      } else {
        const error = await res.json();
        Alert.alert("Erro", error.error || "Erro ao responder proposta");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Erro", "Erro na conexão com o servidor");
    }
  };

  const handleRejectLead = async () => {
    try {
      const token = await storage.getItem("trampai_auth_token");
      const res = await fetch(`${API_BASE_URL}/api/jobs/${job.id}/reject-lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ providerId: selectedLead?.provider?.id })
      });

      if (res.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      } else {
        const error = await res.json();
        Alert.alert("Erro", error.error || "Erro ao recusar proposta");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Erro", "Erro na conexão com o servidor");
    }
  };

  const handleOpenWhatsApp = () => {
    if (!selectedLead?.whatsappLink) {
      // Se não tiver o link pronto, tenta gerar um básico
      const phone = selectedLead.provider.phone?.replace(/\D/g, "");
      if (!phone) return;
      const url = `https://wa.me/55${phone}?text=Olá ${selectedLead.provider.name}, vi sua proposta no Trampaí!`;
      Linking.openURL(url);
      return;
    }
    Linking.openURL(selectedLead.whatsappLink);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#F69926" />
      </View>
    );
  }

  if (!job || !selectedLead) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center", padding: 20 }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.mutedForeground} />
        <Text style={{ textAlign: "center", marginTop: 10, color: colors.navy, fontFamily: "Inter_700Bold" }}>Proposta não encontrada ou serviço encerrado.</Text>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.back()}>
          <Text style={{ color: "#F69926", fontFamily: "Inter_700Bold" }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const provider = selectedLead.provider;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: "#FDFBF7" }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.navy} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>Proposta Recebida</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 180 }} showsVerticalScrollIndicator={false}>
        {/* Service Context Header */}
        <View style={styles.serviceHeaderCard}>
          <View style={[styles.statusBadge, { backgroundColor: colors.orange + "20" }]}>
            <MaterialCommunityIcons name="lightning-bolt" size={12} color={colors.orange} />
            <Text style={[styles.statusText, { color: colors.orange, fontFamily: "Inter_700Bold" }]}>Serviço Postado</Text>
          </View>
          <Text style={[styles.serviceTitle, { color: colors.navy, fontFamily: "Inter_800ExtraBold" }]}>{job.title}</Text>
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker" size={14} color={colors.mutedForeground} />
            <Text style={[styles.location, { color: colors.mutedForeground }]}>{job.location || "Local não informado"}</Text>
          </View>
          <View style={styles.divider} />
          <Text style={[styles.serviceDesc, { color: colors.mutedForeground }]}>{job.description}</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient colors={[colors.navy + "10", "transparent"]} style={styles.gradientBg} />
          <View style={styles.profileContent}>
            <View style={styles.avatarWrapper}>
              {provider.avatarUrl ? (
                <Image source={{ uri: provider.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.navy + "10", alignItems: "center", justifyContent: "center" }]}>
                   <MaterialCommunityIcons name="account" size={40} color={colors.navy} />
                </View>
              )}
              <View style={[styles.verifiedBadge, { backgroundColor: colors.secondary }]}>
                <MaterialCommunityIcons name="check-decagram" size={14} color="#fff" />
              </View>
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: colors.navy, fontFamily: "Inter_700Bold" }]} numberOfLines={2}>{provider.name}</Text>
                <View style={[styles.ratingChip, { backgroundColor: "#FFDD7E" }]}>
                  <MaterialCommunityIcons name="star" size={12} color="#B45309" />
                  <Text style={[styles.ratingText, { fontFamily: "Inter_700Bold" }]}>{provider.rating || "5.0"}</Text>
                  <Text style={styles.ratingCount}>({provider.reviewCount || 0})</Text>
                </View>
              </View>
              <Text style={[styles.role, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Prestador de {job.category?.name}</Text>
              <View style={styles.badgesRow}>
                <View style={[styles.metaBadge, { backgroundColor: "#f1f5f9" }]}>
                  <MaterialCommunityIcons name="briefcase-outline" size={14} color={colors.mutedForeground} />
                  <Text style={styles.metaBadgeText}>Profissional</Text>
                </View>
                <View style={[styles.metaBadge, { backgroundColor: "#f1f5f9" }]}>
                  <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.mutedForeground} />
                  <Text style={styles.metaBadgeText}>{provider.city || "São Paulo"}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Bio Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-outline" size={20} color={colors.secondary} />
            <Text style={[styles.sectionTitle, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>Sobre o Profissional</Text>
          </View>
          <Text style={[styles.bio, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {provider.providerBio || "Este profissional ainda não preencheu sua biografia, mas está pronto para realizar seu serviço com qualidade e compromisso."}
          </Text>
        </View>

        {/* Portfolio Section */}
        {provider.portfolioImages && provider.portfolioImages.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="image-multiple-outline" size={20} color={colors.secondary} />
              <Text style={[styles.sectionTitle, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>Trabalhos Anteriores</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.portfolioGrid}>
              {provider.portfolioImages.map((img: any, i: number) => (
                <Image key={i} source={{ uri: img.url || img }} style={styles.portfolioImg} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Reviews Section */}
        {job.clientReviews && job.clientReviews.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="star" size={20} color="#F69926" />
              <Text style={[styles.sectionTitle, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>Avaliações ({job.clientReviews.length})</Text>
            </View>
            
            {job.clientReviews.map((review: any, i: number) => (
              <View key={i} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <View style={[styles.reviewAvatar, { backgroundColor: "#f1f5f9", overflow: 'hidden' }]}>
                    {review.fromUserAvatarUrl ? (
                      <Image source={{ uri: review.fromUserAvatarUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <Text style={styles.reviewAvatarText}>{review.fromUserName?.[0] || "U"}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reviewName, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>{review.fromUserName || "Usuário"}</Text>
                    <View style={styles.starsRow}>
                      {[1,2,3,4,5].map(s => <MaterialCommunityIcons key={s} name="star" size={12} color={s <= review.rating ? "#F69926" : "#e2e8f0"} />)}
                    </View>
                  </View>
                </View>
                <Text style={styles.reviewBody}>{review.comment}</Text>
                {i < job.clientReviews.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Bar */}
      <View style={[styles.bottomCard, { paddingBottom: insets.bottom + 15 }]}>
        {job.status === "exclusive_pending" ? (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.rejectBtn, { borderColor: "#ef4444" }]} 
              onPress={() => handleRespond("REJECT")}
            >
              <Text style={[styles.rejectBtnText, { color: "#ef4444", fontFamily: "Inter_700Bold" }]}>Recusar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.acceptBtn, { backgroundColor: "#F69926" }]} 
              onPress={() => handleRespond("ACCEPT")}
            >
              <MaterialCommunityIcons name="check" size={22} color={colors.navy} />
              <Text style={[styles.acceptBtnText, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>Aceitar Proposta</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.unlockedActions}>
            <View style={styles.budgetInfo}>
              <View>
                <Text style={styles.budgetLabel}>Valor Estimado</Text>
                <Text style={[styles.budgetValue, { color: "#F69926" }]}>{provider.budget ? provider.budget : "A combinar"}</Text>
              </View>
              <View style={styles.availability}>
                <MaterialCommunityIcons name="calendar-check-outline" size={16} color={colors.mutedForeground} />
                <Text style={styles.availabilityText}>{provider.availability || "Imediato"}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity 
                style={[styles.rejectBtn, { flex: 1, borderColor: "#ef4444" }]} 
                onPress={handleRejectLead}
              >
                <Text style={[styles.rejectBtnText, { color: "#ef4444", fontFamily: "Inter_700Bold", fontSize: 14 }]}>Recusar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.whatsappBtn, { flex: 2, backgroundColor: "#25D366" }]} onPress={handleOpenWhatsApp}>
                <MaterialCommunityIcons name="whatsapp" size={20} color="#fff" />
                <Text style={[styles.whatsappBtnText, { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 14 }]}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    height: 100,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: "#00000008",
  },
  backBtn: { padding: 5, marginRight: 10 },
  headerTitle: { fontSize: 18 },
  serviceHeaderCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#00000008",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: "flex-start", marginBottom: 12 },
  statusText: { fontSize: 11 },
  serviceTitle: { fontSize: 22, letterSpacing: -0.5, marginBottom: 8 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 15 },
  location: { fontSize: 13 },
  serviceDesc: { fontSize: 14, lineHeight: 20 },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 15 },
  profileCard: {
    margin: 20,
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  gradientBg: { ...StyleSheet.absoluteFillObject },
  profileContent: { padding: 20, alignItems: "center" },
  avatarWrapper: { position: "relative", marginBottom: 15 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: "#fff" },
  verifiedBadge: { position: "absolute", bottom: 2, right: 2, width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  profileInfo: { alignItems: "center" },
  nameRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center",
    gap: 8, 
    marginBottom: 4,
    paddingHorizontal: 10,
  },
  name: { 
    fontSize: 22, 
    textAlign: "center",
    maxWidth: "80%",
  },
  ratingChip: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  ratingText: { fontSize: 13, color: "#B45309" },
  ratingCount: { fontSize: 11, color: "#B45309", opacity: 0.7 },
  role: { fontSize: 15, marginBottom: 15, textAlign: "center" },
  badgesRow: { flexDirection: "row", gap: 10 },
  metaBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  metaBadgeText: { fontSize: 12, color: "#64748b", fontWeight: "600" },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 5,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 15 },
  sectionTitle: { fontSize: 16 },
  bio: { fontSize: 14, lineHeight: 22 },
  portfolioGrid: { flexDirection: "row", gap: 10, marginTop: 10 },
  portfolioImg: { width: 120, height: 120, borderRadius: 12, backgroundColor: "#f1f5f9", marginRight: 10 },
  reviewItem: { gap: 10 },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  reviewAvatarText: { fontSize: 14, fontWeight: "700", color: "#64748b" },
  reviewName: { fontSize: 14 },
  starsRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  reviewDate: { fontSize: 11, color: "#94a3b8", marginLeft: 4 },
  reviewBody: { fontSize: 13, color: "#64748b", lineHeight: 18 },
  bottomCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#21284E",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  budgetInfo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  budgetLabel: { color: "#ffffff90", fontSize: 12, marginBottom: 2 },
  budgetValue: { fontSize: 28, fontWeight: "800" },
  availability: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#ffffff10", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  availabilityText: { color: "#fff", fontSize: 13 },
  whatsappBtn: { flexDirection: "row", height: 56, alignItems: "center", justifyContent: "center", borderRadius: 15, gap: 10 },
  whatsappBtnText: { fontSize: 16 },
  actionButtons: { flexDirection: "row", gap: 12 },
  rejectBtn: { flex: 1, height: 56, alignItems: "center", justifyContent: "center", borderRadius: 15, borderWidth: 2 },
  rejectBtnText: { fontSize: 16 },
  acceptBtn: { flex: 2, flexDirection: "row", height: 56, alignItems: "center", justifyContent: "center", borderRadius: 15, gap: 8 },
  acceptBtnText: { fontSize: 16 },
  unlockedActions: { gap: 15 },
});
