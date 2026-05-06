import {
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";

const TABS = [
  { id: "active", label: "Ativos" },
  { id: "finished", label: "Finalizados" },
];

export default function MeusLeads() {
  const colors = useColors();
  const { user, leads, fetchMyData } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("active");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyData();
    setRefreshing(false);
  };

  const now = Date.now();
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  const filteredLeads = leads
    .filter((l) => {
      const age = now - new Date(l.createdAt).getTime();
      if (activeTab === "active") return age <= THIRTY_DAYS_MS;
      return age > THIRTY_DAYS_MS;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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

      <View style={[styles.heroSection, { padding: 20, paddingBottom: 0 }]}>
        <Text style={[styles.titleHero, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Meus Trampos</Text>
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
        data={filteredLeads}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B35" />}
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: "#fff", borderRadius: 20 }]}>
            <MaterialCommunityIcons name="lightning-bolt-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>Nenhum lead encontrado</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              {activeTab === "active" ? "Vá ao mural e encontre novos serviços!" : "Você ainda não finalizou nenhum trampo."}
            </Text>
            {activeTab === "active" && (
              <TouchableOpacity 
                style={[styles.postBtn, { backgroundColor: "#FF6B35" }]}
                onPress={() => router.push("/(provider)/mural")}
              >
                <Text style={styles.postBtnText}>Ver Mural de Serviços</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardMain}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.badgesRow}>
                    <View style={[styles.statusBadge, { backgroundColor: colors.cyan + "20" }]}>
                      <MaterialCommunityIcons name="clock-outline" size={12} color={colors.cyan} />
                      <Text style={[styles.statusText, { color: colors.cyan, fontFamily: "Inter_700Bold" }]}>Em Aberto</Text>
                    </View>
                    {/* Badge de tipo do lead */}
                    <View style={[styles.statusBadge, { 
                      backgroundColor: item.type === "EXCLUSIVE" ? "#e8c08a30" : item.type === "PLUS" ? colors.secondary + "20" : "#00000008"
                    }]}>
                      <MaterialCommunityIcons 
                        name={item.type === "EXCLUSIVE" ? "crown" : item.type === "PLUS" ? "shield-check" : "lock-open"} 
                        size={12} 
                        color={item.type === "EXCLUSIVE" ? "#b8860b" : item.type === "PLUS" ? colors.secondary : colors.mutedForeground} 
                      />
                      <Text style={[styles.statusText, { 
                        color: item.type === "EXCLUSIVE" ? "#b8860b" : item.type === "PLUS" ? colors.secondary : colors.mutedForeground, 
                        fontFamily: "Inter_700Bold" 
                      }]}>
                        {item.type === "EXCLUSIVE" ? "Exclusivo" : item.type === "PLUS" ? "Plus" : "Normal"}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.title, { color: colors.navy, fontFamily: "Inter_800ExtraBold" }]}>{item.jobTitle}</Text>
                </View>
                <Text style={[styles.date, { color: colors.mutedForeground }]}>{new Date(item.createdAt).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' })}</Text>
              </View>

              <View style={styles.clientInfo}>
                <View style={styles.clientAvatar}>
                  <MaterialCommunityIcons name="account" size={24} color={colors.mutedForeground} />
                </View>
                <View style={styles.clientDetails}>
                  <Text style={[styles.clientName, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>{item.clientName}</Text>
                  <View style={styles.locationRow}>
                    <MaterialCommunityIcons name="map-marker" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.location, { color: colors.mutedForeground }]}>
                      {(item.type === "PLUS" || item.type === "EXCLUSIVE") 
                        ? (item as any).jobLocation 
                        : `${item.neighborhood || ""}, ${item.city || ""}`}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={[styles.whatsappBtn, { backgroundColor: "#25D366" }]}
                  onPress={() => Linking.openURL(item.whatsappLink)}
                >
                  <MaterialCommunityIcons name="whatsapp" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
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
  tabBar: { flexDirection: "row", paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#00000008" },
  tabItem: { flex: 1, alignItems: "center", paddingVertical: 15 },
  tabText: { fontSize: 14 },
  list: { padding: 20 },
  badgesRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#0b1339",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardMain: { padding: 20 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  cardHeaderLeft: { flex: 1, gap: 8 },
  statusBadge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100 },
  statusText: { fontSize: 11 },
  title: { fontSize: 18, lineHeight: 24 },
  date: { fontSize: 12 },
  clientInfo: { flexDirection: "row", alignItems: "center", backgroundColor: "#f9fafb", padding: 16, borderRadius: 16, gap: 12 },
  clientAvatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#00000005" },
  clientDetails: { flex: 1 },
  clientName: { fontSize: 16 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  location: { fontSize: 13 },
  whatsappBtn: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", elevation: 4 },
  empty: { alignItems: "center", padding: 48, gap: 16, marginTop: 20 },
  emptyTitle: { fontSize: 20, textAlign: "center" },
  emptyDesc: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  postBtn: { marginTop: 12, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 100 },
  postBtnText: { color: "#fff" },
});
