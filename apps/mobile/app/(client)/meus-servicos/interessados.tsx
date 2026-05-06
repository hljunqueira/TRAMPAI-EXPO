import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../../../context/AuthContext";
import { useColors } from "../../../hooks/useColors";

export default function Interessados() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const { fetchJobById } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    const data = await fetchJobById(id as string);
    if (data && data.leads) {
      setJob(data);
      // Order leads by provider rating and review count
      const sortedLeads = [...data.leads].sort((a, b) => {
        const ratingA = parseFloat(a.provider.rating) || 0;
        const ratingB = parseFloat(b.provider.rating) || 0;
        if (ratingB !== ratingA) return ratingB - ratingA;
        return (b.provider.reviewCount || 0) - (a.provider.reviewCount || 0);
      });
      setLeads(sortedLeads);
    }
    setLoading(false);
  }

  const getInitials = (name?: string) => {
    if (!name) return "P";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!job || leads.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 20 : 10), backgroundColor: "#fff" }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.navy} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>Interessados</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <MaterialCommunityIcons name="account-search-outline" size={64} color={colors.mutedForeground} />
          <Text style={{ textAlign: "center", marginTop: 15, fontSize: 18, color: colors.navy, fontFamily: "Inter_700Bold" }}>Nenhum interessado ainda</Text>
          <Text style={{ textAlign: "center", marginTop: 8, color: colors.mutedForeground }}>Assim que os prestadores enviarem propostas, elas aparecerão aqui.</Text>
          <TouchableOpacity style={[styles.backBtn, { marginTop: 30, backgroundColor: colors.primary + "10", padding: 12, borderRadius: 100 }]} onPress={() => router.back()}>
            <Text style={{ color: colors.primary, fontFamily: "Inter_700Bold" }}>Voltar para Meus Serviços</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#FDFCF0" }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 20 : 10), backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#00000010" }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.navy} />
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={[styles.headerTitle, { color: colors.navy, fontFamily: "Inter_800ExtraBold" }]}>Profissionais</Text>
          <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }}>Ranking de Interessados</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={leads}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={[styles.jobTitle, { color: colors.navy, fontFamily: "Inter_800ExtraBold" }]}>{job.title}</Text>
            <View style={[styles.countBadge, { backgroundColor: colors.primary + "15" }]}>
              <MaterialCommunityIcons name="account-group" size={16} color={colors.primary} />
              <Text style={{ color: colors.primary, fontFamily: "Inter_700Bold", fontSize: 13 }}>{leads.length} propostas</Text>
            </View>
          </View>
        }
        renderItem={({ item, index }) => {
          const provider = item.provider;
          const isTop = index === 0;

          return (
            <TouchableOpacity 
              style={[styles.providerCard, isTop && { borderColor: "#FFD700", borderWidth: 2 }]}
              onPress={() => router.push({ pathname: "/(client)/detalhes-proposta", params: { id: job.id, providerId: provider.id } })}
              activeOpacity={0.8}
            >
              {isTop && (
                <View style={[styles.topBadge, { backgroundColor: "#FFD700" }]}>
                  <MaterialCommunityIcons name="crown" size={12} color="#B8860B" />
                  <Text style={{ fontSize: 10, color: "#B8860B", fontFamily: "Inter_800ExtraBold" }}>MAIS BEM AVALIADO</Text>
                </View>
              )}
              <View style={styles.cardContent}>
                <View style={styles.avatarWrapper}>
                  {provider.avatarUrl ? (
                    <Image source={{ uri: provider.avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, { backgroundColor: colors.navy + "10", alignItems: "center", justifyContent: "center" }]}>
                       <Text style={{ fontSize: 20, color: colors.navy, fontFamily: "Inter_700Bold" }}>{getInitials(provider.name)}</Text>
                    </View>
                  )}
                  {item.type === "PLUS" || item.type === "EXCLUSIVE" ? (
                    <View style={[styles.verifiedBadge, { backgroundColor: item.type === "EXCLUSIVE" ? "#b8860b" : colors.secondary }]}>
                      <MaterialCommunityIcons name={item.type === "EXCLUSIVE" ? "star" : "check-decagram"} size={12} color="#fff" />
                    </View>
                  ) : null}
                </View>
                
                <View style={styles.providerInfo}>
                  <Text style={[styles.providerName, { color: colors.navy, fontFamily: "Inter_700Bold" }]} numberOfLines={1}>
                    {provider.name}
                  </Text>
                  
                  <View style={styles.ratingRow}>
                    <MaterialCommunityIcons name="star" size={14} color="#F69926" />
                    <Text style={[styles.ratingText, { fontFamily: "Inter_700Bold", color: "#F69926" }]}>{provider.rating || "5.0"}</Text>
                    <Text style={{ fontSize: 12, color: colors.mutedForeground, marginLeft: 2 }}>({provider.reviewCount || 0} avaliações)</Text>
                  </View>
                  
                  <View style={styles.metaRow}>
                    <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.mutedForeground} />
                    <Text style={{ fontSize: 12, color: colors.mutedForeground }} numberOfLines={1}>{provider.city || "São Paulo"}</Text>
                  </View>
                </View>

                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.border} />
              </View>
              {item.type === "EXCLUSIVE" && (
                 <View style={{ backgroundColor: "#e8c08a20", padding: 8, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <MaterialCommunityIcons name="lock" size={14} color="#b8860b" />
                    <Text style={{ fontSize: 11, color: "#b8860b", fontFamily: "Inter_700Bold" }}>Proposta Exclusiva - Responda Rápido!</Text>
                 </View>
              )}
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
    paddingBottom: 15,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18 },
  listHeader: { marginBottom: 20, alignItems: "center" },
  jobTitle: { fontSize: 22, textAlign: "center", marginBottom: 10 },
  countBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  providerCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: "#00000008",
  },
  topBadge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 4, borderTopLeftRadius: 18, borderBottomRightRadius: 10 },
  cardContent: { flexDirection: "row", alignItems: "center", padding: 16 },
  avatarWrapper: { position: "relative", marginRight: 15 },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  verifiedBadge: { position: "absolute", bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  providerInfo: { flex: 1, gap: 4 },
  providerName: { fontSize: 16 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  ratingText: { fontSize: 13 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
});
