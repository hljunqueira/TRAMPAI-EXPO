import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../../../context/AuthContext";
import { useColors } from "../../../hooks/useColors";

const TABS = [
  { id: "active", label: "Ativos" },
  { id: "done", label: "Finalizados" },
];

export default function MeusServicos() {
  const colors = useColors();
  const { user, services, fetchMyData } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("active");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyData();
    setRefreshing(false);
  };

  const myServices = (services || [])
    .filter((s: any) => s.clientId === user?.id)
    .filter((s: any) => {
      const status = s.status.toLowerCase();
      if (activeTab === "active") return status === "open" || status === "in_progress" || status === "exclusive_pending";
      return status === "closed" || status === "completed" || status === "expired";
    })
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getInitials = (name?: string) => {
    if (!name) return "??";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  return (
    <View style={[styles.container, { backgroundColor: "#FDFCF0" }]}>
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 20 : 10), borderBottomWidth: 1, borderBottomColor: colors.border + "30", backgroundColor: "#fff" }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerLogo, { fontFamily: "Inter_800ExtraBold", color: colors.primary }]}>Trampaí</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={[styles.initialsAvatar, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(client)/perfil")}
          >
            <Text style={[styles.initialsText, { color: "#FFF", fontFamily: "Inter_700Bold" }]}>
              {getInitials(user?.name)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.heroSection, { padding: 20, paddingBottom: 0 }]}>
        <Text style={[styles.titleHero, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Meus Serviços</Text>
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabItem, activeTab === tab.id && { borderBottomColor: "#FF6B35", borderBottomWidth: 3 }]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab(tab.id);
            }}
          >
            <Text style={[
              styles.tabText, 
              { 
                color: activeTab === tab.id ? colors.navy : colors.mutedForeground,
                fontFamily: "Inter_700Bold"
              }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={myServices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B35" />}
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: "#fff", borderRadius: 20 }]}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>Nenhum serviço encontrado</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              {activeTab === "active" ? "Poste um serviço para encontrar prestadores!" : "Você ainda não tem serviços finalizados."}
            </Text>
            {activeTab === "active" && (
              <TouchableOpacity 
                style={[styles.postBtn, { backgroundColor: "#FF6B35" }]}
                onPress={() => router.push("/(client)/novo-servico")}
              >
                <Text style={styles.postBtnText}>Postar Novo Serviço</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const status = item.status.toLowerCase();
          const isClosed = status === "closed" || status === "completed";
          const inProgress = status === "in_progress";
          const isExclusivePending = status === "exclusive_pending";
          const proposalsCount = item.unlockedByProviders?.length || 0;

          return (
            <TouchableOpacity 
              style={[styles.card, isClosed && styles.cardClosed]}
              onPress={() => {
                if (!isClosed && !inProgress) {
                  if (proposalsCount > 0) {
                    router.push({ pathname: "/(client)/meus-servicos/interessados", params: { id: item.id } });
                  } else {
                    router.push({ pathname: "/(client)/meus-servicos/editar-servico", params: { id: item.id } });
                  }
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.cardMain}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={[
                      styles.statusBadge, 
                      { 
                        backgroundColor: isClosed ? "#e2e8f0" : isExclusivePending ? "#e8c08a30" : inProgress ? colors.cyan + "20" : colors.orange + "20" 
                      }
                    ]}>
                      <MaterialCommunityIcons 
                        name={isClosed ? "check-all" : isExclusivePending ? "crown" : inProgress ? "wrench" : "lightning-bolt"} 
                        size={12} 
                        color={isClosed ? "#64748b" : isExclusivePending ? "#b8860b" : inProgress ? colors.cyan : colors.orange} 
                      />
                      <Text style={[
                        styles.statusText, 
                        { color: isClosed ? "#64748b" : isExclusivePending ? "#b8860b" : inProgress ? colors.cyan : colors.orange, fontFamily: "Inter_700Bold" }
                      ]}>
                        {isClosed ? "Finalizado" : isExclusivePending ? "Match Exclusivo ⏳" : inProgress ? "Em Atendimento" : "Aberto"}
                      </Text>
                    </View>
                    <Text style={[styles.title, { color: colors.navy, fontFamily: "Inter_800ExtraBold" }]}>{item.title}</Text>
                    <View style={styles.locationRow}>
                      <MaterialCommunityIcons name="map-marker" size={14} color={colors.mutedForeground} />
                      <Text style={[styles.location, { color: colors.mutedForeground }]}>{item.location || "Local não informado"}</Text>
                    </View>
                  </View>
                  {!isClosed && (
                    <Text style={[styles.date, { color: colors.mutedForeground }]}>Postado em {new Date(item.createdAt).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' })}</Text>
                  )}
                </View>

                {/* Exclusive Pending Banner */}
                {isExclusivePending && (
                  <View style={[styles.proposalsBanner, { backgroundColor: "#e8c08a20", borderColor: "#e8c08a50", borderWidth: 1 }]}>
                    <MaterialCommunityIcons name="clock-outline" size={18} color="#b8860b" />
                    <Text style={[styles.proposalsText, { color: "#b8860b", fontFamily: "Inter_700Bold", flex: 1 }]}>
                      Um profissional pediu exclusividade. Responda!
                    </Text>
                  </View>
                )}

                {/* Conditional Content */}
                {!isClosed && !inProgress && !isExclusivePending && (
                  <View style={[styles.proposalsBanner, { backgroundColor: colors.navy + "08" }]}>
                    <MaterialCommunityIcons name="account-group" size={18} color={colors.navy} />
                    <Text style={[styles.proposalsText, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>
                      {proposalsCount} {proposalsCount === 1 ? "proposta recebida" : "propostas recebidas"}
                    </Text>
                    <MaterialCommunityIcons name="chevron-right" size={18} color={colors.navy} style={{ marginLeft: "auto" }} />
                  </View>
                )}

                {inProgress && item.unlockedByProviders?.[0] && (
                  <View style={styles.providerCard}>
                    <View style={styles.providerInfo}>
                      <View style={styles.providerAvatar}>
                        <MaterialCommunityIcons name="account" size={24} color={colors.mutedForeground} />
                      </View>
                      <View>
                        <Text style={[styles.providerName, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>Prestador Selecionado</Text>
                        <Text style={[styles.providerLabel, { color: colors.mutedForeground }]}>Em atendimento</Text>
                      </View>
                    </View>
                    <TouchableOpacity style={[styles.chatBtn, { backgroundColor: colors.navy + "08" }]}>
                      <MaterialCommunityIcons name="chat" size={18} color={colors.navy} />
                    </TouchableOpacity>
                  </View>
                )}

                {isClosed && (
                  <View style={[styles.reviewBanner, { backgroundColor: colors.orange + "10", borderColor: colors.orange + "30" }]}>
                    <View style={styles.reviewTextRow}>
                      <MaterialCommunityIcons name="star" size={18} color={colors.orange} />
                      <Text style={[styles.reviewLabel, { color: colors.orange, fontFamily: "Inter_700Bold" }]}>Avaliação pendente</Text>
                    </View>
                    <TouchableOpacity>
                      <Text style={[styles.reviewAction, { color: colors.orange, fontFamily: "Inter_700Bold" }]}>Avaliar</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Actions */}
                {!isClosed && (
                  <View style={styles.actions}>
                    {inProgress ? (
                      <TouchableOpacity 
                        style={[styles.fullAction, { backgroundColor: colors.navy }]}
                        onPress={() => {/* closeService(item.id) */}}
                      >
                        <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                        <Text style={[styles.fullActionText, { color: "#fff", fontFamily: "Inter_700Bold" }]}>Marcar como Resolvido</Text>
                      </TouchableOpacity>
                    ) : proposalsCount === 0 ? (
                      <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                        <TouchableOpacity 
                          style={[styles.secondaryAction, { borderColor: colors.primary, flex: 1, flexDirection: 'row', gap: 6 }]}
                          onPress={() => router.push({ pathname: "/(client)/meus-servicos/editar-servico", params: { id: item.id } })}
                        >
                          <MaterialCommunityIcons name="pencil" size={16} color={colors.primary} />
                          <Text style={[styles.secondaryActionText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Editar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.secondaryAction, { borderColor: colors.navy + "20", flex: 1 }]}
                          onPress={() => {/* closeService(item.id) */}}
                        >
                          <Text style={[styles.secondaryActionText, { color: colors.mutedForeground, fontFamily: "Inter_700Bold" }]}>Encerrar</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={[styles.secondaryAction, { borderColor: colors.navy + "20" }]}
                        onPress={() => {/* closeService(item.id) */}}
                      >
                        <Text style={[styles.secondaryActionText, { color: colors.mutedForeground, fontFamily: "Inter_700Bold" }]}>Encerrar Serviço</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
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
  heroSection: {
    marginBottom: 8,
  },
  titleHero: {
    fontSize: 28,
  },
  tabBar: { flexDirection: "row", paddingHorizontal: 20, borderBottomWidth: 1, borderColor: "#e2e8f0" },
  tabItem: { paddingVertical: 15, paddingHorizontal: 15, marginRight: 10 },
  tabText: { fontSize: 14 },
  list: { padding: 20, gap: 15 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#00000010",
    elevation: 4,
    shadowColor: "#21284E",
    shadowOpacity: 0.04,
    shadowRadius: 15,
    overflow: "hidden",
  },
  cardClosed: { opacity: 0.7, backgroundColor: "#f8fafc" },
  cardMain: { padding: 20 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 15 },
  cardHeaderLeft: { flex: 1, gap: 5 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: "flex-start" },
  statusText: { fontSize: 11 },
  title: { fontSize: 20, letterSpacing: -0.5 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  location: { fontSize: 13 },
  date: { fontSize: 11 },
  proposalsBanner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, marginBottom: 15 },
  proposalsText: { fontSize: 14 },
  providerCard: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    padding: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: "#00000005",
    backgroundColor: "#fcfcfd",
    marginBottom: 15
  },
  providerInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  providerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  providerName: { fontSize: 15 },
  providerLabel: { fontSize: 11 },
  chatBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  reviewBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, borderRadius: 12, borderWidth: 1 },
  reviewTextRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  reviewLabel: { fontSize: 14 },
  reviewAction: { fontSize: 14, textDecorationLine: "underline" },
  actions: { flexDirection: "row", gap: 10, marginTop: 5 },
  primaryAction: { flex: 2, flexDirection: "row", height: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, gap: 8 },
  actionText: { fontSize: 14 },
  secondaryAction: { flex: 1, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1.5 },
  secondaryActionText: { fontSize: 14 },
  fullAction: { flex: 1, flexDirection: "row", height: 50, alignItems: "center", justifyContent: "center", borderRadius: 12, gap: 10 },
  fullActionText: { fontSize: 15 },
  empty: { alignItems: "center", padding: 40, gap: 15 },
  emptyTitle: { fontSize: 18, textAlign: "center" },
  emptyDesc: { fontSize: 14, textAlign: "center", color: "#64748b" },
  postBtn: { paddingHorizontal: 25, paddingVertical: 12, borderRadius: 12, marginTop: 10 },
  postBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
