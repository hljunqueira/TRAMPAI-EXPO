import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ServiceCard } from "@/components/ServiceCard";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import type { ServiceStatus } from "@/types";

const FILTERS: { label: string; value: ServiceStatus | "ALL" }[] = [
  { label: "Todos", value: "ALL" },
  { label: "Abertos", value: "OPEN" },
  { label: "Encerrados", value: "CLOSED" },
  { label: "Expirados", value: "EXPIRED" },
];

export default function MeusServicos() {
  const colors = useColors();
  const { user, services, closeService } = useAuth();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<ServiceStatus | "ALL">("ALL");

  const myServices = services
    .filter((s) => s.clientId === user?.id)
    .filter((s) => filter === "ALL" || s.status === filter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
          Meus Serviços
        </Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.accent }]}
          onPress={() => router.push("/(client)/novo-servico")}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[
              styles.filterChip,
              {
                backgroundColor: filter === f.value ? colors.navy : colors.card,
                borderColor: filter === f.value ? colors.navy : colors.border,
                borderRadius: 20,
              },
            ]}
            onPress={() => setFilter(f.value)}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color: filter === f.value ? "#fff" : colors.mutedForeground,
                  fontFamily: filter === f.value ? "Inter_600SemiBold" : "Inter_400Regular",
                },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={myServices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: 100 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!myServices.length}
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
            <MaterialCommunityIcons
              name="clipboard-outline"
              size={48}
              color={colors.mutedForeground}
            />
            <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              Nenhum serviço aqui
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {filter === "ALL"
                ? "Poste um serviço e conecte-se com prestadores qualificados."
                : `Nenhum serviço ${filter === "OPEN" ? "aberto" : filter === "CLOSED" ? "encerrado" : "expirado"}.`}
            </Text>
            {filter === "ALL" && (
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: colors.accent, borderRadius: colors.radius }]}
                onPress={() => router.push("/(client)/novo-servico")}
              >
                <Text style={[styles.emptyBtnText, { fontFamily: "Inter_600SemiBold" }]}>
                  Postar Serviço
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <ServiceCard
            service={item}
            showClose
            onClose={() => closeService(item.id)}
          />
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
    paddingBottom: 16,
  },
  headerTitle: { color: "#fff", fontSize: 22 },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  filterRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1 },
  filterText: { fontSize: 13 },
  list: { padding: 16 },
  empty: { alignItems: "center", padding: 40, gap: 12 },
  emptyTitle: { fontSize: 17 },
  emptyDesc: { fontSize: 13, textAlign: "center", lineHeight: 18 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  emptyBtnText: { color: "#fff", fontSize: 14 },
});
