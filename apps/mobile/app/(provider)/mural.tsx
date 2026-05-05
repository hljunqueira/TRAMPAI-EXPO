import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState, useMemo } from "react";
import {
  FlatList,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ServiceCard } from "@/components/ServiceCard";
import { SUGGESTED_CATEGORIES, UNLOCK_COSTS } from "@/constants/categories";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useListJobs } from "@workspace/api-client-react";
import type { UnlockType } from "@/types";
import type { Job } from "@workspace/api-client-react";

export default function Mural() {
  const colors = useColors();
  const { user, unlockService, leads, activeMode, switchActiveMode } = useAuth();
  const insets = useSafeAreaInsets();

  const { data: jobs, isLoading, refetch } = useListJobs();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedService, setSelectedService] = useState<Job | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockResult, setUnlockResult] = useState<{ whatsappLink: string } | null>(null);
  const [unlockError, setUnlockError] = useState("");

  const isVerified = user?.verificationStatus === "APPROVED" || user?.role === "admin";

  const visibleJobs = useMemo(() => {
    if (!jobs) return [];
    return jobs.filter((job) => {
      if (job.clientId === user?.id) return false;
      if (selectedCategories.length > 0) {
        const catName = (job as any).category?.name;
        if (!catName || !selectedCategories.includes(catName)) return false;
      }
      return true;
    });
  }, [jobs, selectedCategories, user?.id]);

  const myLeadServiceIds = leads.map((l) => l.jobId);

  function toggleCategory(cat: string) {
    Haptics.selectionAsync();
    setSelectedCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  }

  function openUnlockModal(job: Job) {
    if (!isVerified) {
      setUnlockError("Você precisa ter sua conta verificada para desbloquear leads.");
    }
    setSelectedService(job);
    setUnlockResult(null);
    setUnlockError("");
  }

  async function handleUnlock(type: UnlockType) {
    if (!selectedService) return;
    setUnlocking(true);
    setUnlockError("");
    try {
      const result = await unlockService(selectedService.id, type);
      if (result && "error" in result) {
        setUnlockError(result.error);
      } else if (result) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setUnlockResult(result);
      }
    } finally {
      setUnlocking(false);
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
          {user?.role === "admin" && (
            <TouchableOpacity 
              style={styles.iconBtn}
              onPress={() => {
                switchActiveMode("ADMIN");
                router.replace("/(admin)");
              }}
            >
              <MaterialCommunityIcons name="swap-horizontal" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.iconBtn}>
            <MaterialCommunityIcons name="bell-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.initialsAvatar, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(provider)/perfil")}
          >
            <Text style={[styles.initialsText, { color: "#FFF", fontFamily: "Inter_700Bold" }]}>
              {getInitials(user?.name)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={visibleJobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
        ListHeaderComponent={
          <View style={styles.pageHeader}>
            <View style={styles.titleSection}>
              <Text style={[styles.pageTitle, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>Mural de Serviços</Text>
              <Text style={[styles.pageSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Encontre oportunidades perto de você.</Text>
            </View>

            <View style={[styles.filterCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.filterRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.filterLabel, { color: colors.navy, fontFamily: "Inter_600SemiBold" }]}>Categorias</Text>
                  <TouchableOpacity 
                    style={[styles.categorySelect, { borderColor: colors.border }]}
                    onPress={() => setShowFilters(!showFilters)}
                  >
                    <Text style={[styles.categoryValue, { color: colors.foreground }]}>
                      {selectedCategories.length === 0 ? "Todas as Categorias" : `${selectedCategories.length} selecionadas`}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              </View>

              {showFilters && (
                <View style={styles.categoriesGrid}>
                  {SUGGESTED_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryChip, { backgroundColor: selectedCategories.includes(cat) ? colors.accent : colors.navy + "08" }]}
                      onPress={() => toggleCategory(cat)}
                    >
                      <Text style={[styles.categoryChipText, { color: selectedCategories.includes(cat) ? "#fff" : colors.navy }]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={[styles.empty, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
              <MaterialCommunityIcons name="inbox-outline" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Nenhum serviço disponível</Text>
              <Text style={[styles.emptyDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Tente ajustar os filtros ou aguarde novas publicações.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <ServiceCard 
            service={item} 
            showUnlock 
            alreadyUnlocked={myLeadServiceIds.includes(item.id)} 
            onUnlock={() => openUnlockModal(item)} 
          />
        )}
      />

      {/* Unlock Modal (Same logic, slightly updated style) */}
      <Modal visible={!!selectedService} animationType="slide" transparent onRequestClose={() => setSelectedService(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => { if (!unlocking) setSelectedService(null); }} />
        {selectedService && (
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderTopLeftRadius: 30, borderTopRightRadius: 30 }]}>
            <View style={styles.modalHandle} />
            {!unlockResult ? (
              <View style={styles.modalScroll}>
                <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Desbloquear lead</Text>
                <Text style={[styles.modalServiceTitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{selectedService.title}</Text>

                {unlockError ? (
                  <View style={[styles.errorBox, { backgroundColor: "#ef444415", borderRadius: 12 }]}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#ef4444" />
                    <Text style={[styles.errorText, { fontFamily: "Inter_400Regular" }]}>{unlockError}</Text>
                  </View>
                ) : null}

                <View style={styles.unlockOptions}>
                  <TouchableOpacity style={[styles.unlockOption, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 16 }]} onPress={() => handleUnlock("NORMAL")} disabled={unlocking} activeOpacity={0.8}>
                    <View style={styles.unlockOptionHeader}>
                      <MaterialCommunityIcons name="lock-open-outline" size={24} color={colors.navy} />
                      <View>
                        <Text style={[styles.unlockOptionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Acesso Normal</Text>
                        <Text style={[styles.unlockOptionCredits, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>{UNLOCK_COSTS.NORMAL} crédito</Text>
                      </View>
                    </View>
                    <Text style={[styles.unlockOptionDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Veja o WhatsApp do cliente. Outros profissionais também podem ver.</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.unlockOption, { backgroundColor: colors.navy, borderColor: colors.accent, borderRadius: 16, borderWidth: 1.5 }]} onPress={() => handleUnlock("EXCLUSIVE")} disabled={unlocking} activeOpacity={0.8}>
                    <View style={styles.unlockOptionHeader}>
                      <MaterialCommunityIcons name="crown-outline" size={24} color={colors.accent} />
                      <View>
                        <Text style={[styles.unlockOptionTitle, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>Exclusivo (24h)</Text>
                        <Text style={[styles.unlockOptionCredits, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>{UNLOCK_COSTS.EXCLUSIVE} créditos</Text>
                      </View>
                    </View>
                    <Text style={[styles.unlockOptionDesc, { color: "#ffffff80", fontFamily: "Inter_400Regular" }]}>O serviço sai do mural por 24h só pra você. Contato garantido.</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.balanceSection}>
                  <Text style={[styles.balanceInfo, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Seu saldo: <Text style={{ fontFamily: "Inter_700Bold", color: colors.foreground }}>{user?.creditBalance ?? 0}</Text> créditos</Text>
                </View>

                <TouchableOpacity onPress={() => setSelectedService(null)} style={styles.cancelBtn}>
                  <Text style={[styles.cancelBtnText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Voltar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.successContent}>
                <View style={[styles.successIcon, { backgroundColor: "#22c55e15" }]}>
                  <MaterialCommunityIcons name="check-circle" size={64} color="#22c55e" />
                </View>
                <Text style={[styles.successTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Tudo pronto!</Text>
                <Text style={[styles.successDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>O contato do cliente já está liberado pra você.</Text>
                <TouchableOpacity style={[styles.whatsappBtn, { backgroundColor: "#25D366", borderRadius: 16 }]} onPress={() => { Linking.openURL(unlockResult.whatsappLink); setSelectedService(null); }} activeOpacity={0.85}>
                  <MaterialCommunityIcons name="whatsapp" size={24} color="#fff" />
                  <Text style={[styles.whatsappBtnText, { fontFamily: "Inter_700Bold" }]}>Enviar Mensagem</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSelectedService(null)} style={styles.cancelBtn}>
                  <Text style={[styles.cancelBtnText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Fechar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </Modal>
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
  initialsAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: {
    fontSize: 14,
  },
  list: { padding: 20 },
  pageHeader: { marginBottom: 24 },
  titleSection: { marginBottom: 20 },
  pageTitle: { fontSize: 28 },
  pageSub: { fontSize: 15, marginTop: 4 },
  filterCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    shadowColor: "#0b1339",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  filterRow: { gap: 10 },
  filterLabel: { fontSize: 14, marginBottom: 8 },
  categorySelect: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderWidth: 1.5,
    borderRadius: 12,
  },
  categoryValue: { fontSize: 15 },
  categoriesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 100 },
  categoryChipText: { fontSize: 13 },
  empty: { alignItems: "center", padding: 48, gap: 16, marginTop: 20 },
  emptyTitle: { fontSize: 20, textAlign: "center" },
  emptyDesc: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  modalOverlay: { flex: 1, backgroundColor: "#0b133980" },
  modalSheet: { padding: 24, paddingBottom: 60 },
  modalHandle: { width: 40, height: 4, backgroundColor: "#E5E7EB", borderRadius: 10, alignSelf: "center", marginBottom: 24 },
  modalScroll: { gap: 20 },
  modalTitle: { fontSize: 26, textAlign: "center" },
  modalServiceTitle: { fontSize: 16, textAlign: "center", marginTop: -12, marginBottom: 4 },
  errorBox: { flexDirection: "row", padding: 16, gap: 12, alignItems: "center" },
  errorText: { color: "#ef4444", fontSize: 14, flex: 1 },
  unlockOptions: { gap: 16 },
  unlockOption: { padding: 24, borderWidth: 1.5, gap: 14 },
  unlockOptionHeader: { flexDirection: "row", alignItems: "center", gap: 16 },
  unlockOptionTitle: { fontSize: 18 },
  unlockOptionCredits: { fontSize: 22 },
  unlockOptionDesc: { fontSize: 14, lineHeight: 22 },
  balanceSection: { alignItems: "center", marginTop: 8 },
  balanceInfo: { fontSize: 16 },
  cancelBtn: { alignItems: "center", paddingVertical: 16 },
  cancelBtnText: { fontSize: 16 },
  successContent: { alignItems: "center", gap: 20, paddingVertical: 24 },
  successIcon: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 28, textAlign: "center" },
  successDesc: { fontSize: 16, textAlign: "center", lineHeight: 24 },
  whatsappBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 18, paddingHorizontal: 48, gap: 10, marginTop: 12 },
  whatsappBtnText: { color: "#fff", fontSize: 18 },
});
