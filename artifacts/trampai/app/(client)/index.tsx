import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function ClientDashboard() {
  const colors = useColors();
  const { user, services } = useAuth();
  const insets = useSafeAreaInsets();

  const myServices = services.filter((s) => s.clientId === user?.id);
  const openServices = myServices.filter((s) => s.status === "OPEN");
  const closedServices = myServices.filter((s) => s.status === "CLOSED");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.navy, colors.navy + "EE"]}
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
          },
        ]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.greeting, { fontFamily: "Inter_400Regular" }]}>
              Olá, {user?.name?.split(" ")[0]} 👋
            </Text>
            <Text style={[styles.headerTitle, { fontFamily: "Inter_700Bold" }]}>
              Dashboard
            </Text>
          </View>
          <View style={[styles.creditBadge, { backgroundColor: colors.accent }]}>
            <MaterialCommunityIcons name="star-circle" size={16} color="#fff" />
            <Text style={[styles.creditText, { fontFamily: "Inter_700Bold" }]}>
              {user?.creditBalance ?? 0} cr
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: "#ffffff15" }]}>
            <Text style={[styles.statNumber, { fontFamily: "Inter_700Bold" }]}>
              {openServices.length}
            </Text>
            <Text style={[styles.statLabel, { fontFamily: "Inter_400Regular" }]}>
              Em aberto
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#ffffff15" }]}>
            <Text style={[styles.statNumber, { fontFamily: "Inter_700Bold" }]}>
              {closedServices.length}
            </Text>
            <Text style={[styles.statLabel, { fontFamily: "Inter_400Regular" }]}>
              Resolvidos
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#ffffff15" }]}>
            <Text style={[styles.statNumber, { fontFamily: "Inter_700Bold" }]}>
              {myServices.reduce((sum, s) => sum + s.unlockedByProviders.length, 0)}
            </Text>
            <Text style={[styles.statLabel, { fontFamily: "Inter_400Regular" }]}>
              Interesses
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={[
            styles.ctaCard,
            { backgroundColor: colors.accent, borderRadius: colors.radius * 1.5 },
          ]}
          onPress={() => router.push("/(client)/novo-servico")}
          activeOpacity={0.85}
        >
          <View style={styles.ctaContent}>
            <MaterialCommunityIcons name="plus-circle" size={32} color="#fff" />
            <View>
              <Text style={[styles.ctaTitle, { fontFamily: "Inter_700Bold" }]}>
                Postar Novo Serviço
              </Text>
              <Text style={[styles.ctaSub, { fontFamily: "Inter_400Regular" }]}>
                Gratuito — receba propostas em minutos
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons name="arrow-right" size={22} color="#fff" />
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Serviços Recentes
        </Text>

        {openServices.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
            <MaterialCommunityIcons
              name="clipboard-outline"
              size={40}
              color={colors.mutedForeground}
            />
            <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              Nenhum serviço ativo
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Poste seu primeiro serviço e receba propostas de prestadores qualificados.
            </Text>
          </View>
        ) : (
          openServices.slice(0, 3).map((s) => (
            <View
              key={s.id}
              style={[
                styles.serviceItem,
                {
                  backgroundColor: colors.card,
                  borderRadius: colors.radius,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.serviceRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.serviceTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
                    {s.title}
                  </Text>
                  <Text style={[styles.serviceCategory, { color: colors.accent, fontFamily: "Inter_500Medium" }]}>
                    {s.category}
                  </Text>
                </View>
                <View style={styles.interestBadge}>
                  <MaterialCommunityIcons name="eye-outline" size={14} color={colors.cyan} />
                  <Text style={[styles.interestCount, { color: colors.cyan, fontFamily: "Inter_700Bold" }]}>
                    {s.unlockedByProviders.length}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}

        {openServices.length > 3 && (
          <TouchableOpacity
            onPress={() => router.push("/(client)/meus-servicos")}
            style={styles.viewAll}
          >
            <Text style={[styles.viewAllText, { color: colors.cyan, fontFamily: "Inter_500Medium" }]}>
              Ver todos ({myServices.length})
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={16} color={colors.cyan} />
          </TouchableOpacity>
        )}

        <View style={[styles.tipCard, { backgroundColor: colors.navy + "10", borderRadius: colors.radius }]}>
          <MaterialCommunityIcons name="lightbulb-outline" size={20} color={colors.navy} />
          <Text style={[styles.tipText, { color: colors.navy, fontFamily: "Inter_400Regular" }]}>
            <Text style={{ fontFamily: "Inter_600SemiBold" }}>Dica: </Text>
            Descreva bem o serviço e informe o bairro. Prestadores locais vão te encontrar mais rápido!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  greeting: { color: "#ffffff90", fontSize: 14 },
  headerTitle: { color: "#fff", fontSize: 24 },
  creditBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  creditText: { color: "#fff", fontSize: 14 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statNumber: { color: "#fff", fontSize: 24 },
  statLabel: { color: "#ffffff90", fontSize: 11, marginTop: 2 },
  scrollView: { flex: 1 },
  content: { padding: 16, gap: 16 },
  ctaCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    justifyContent: "space-between",
  },
  ctaContent: { flexDirection: "row", alignItems: "center", gap: 14 },
  ctaTitle: { color: "#fff", fontSize: 16 },
  ctaSub: { color: "#ffffff90", fontSize: 12, marginTop: 2 },
  sectionTitle: { fontSize: 18 },
  emptyState: {
    alignItems: "center",
    padding: 32,
    gap: 10,
  },
  emptyTitle: { fontSize: 16 },
  emptyDesc: { fontSize: 13, textAlign: "center", lineHeight: 18 },
  serviceItem: {
    padding: 14,
    borderWidth: 1,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  serviceTitle: { fontSize: 14 },
  serviceCategory: { fontSize: 12, marginTop: 2 },
  interestBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  interestCount: { fontSize: 14 },
  viewAll: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: -4,
  },
  viewAllText: { fontSize: 14 },
  tipCard: {
    flexDirection: "row",
    padding: 14,
    gap: 10,
    alignItems: "flex-start",
  },
  tipText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
