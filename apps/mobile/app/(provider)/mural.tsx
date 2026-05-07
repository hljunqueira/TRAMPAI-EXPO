import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import React, { useState, useMemo, useEffect, useCallback } from "react";
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
  Share,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ServiceCard } from "@/components/ServiceCard";
import { SUGGESTED_CATEGORIES } from "@/constants/categories";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import type { UnlockType } from "@/types";
import type { Job } from "@workspace/api-client-react";

export default function Mural() {
  const colors = useColors();
  const { user, unlockService, leads, activeMode, switchActiveMode, api, appConfig } = useAuth();
  const insets = useSafeAreaInsets();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedService, setSelectedService] = useState<Job | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockResult, setUnlockResult] = useState<any | null>(null);
  const [unlockError, setUnlockError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [distance, setDistance] = useState<number>(50);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = "/jobs";
      const queryParams = [];
      
      if (userLocation) {
        queryParams.push(`lat=${userLocation.lat}`);
        queryParams.push(`lng=${userLocation.lng}`);
        queryParams.push(`radius=${distance}`);
      }

      if (queryParams.length > 0) {
        url += `?${queryParams.join("&")}`;
      }

      const response = await api.get(url);
      setJobs(response?.data || []);
    } catch (e) {
      console.error("Error fetching jobs:", e);
    } finally {
      setIsLoading(false);
    }
  }, [api, userLocation, distance]);

  useFocusEffect(
    useCallback(() => {
      checkNotifications();
      requestLocation();
      fetchJobs();
    }, [fetchJobs])
  );

  async function requestLocation() {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude
      });
    } catch (e) {
      console.warn("Error getting location:", e);
    } finally {
      setLoadingLocation(false);
    }
  }

  // Recarregar quando a distância ou localização mudar
  useEffect(() => {
    if (userLocation) {
      fetchJobs();
    }
  }, [distance, userLocation, fetchJobs]);

  async function shareReferral() {
    try {
      const code = user?.referralCode || "TRAMPAI26";
      const bonus = appConfig?.REFERRAL_BONUS || "10";
      const message = `Ei! Use meu código ${code} no Trampaí para ganhar ${bonus} créditos de bônus e encontrar os melhores profissionais ou serviços! 🚀\n\nBaixe agora: https://trampai.com.br`;
      
      const result = await Share.share({
        message,
        title: "Convite Trampaí",
      });

      if (result.action === Share.sharedAction) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function checkNotifications() {
    try {
      const response = await api.get("/notifications");
      const notifications = response?.data || [];
      setUnreadCount(notifications.filter((n: any) => !n.read).length);
    } catch (e) {}
  }

  const isVerified = user?.verificationStatus === "APPROVED" || user?.role === "admin";

  const visibleJobs = useMemo(() => {
    if (!jobs || !Array.isArray(jobs)) return [];
    return jobs.filter((job) => {
      if (job.clientId === user?.id) return false;
      if (selectedCategories.length > 0) {
        const catName = (job as any).category?.name;
        if (!catName || !selectedCategories.includes(catName)) return false;
      }
      return true;
    });
  }, [jobs, selectedCategories, user?.id]);

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

  function handleSeeDetails(job: Job) {
    const lead = leads.find((l) => l.jobId === job.id);
    if (lead) {
      setSelectedService(job);
      setUnlockResult({
        job: { ...job, client: { ...job.client, phone: lead.clientPhone, name: lead.clientName } },
        whatsappLink: lead.whatsappLink
      });
      setUnlockError("");
    }
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
        fetchJobs(); // Atualiza a lista após desbloqueio
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
      <View style={[styles.header, { 
        paddingTop: insets.top + (Platform.OS === "web" ? 20 : 10), 
        borderBottomWidth: 1, 
        borderBottomColor: colors.border + "30", 
        backgroundColor: colors.background 
      }]}>
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
          <TouchableOpacity 
            style={styles.iconBtn}
            onPress={() => router.push("/notificacoes")}
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color={colors.primary} />
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.accent, borderColor: colors.card }]} />
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.initialsAvatar, { backgroundColor: colors.primary, overflow: 'hidden' }]}
            onPress={() => router.push("/(provider)/perfil")}
          >
            {user?.avatarUrl ? (
              <Image 
                source={{ uri: user.avatarUrl }} 
                style={{ width: '100%', height: '100%' }} 
                resizeMode="cover"
              />
            ) : (
              <Text style={[styles.initialsText, { color: colors.card, fontFamily: "Inter_700Bold" }]}>
                {getInitials(user?.name)}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {!isVerified && (
        <TouchableOpacity 
          style={[styles.verificationBanner, { backgroundColor: colors.secondary }]}
          onPress={() => router.push("/(provider)/perfil")}
        >
          <MaterialCommunityIcons name="shield-alert-outline" size={20} color={colors.card} />
          <Text style={[styles.verificationBannerText, { fontFamily: "Inter_600SemiBold", color: colors.card }]}>
            {user?.verificationStatus === 'PENDING' 
              ? "Documentos em análise. Aguarde a liberação." 
              : "Conta não verificada. Clique aqui para verificar."}
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.card} />
        </TouchableOpacity>
      )}

      {isVerified && (
        <TouchableOpacity 
          style={[styles.referralBanner, { backgroundColor: colors.navy }]}
          onPress={shareReferral}
          activeOpacity={0.9}
        >
          <View style={styles.referralContent}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.accent + '20', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="ticket-percent" size={24} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.referralTitle, { color: "#FFF", fontFamily: "Inter_700Bold" }]}>Indique e Ganhe! 🚀</Text>
              <Text style={[styles.referralSub, { color: "#ffffffCC", fontFamily: "Inter_500Medium" }]}>
                Ganhe {appConfig?.REFERRAL_BONUS || "10"} créditos por cada amigo que se cadastrar.
              </Text>
            </View>
            <MaterialCommunityIcons name="share-variant" size={20} color="#FFF" />
          </View>
        </TouchableOpacity>
      )}

      <FlatList
        data={visibleJobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchJobs} tintColor={colors.accent} />}
        ListHeaderComponent={
          <View style={styles.pageHeader}>
            <View style={styles.titleSection}>
              <Text style={[styles.pageTitle, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>Mural de Serviços</Text>
              <Text style={[styles.pageSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Encontre oportunidades perto de você.</Text>
            </View>

            <View style={[styles.filterCard, { backgroundColor: colors.card, borderColor: colors.border + "30" }]}>
              <View style={styles.filterRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={[styles.filterLabel, { color: colors.primary, fontFamily: "Inter_700Bold", marginBottom: 0 }]}>Raio de Distância</Text>
                  {loadingLocation && <ActivityIndicator size="small" color={colors.primary} />}
                  {userLocation && !loadingLocation && <MaterialCommunityIcons name="map-marker-check" size={16} color={colors.secondary} />}
                </View>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
                  {[5, 10, 20, 50, 100, 500].map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.distanceChip,
                        { 
                          backgroundColor: distance === d ? colors.primary : colors.surface,
                          borderColor: distance === d ? colors.primary : colors.border + "20"
                        }
                      ]}
                      onPress={() => {
                        setDistance(d);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={[
                        styles.distanceChipText,
                        { color: distance === d ? "#FFF" : colors.primary, fontFamily: "Inter_600SemiBold" }
                      ]}>{d >= 500 ? 'Brasil' : `${d}km`}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={[styles.filterLabel, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>O que você procura?</Text>
                <TouchableOpacity 
                  style={[styles.categorySelect, { borderColor: colors.border + "40", backgroundColor: colors.surface }]}
                  onPress={() => setShowFilters(!showFilters)}
                >
                  <Text style={[styles.categoryValue, { color: colors.primary }]}>
                    {selectedCategories.length === 0 
                      ? "Todas as Categorias" 
                      : `${selectedCategories.length} selecionada(s)`}
                  </Text>
                  <MaterialCommunityIcons name={showFilters ? "chevron-up" : "chevron-down"} size={20} color={colors.primary} />
                </TouchableOpacity>

                {showFilters && (
                  <View style={styles.categoriesGrid}>
                    {SUGGESTED_CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryChip,
                          { backgroundColor: selectedCategories.includes(cat) ? colors.primary : colors.surface }
                        ]}
                        onPress={() => toggleCategory(cat)}
                      >
                        <Text style={[
                          styles.categoryChipText,
                          { color: selectedCategories.includes(cat) ? colors.card : colors.primary, fontFamily: "Inter_600SemiBold" }
                        ]}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
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
          ) : (
            <View style={{ padding: 40, alignItems: 'center' }}>
               <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )
        }
        renderItem={({ item }) => {
          const lead = leads.find((l) => l.jobId === item.id);
          return (
            <ServiceCard 
              service={item} 
              showUnlock 
              alreadyUnlocked={!!lead}
              unlockType={lead?.type}
              onUnlock={() => openUnlockModal(item)} 
              onSeeDetails={() => handleSeeDetails(item)}
            />
          );
        }}
      />

      {/* Unlock Modal */}
      <Modal visible={!!selectedService} animationType="slide" transparent onRequestClose={() => setSelectedService(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => { if (!unlocking) setSelectedService(null); }} />
        {selectedService && (
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderTopLeftRadius: 32, borderTopRightRadius: 32 }]}>
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
                  {/* Nível 1: Normal */}
                  <TouchableOpacity 
                    style={[styles.unlockOption, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 16 }]} 
                    onPress={() => handleUnlock("NORMAL")} 
                    disabled={unlocking} 
                    activeOpacity={0.8}
                  >
                    <View style={styles.unlockOptionHeader}>
                      <MaterialCommunityIcons name="lock-open-outline" size={24} color={colors.navy} />
                      <View>
                        <Text style={[styles.unlockOptionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Básico</Text>
                        <Text style={[styles.unlockOptionCredits, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>{appConfig?.lead_normal_cost || 1} crédito</Text>
                      </View>
                    </View>
                    <Text style={[styles.unlockOptionDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      Libera apenas o WhatsApp do cliente. Risco de concorrência com outros prestadores.
                    </Text>
                  </TouchableOpacity>

                  {/* Nível 2: Plus */}
                  <TouchableOpacity 
                    style={[styles.unlockOption, { backgroundColor: colors.surface, borderColor: colors.secondary, borderRadius: 16, borderWidth: 1 }]} 
                    onPress={() => handleUnlock("PLUS")} 
                    disabled={unlocking} 
                    activeOpacity={0.8}
                  >
                    <View style={styles.unlockOptionHeader}>
                      <MaterialCommunityIcons name="shield-check-outline" size={24} color={colors.secondary} />
                      <View>
                        <Text style={[styles.unlockOptionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Plus (Anti-Furada)</Text>
                        <Text style={[styles.unlockOptionCredits, { color: colors.secondary, fontFamily: "Inter_700Bold" }]}>{appConfig?.lead_plus_cost || 3} créditos</Text>
                      </View>
                    </View>
                    <Text style={[styles.unlockOptionDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      WhatsApp + <Text style={{fontFamily: "Inter_700Bold"}}>Histórico do Cliente</Text>. Saiba se ele é confiável antes de investir.
                    </Text>
                  </TouchableOpacity>

                  {/* Nível 3: Exclusivo */}
                  <TouchableOpacity 
                    style={[styles.unlockOption, { backgroundColor: colors.navy, borderColor: colors.accent, borderRadius: 16, borderWidth: 2 }]} 
                    onPress={() => handleUnlock("EXCLUSIVE")} 
                    disabled={unlocking} 
                    activeOpacity={0.8}
                  >
                    <View style={styles.unlockOptionHeader}>
                      <MaterialCommunityIcons name="crown-outline" size={24} color={colors.accent} />
                      <View>
                        <Text style={[styles.unlockOptionTitle, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>Exclusivo (Garantido)</Text>
                        <Text style={[styles.unlockOptionCredits, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>{appConfig?.lead_exclusive_cost || 5} créditos</Text>
                      </View>
                    </View>
                    <Text style={[styles.unlockOptionDesc, { color: "#ffffff90", fontFamily: "Inter_400Regular" }]}>
                      Peça exclusividade ao cliente. Se ele não responder, seus créditos são estornados.
                    </Text>
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
                <View style={[styles.successIcon, { backgroundColor: unlockResult?.job?.status === 'exclusive_pending' ? colors.navy + "10" : "#22c55e15" }]}>
                  <MaterialCommunityIcons 
                    name={unlockResult?.job?.status === 'exclusive_pending' ? "timer-sand" : "check-circle"} 
                    size={64} 
                    color={unlockResult?.job?.status === 'exclusive_pending' ? colors.navy : "#22c55e"} 
                  />
                </View>
                <Text style={[styles.successTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                  {unlockResult?.job?.status === 'exclusive_pending' ? "Solicitado!" : "Tudo pronto!"}
                </Text>
                <Text style={[styles.successDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {unlockResult?.job?.status === 'exclusive_pending' 
                    ? "O cliente foi notificado. Se ele aceitar, o WhatsApp será liberado aqui." 
                    : "O contato do cliente já está liberado pra você."}
                </Text>

                {unlockResult?.job?.status !== 'exclusive_pending' && (
                  <TouchableOpacity 
                    style={[styles.whatsappBtn, { backgroundColor: "#25D366", borderRadius: 16 }]} 
                    onPress={() => { Linking.openURL(unlockResult.whatsappLink); setSelectedService(null); }} 
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons name="whatsapp" size={24} color="#fff" />
                    <Text style={[styles.whatsappBtnText, { fontFamily: "Inter_700Bold" }]}>Enviar Mensagem</Text>
                  </TouchableOpacity>
                )}
                
                {unlockResult?.job?.client && (
                  <View style={[styles.clientStats, { backgroundColor: colors.surface, borderRadius: 16 }]}>
                    <Text style={[styles.statsTitle, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>Histórico do Cliente</Text>
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.primary }]}>{unlockResult.job.client.jobsPostedCount}</Text>
                        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Pedidos</Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.secondary }]}>{unlockResult.job.client.jobsCompletedCount}</Text>
                        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Fechados</Text>
                      </View>
                    </View>
                  </View>
                )}

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
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 20,
    gap: 10,
  },
  verificationBannerText: {
    color: '#FFF',
    fontSize: 13,
    flex: 1,
  },
  referralBanner: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  referralContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  referralTitle: {
    fontSize: 15,
    marginBottom: 2,
  },
  referralSub: {
    fontSize: 11,
    lineHeight: 16,
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
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
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
  distanceChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, borderWidth: 1.5 },
  distanceChipText: { fontSize: 13 },
  modalOverlay: { flex: 1 },
  modalSheet: { padding: 24, paddingBottom: 60 },
  modalHandle: { width: 40, height: 4, backgroundColor: "#E5E7EB", borderRadius: 10, alignSelf: "center", marginBottom: 24 },
  modalScroll: { gap: 20 },
  modalTitle: { fontSize: 26, textAlign: "center" },
  modalServiceTitle: { fontSize: 16, textAlign: "center", marginTop: -12, marginBottom: 4 },
  errorBox: { flexDirection: "row", padding: 16, gap: 12, alignItems: "center" },
  errorText: { color: "#ef4444", fontSize: 14, flex: 1 },
  unlockOptions: { gap: 16 },
  unlockOption: { padding: 24, borderWidth: 1.5, gap: 14, borderRadius: 16 },
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
  clientStats: { width: "100%", padding: 20, gap: 16, marginTop: 8 },
  statsTitle: { fontSize: 16, textAlign: "center" },
  statsRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 30 },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 24, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: "#00000010" },
});
