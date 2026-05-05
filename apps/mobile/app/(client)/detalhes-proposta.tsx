import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function DetalhesProposta() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id, providerId } = useLocalSearchParams();
  const { user, fetchJobById } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [job, setJob] = React.useState<any>(null);
  const [selectedLead, setSelectedLead] = React.useState<any>(null);

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

  const handleOpenWhatsApp = () => {
    if (!selectedLead?.provider?.phone) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const phone = selectedLead.provider.phone.replace(/\D/g, "");
    const url = `whatsapp://send?phone=55${phone}&text=Olá ${selectedLead.provider.name}, vi sua proposta no Trampaí para o serviço de "${job.title}"!`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(`https://wa.me/55${phone}`);
      }
    });
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

      <ScrollView contentContainerStyle={{ paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
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
                <Text style={[styles.name, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>{provider.name}</Text>
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
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="image-multiple-outline" size={20} color={colors.secondary} />
            <Text style={[styles.sectionTitle, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>Trabalhos Anteriores</Text>
          </View>
          <View style={styles.portfolioGrid}>
            {[1, 2, 3].map((img: number, i: number) => (
              <View key={i} style={styles.portfolioImg} />
            ))}
          </View>
        </View>

        {/* Reviews Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="star" size={20} color="#F69926" />
            <Text style={[styles.sectionTitle, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>Avaliações ({provider.reviewCount})</Text>
          </View>
          
          <View style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
              <View style={[styles.reviewAvatar, { backgroundColor: "#f1f5f9" }]}>
                <Text style={styles.reviewAvatarText}>M</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.reviewName, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>Maria Oliveira</Text>
                <View style={styles.starsRow}>
                  {[1,2,3,4,5].map(s => <MaterialCommunityIcons key={s} name="star" size={12} color="#F69926" />)}
                  <Text style={styles.reviewDate}>Há 2 dias</Text>
                </View>
              </View>
            </View>
            <Text style={styles.reviewBody}>Excelente profissional, muito caprichoso. Deixou a casa limpa após terminar a pintura.</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
              <View style={[styles.reviewAvatar, { backgroundColor: "#f1f5f9" }]}>
                <Text style={styles.reviewAvatarText}>C</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.reviewName, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>Carlos Souza</Text>
                <View style={styles.starsRow}>
                  {[1,2,3,4,5].map(s => <MaterialCommunityIcons key={s} name="star" size={12} color="#F69926" />)}
                  <Text style={styles.reviewDate}>Há 1 semana</Text>
                </View>
              </View>
            </View>
            <Text style={styles.reviewBody}>Chegou no horário e resolveu o problema rápido. Preço justo e trabalho de primeira.</Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Bar */}
      <View style={[styles.bottomCard, { paddingBottom: insets.bottom + 15 }]}>
        <View style={styles.budgetInfo}>
          <View>
            <Text style={styles.budgetLabel}>Valor Estimado</Text>
            <Text style={[styles.budgetValue, { color: "#B45309" }]}>{provider.budget}</Text>
          </View>
          <View style={styles.availability}>
            <MaterialCommunityIcons name="calendar-check-outline" size={16} color={colors.mutedForeground} />
            <Text style={styles.availabilityText}>{provider.availability}</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.whatsappBtn, { backgroundColor: "#F69926" }]} onPress={handleOpenWhatsApp}>
          <MaterialCommunityIcons name="whatsapp" size={22} color={colors.navy} />
          <Text style={[styles.whatsappBtnText, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>Abrir WhatsApp</Text>
        </TouchableOpacity>
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
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  name: { fontSize: 22 },
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
  portfolioGrid: { flexDirection: "row", gap: 10 },
  portfolioImg: { flex: 1, aspectRatio: 1, borderRadius: 12, backgroundColor: "#f1f5f9" },
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
});
