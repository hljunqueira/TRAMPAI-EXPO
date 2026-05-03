import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ServiceCard } from "@/components/ServiceCard";
import { SUGGESTED_CATEGORIES, UNLOCK_COSTS } from "@/constants/categories";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import type { Service, UnlockType } from "@/types";

export default function Mural() {
  const colors = useColors();
  const { user, services, unlockService, leads } = useAuth();
  const insets = useSafeAreaInsets();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockResult, setUnlockResult] = useState<{ whatsappLink: string } | null>(null);
  const [unlockError, setUnlockError] = useState("");

  const isVerified = user?.verificationStatus === "APPROVED" || user?.role === "ADMIN";

  const visibleServices = services
    .filter((s) => {
      if (s.clientId === user?.id) return false;
      if (s.status === "CLOSED" || s.status === "EXPIRED") return false;
      if (s.status === "LOCKED") {
        if (!s.lockedUntil) return false;
        if (new Date(s.lockedUntil) > new Date()) return false;
      }
      if (selectedCategories.length > 0 && !selectedCategories.includes(s.category)) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const myLeadServiceIds = leads.filter((l) => l.providerId === user?.id).map((l) => l.serviceId);

  function toggleCategory(cat: string) {
    Haptics.selectionAsync();
    setSelectedCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  }

  function openUnlockModal(service: Service) {
    if (!isVerified) {
      setUnlockError("Você precisa ter sua conta verificada para desbloquear leads.");
      return;
    }
    setSelectedService(service);
    setUnlockResult(null);
    setUnlockError("");
  }

  async function handleUnlock(type: UnlockType) {
    if (!selectedService) return;
    setUnlocking(true);
    setUnlockError("");
    try {
      const result = await unlockService(selectedService.id, type);
      if ("error" in result) {
        setUnlockError(result.error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setUnlockResult(result);
      }
    } finally {
      setUnlocking(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.navy, paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTextBlock}>
            <Text style={[styles.headerTitle, { fontFamily: "Inter_700Bold" }]}>Mural de serviços</Text>
            <Text style={[styles.headerSub, { fontFamily: "Inter_400Regular" }]}>{visibleServices.length} disponíveis</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.creditBadge, { backgroundColor: colors.accent }]}>
              <MaterialCommunityIcons name="star-circle" size={14} color="#fff" />
              <Text style={[styles.creditText, { fontFamily: "Inter_700Bold" }]}>{user?.creditBalance ?? 0}</Text>
            </View>
            <TouchableOpacity style={[styles.filterBtn, { backgroundColor: "#ffffff20" }]} onPress={() => setShowFilters(!showFilters)}>
              <MaterialCommunityIcons name="filter-outline" size={20} color="#fff" />
              {selectedCategories.length > 0 && (
                <View style={[styles.filterBadge, { backgroundColor: colors.accent }]}>
                  <Text style={styles.filterBadgeText}>{selectedCategories.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {showFilters && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll} contentContainerStyle={styles.categoriesContent}>
            {SUGGESTED_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, { backgroundColor: selectedCategories.includes(cat) ? colors.accent : "#ffffff20", borderRadius: 16 }]}
                onPress={() => toggleCategory(cat)}
              >
                <Text style={[styles.categoryChipText, { color: "#fff", fontFamily: selectedCategories.includes(cat) ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {!isVerified && (
        <TouchableOpacity style={[styles.verificationBanner, { backgroundColor: colors.accent + "15", borderColor: colors.accent + "40" }]} onPress={() => router.push("/(provider)/perfil")}>
          <MaterialCommunityIcons name="shield-alert-outline" size={18} color={colors.accent} />
          <Text style={[styles.verificationText, { color: colors.navy, fontFamily: "Inter_400Regular" }]}>Verifique sua conta para desbloquear leads. <Text style={{ fontFamily: "Inter_600SemiBold", color: colors.accent }}>Saiba mais</Text></Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={visibleServices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!visibleServices.length}
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
            <MaterialCommunityIcons name="inbox-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Nenhum serviço disponível</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {selectedCategories.length > 0 ? "Tente remover os filtros de categoria." : "Novos serviços aparecerão aqui quando clientes postarem."}
            </Text>
            {selectedCategories.length > 0 && (
              <TouchableOpacity onPress={() => setSelectedCategories([])}>
                <Text style={[styles.clearFilters, { color: colors.accent, fontFamily: "Inter_500Medium" }]}>Limpar filtros</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => <ServiceCard service={item} showUnlock alreadyUnlocked={myLeadServiceIds.includes(item.id)} onUnlock={() => openUnlockModal(item)} />}
      />

      <Modal visible={!!selectedService} animationType="slide" transparent onRequestClose={() => setSelectedService(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => { if (!unlocking) setSelectedService(null); }} />
        {selectedService && (
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderRadius: colors.radius * 2 }]}>
            <View style={styles.modalHandle} />
            {!unlockResult ? (
              <>
                <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Desbloquear lead</Text>
                <Text style={[styles.modalServiceTitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{selectedService.title}</Text>

                {unlockError ? (
                  <View style={[styles.errorBox, { backgroundColor: "#ef444415", borderRadius: colors.radius }]}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#ef4444" />
                    <Text style={[styles.errorText, { fontFamily: "Inter_400Regular" }]}>{unlockError}</Text>
                  </View>
                ) : null}

                <View style={styles.unlockOptions}>
                  <TouchableOpacity style={[styles.unlockOption, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: colors.radius }]} onPress={() => handleUnlock("NORMAL")} disabled={unlocking} activeOpacity={0.8}>
                    <View style={styles.unlockOptionHeader}>
                      <MaterialCommunityIcons name="lock-open-outline" size={24} color={colors.navy} />
                      <View>
                        <Text style={[styles.unlockOptionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Normal</Text>
                        <Text style={[styles.unlockOptionCredits, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>{UNLOCK_COSTS.NORMAL} crédito</Text>
                      </View>
                    </View>
                    <Text style={[styles.unlockOptionDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Acesse o WhatsApp do cliente. O serviço continua visível para outros.</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.unlockOption, { backgroundColor: colors.navy, borderColor: colors.accent, borderRadius: colors.radius, borderWidth: 1.5 }]} onPress={() => handleUnlock("EXCLUSIVE")} disabled={unlocking} activeOpacity={0.8}>
                    <View style={styles.unlockOptionHeader}>
                      <MaterialCommunityIcons name="crown-outline" size={24} color={colors.accent} />
                      <View>
                        <Text style={[styles.unlockOptionTitle, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>Exclusivo</Text>
                        <Text style={[styles.unlockOptionCredits, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>{UNLOCK_COSTS.EXCLUSIVE} créditos</Text>
                      </View>
                    </View>
                    <Text style={[styles.unlockOptionDesc, { color: "#ffffff80", fontFamily: "Inter_400Regular" }]}>Remove o serviço do mural por 24h. Contato exclusivo.</Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.balanceInfo, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Seu saldo: <Text style={{ fontFamily: "Inter_700Bold", color: colors.foreground }}>{user?.creditBalance ?? 0}</Text> créditos</Text>

                <TouchableOpacity onPress={() => setSelectedService(null)} style={styles.cancelBtn}>
                  <Text style={[styles.cancelBtnText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Cancelar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.successContent}>
                <View style={[styles.successIcon, { backgroundColor: "#22c55e15" }]}>
                  <MaterialCommunityIcons name="check-circle" size={56} color="#22c55e" />
                </View>
                <Text style={[styles.successTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Lead desbloqueado!</Text>
                <Text style={[styles.successDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Você tem o contato do cliente. Envie uma mensagem agora.</Text>
                <TouchableOpacity style={[styles.whatsappBtn, { backgroundColor: "#25D366", borderRadius: colors.radius }]} onPress={() => { Linking.openURL(unlockResult.whatsappLink); setSelectedService(null); }} activeOpacity={0.85}>
                  <MaterialCommunityIcons name="whatsapp" size={22} color="#fff" />
                  <Text style={[styles.whatsappBtnText, { fontFamily: "Inter_700Bold" }]}>Abrir WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSelectedService(null)} style={styles.cancelBtn}>
                  <Text style={[styles.cancelBtnText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Fechar</Text>
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
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerTextBlock: { flex: 1, paddingRight: 12 },
  headerTitle: { color: "#fff", fontSize: 22 },
  headerSub: { color: "#ffffff80", fontSize: 13, marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  creditBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, gap: 4 },
  creditText: { color: "#fff", fontSize: 13 },
  filterBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  filterBadge: { position: "absolute", top: 0, right: 0, width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  filterBadgeText: { color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold" },
  categoriesScroll: { marginTop: 12 },
  categoriesContent: { gap: 8, paddingRight: 4 },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 6 },
  categoryChipText: { fontSize: 12 },
  verificationBanner: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, gap: 8, borderBottomWidth: 1 },
  verificationText: { flex: 1, fontSize: 13, lineHeight: 18 },
  list: { padding: 16 },
  empty: { alignItems: "center", padding: 40, gap: 12, margin: 16 },
  emptyTitle: { fontSize: 17, textAlign: "center" },
  emptyDesc: { fontSize: 13, textAlign: "center", lineHeight: 18 },
  clearFilters: { fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "#00000060" },
  modalSheet: { padding: 24, paddingBottom: 40, gap: 12 },
  modalHandle: { width: 36, height: 4, backgroundColor: "#D8D0B5", borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  modalTitle: { fontSize: 20 },
  modalServiceTitle: { fontSize: 13, marginTop: -4, marginBottom: 4 },
  errorBox: { flexDirection: "row", padding: 12, gap: 8 },
  errorText: { color: "#ef4444", fontSize: 13, flex: 1 },
  unlockOptions: { gap: 12 },
  unlockOption: { padding: 16, borderWidth: 1, gap: 10 },
  unlockOptionHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  unlockOptionTitle: { fontSize: 15 },
  unlockOptionCredits: { fontSize: 18 },
  unlockOptionDesc: { fontSize: 13, lineHeight: 18 },
  balanceInfo: { fontSize: 13, textAlign: "center" },
  cancelBtn: { alignItems: "center", paddingVertical: 8 },
  cancelBtnText: { fontSize: 14 },
  successContent: { alignItems: "center", gap: 12 },
  successIcon: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 22, textAlign: "center" },
  successDesc: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  whatsappBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 32, gap: 8, marginTop: 4 },
  whatsappBtnText: { color: "#fff", fontSize: 16 },
});