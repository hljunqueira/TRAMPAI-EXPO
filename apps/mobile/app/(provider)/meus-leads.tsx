import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function MeusLeads() {
  const colors = useColors();
  const { user, leads } = useAuth();
  const insets = useSafeAreaInsets();

  const myLeads = leads
    .filter((l) => l.providerId === user?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Agora há pouco";
    if (hours < 24) return `${hours}h atrás`;
    return `${Math.floor(hours / 24)}d atrás`;
  }

  function openWhatsApp(phone: string, serviceTitle: string, category: string) {
    const cleaned = phone.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Olá! Vi seu pedido de serviço no Trampaí (${category}: "${serviceTitle}") e tenho interesse. Podemos conversar?`
    );
    Linking.openURL(`https://wa.me/55${cleaned}?text=${msg}`);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.navy,
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
          },
        ]}
      >
        <Text style={[styles.headerTitle, { fontFamily: "Inter_700Bold" }]}>
          Meus Leads
        </Text>
        <Text style={[styles.headerSub, { fontFamily: "Inter_400Regular" }]}>
          {myLeads.length} {myLeads.length === 1 ? "lead desbloqueado" : "leads desbloqueados"}
        </Text>
      </View>

      <FlatList
        data={myLeads}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!myLeads.length}
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
            <MaterialCommunityIcons name="briefcase-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              Nenhum lead ainda
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Vá ao mural e desbloqueie serviços para ver o contato dos clientes aqui.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.leadCard,
              {
                backgroundColor: colors.card,
                borderRadius: colors.radius,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.leadHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.leadTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]} numberOfLines={2}>
                  {item.serviceTitle}
                </Text>
                <Text style={[styles.leadCategory, { color: colors.accent, fontFamily: "Inter_500Medium" }]}>
                  {item.serviceCategory}
                </Text>
              </View>
              <View
                style={[
                  styles.typeBadge,
                  {
                    backgroundColor: item.type === "EXCLUSIVE" ? colors.navy : colors.cyan + "20",
                    borderRadius: 8,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={item.type === "EXCLUSIVE" ? "crown" : "lock-open"}
                  size={12}
                  color={item.type === "EXCLUSIVE" ? colors.accent : colors.cyan}
                />
                <Text
                  style={[
                    styles.typeBadgeText,
                    {
                      color: item.type === "EXCLUSIVE" ? colors.accent : colors.cyan,
                      fontFamily: "Inter_600SemiBold",
                    },
                  ]}
                >
                  {item.type === "EXCLUSIVE" ? "Exclusivo" : "Normal"}
                </Text>
              </View>
            </View>

            <View style={styles.clientInfo}>
              <View style={[styles.clientAvatar, { backgroundColor: colors.navy + "15" }]}>
                <MaterialCommunityIcons name="account" size={20} color={colors.navy} />
              </View>
              <View>
                <Text style={[styles.clientName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  {item.clientName}
                </Text>
                <View style={styles.locationRow}>
                  <MaterialCommunityIcons name="map-marker-outline" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.locationText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    {item.neighborhood}, {item.city}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.leadFooter}>
              <View style={styles.footerLeft}>
                <MaterialCommunityIcons name="star-circle" size={14} color={colors.accent} />
                <Text style={[styles.costText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {item.creditsSpent} crédito{item.creditsSpent > 1 ? "s" : ""} gastos
                </Text>
                <Text style={[styles.timeText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  · {timeAgo(item.createdAt)}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.waBtn, { backgroundColor: "#25D366", borderRadius: 20 }]}
                onPress={() => openWhatsApp(item.clientPhone, item.serviceTitle, item.serviceCategory)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="whatsapp" size={16} color="#fff" />
                <Text style={[styles.waBtnText, { fontFamily: "Inter_600SemiBold" }]}>
                  WhatsApp
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 22 },
  headerSub: { color: "#ffffff80", fontSize: 13, marginTop: 2 },
  list: { padding: 16, gap: 12 },
  empty: { alignItems: "center", padding: 40, gap: 12, margin: 16 },
  emptyTitle: { fontSize: 17 },
  emptyDesc: { fontSize: 13, textAlign: "center", lineHeight: 18 },
  leadCard: { padding: 16, borderWidth: 1, gap: 14, marginBottom: 12 },
  leadHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  leadTitle: { fontSize: 14, lineHeight: 20 },
  leadCategory: { fontSize: 12, marginTop: 2 },
  typeBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
  typeBadgeText: { fontSize: 11 },
  clientInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  clientAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  clientName: { fontSize: 14 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  locationText: { fontSize: 12 },
  leadFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  footerLeft: { flexDirection: "row", alignItems: "center", gap: 4 },
  costText: { fontSize: 12 },
  timeText: { fontSize: 12 },
  waBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, gap: 6 },
  waBtnText: { color: "#fff", fontSize: 13 },
});
