import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import type { User } from "@/types";

export default function AdminUsuarios() {
  const colors = useColors();
  const { allUsers, banUser, approveVerification, rejectVerification } = useAuth();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "CLIENT" | "PROVIDER">("ALL");

  const filteredUsers = allUsers
    .filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (search && !u.name?.toLowerCase().includes(search.toLowerCase()) && !u.email?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

  function handleBan(u: User) {
    Alert.prompt(
      "Banir usuário",
      `Motivo para banir ${u.name}:`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Banir",
          style: "destructive",
          onPress: (reason) => {
            if (reason) {
              banUser(u.id, reason);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ],
      "plain-text"
    );
  }

  function handleApprove(u: User) {
    Alert.alert("Aprovar verificação", `Aprovar conta de ${u.name}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Aprovar",
        onPress: () => {
          approveVerification(u.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }

  function handleReject(u: User) {
    Alert.alert("Rejeitar verificação", `Rejeitar conta de ${u.name}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Rejeitar",
        style: "destructive",
        onPress: () => rejectVerification(u.id, "Documentos insuficientes"),
      },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.navy, paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <Text style={[styles.headerTitle, { fontFamily: "Inter_700Bold" }]}>Usuários</Text>

        <TextInput
          style={[styles.searchInput, { backgroundColor: "#ffffff15", color: "#fff", borderRadius: colors.radius, fontFamily: "Inter_400Regular" }]}
          placeholder="Buscar por nome ou email..."
          placeholderTextColor="#ffffff60"
          value={search}
          onChangeText={setSearch}
        />

        <View style={styles.filterRow}>
          {(["ALL", "CLIENT", "PROVIDER"] as const).map((role) => (
            <TouchableOpacity
              key={role}
              style={[styles.filterChip, { backgroundColor: roleFilter === role ? colors.accent : "#ffffff20", borderRadius: 16 }]}
              onPress={() => setRoleFilter(role)}
            >
              <Text style={[styles.filterText, { fontFamily: roleFilter === role ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                {role === "ALL" ? "Todos" : role === "CLIENT" ? "Clientes" : "Prestadores"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!filteredUsers.length}
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
            <MaterialCommunityIcons name="account-group-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              Nenhum usuário encontrado
            </Text>
          </View>
        }
        renderItem={({ item: u }) => (
          <View style={[styles.userCard, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}>
            <View style={styles.userHeader}>
              <View style={[styles.userAvatar, { backgroundColor: u.role === "PROVIDER" ? colors.accent + "20" : colors.cyan + "20" }]}>
                <Text style={[styles.userInitials, { color: u.role === "PROVIDER" ? colors.accent : colors.cyan, fontFamily: "Inter_700Bold" }]}>
                  {u.name?.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase() || "?"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={[styles.userName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
                    {u.name}
                  </Text>
                  {u.isBanned && (
                    <View style={[styles.bannedBadge, { backgroundColor: "#ef444420" }]}>
                      <Text style={[styles.bannedText, { fontFamily: "Inter_600SemiBold" }]}>Banido</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.userEmail, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
                  {u.email}
                </Text>
                <View style={styles.metaRow}>
                  <View style={[styles.roleBadge, { backgroundColor: u.role === "PROVIDER" ? colors.accent + "15" : colors.cyan + "15", borderRadius: 6 }]}>
                    <Text style={[styles.roleText, { color: u.role === "PROVIDER" ? colors.accent : colors.cyan, fontFamily: "Inter_500Medium" }]}>
                      {u.role === "PROVIDER" ? "Prestador" : "Cliente"}
                    </Text>
                  </View>
                  <Text style={[styles.creditText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    {u.creditBalance} cr · {u.city || "Sem cidade"}
                  </Text>
                </View>
              </View>
            </View>

            {u.role === "PROVIDER" && u.verificationStatus === "PENDING" && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#22c55e", borderRadius: 8 }]}
                  onPress={() => handleApprove(u)}
                >
                  <MaterialCommunityIcons name="check" size={14} color="#fff" />
                  <Text style={[styles.actionBtnText, { fontFamily: "Inter_600SemiBold" }]}>Aprovar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#ef4444", borderRadius: 8 }]}
                  onPress={() => handleReject(u)}
                >
                  <MaterialCommunityIcons name="close" size={14} color="#fff" />
                  <Text style={[styles.actionBtnText, { fontFamily: "Inter_600SemiBold" }]}>Rejeitar</Text>
                </TouchableOpacity>
              </View>
            )}

            {!u.isBanned && (
              <TouchableOpacity
                style={[styles.banBtn, { borderColor: "#ef444440" }]}
                onPress={() => handleBan(u)}
              >
                <MaterialCommunityIcons name="account-cancel-outline" size={14} color="#ef4444" />
                <Text style={[styles.banBtnText, { fontFamily: "Inter_500Medium" }]}>Banir</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
  headerTitle: { color: "#fff", fontSize: 22 },
  searchInput: { paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
  filterRow: { flexDirection: "row", gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7 },
  filterText: { color: "#fff", fontSize: 13 },
  list: { padding: 16, gap: 12 },
  empty: { alignItems: "center", padding: 40, gap: 12 },
  emptyTitle: { fontSize: 17 },
  userCard: { padding: 14, borderWidth: 1, gap: 12 },
  userHeader: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  userAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  userInitials: { fontSize: 16 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  userName: { fontSize: 14, flex: 1 },
  bannedBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  bannedText: { color: "#ef4444", fontSize: 10 },
  userEmail: { fontSize: 12, marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3 },
  roleText: { fontSize: 11 },
  creditText: { fontSize: 11 },
  actionRow: { flexDirection: "row", gap: 8 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, gap: 4 },
  actionBtnText: { color: "#fff", fontSize: 12 },
  banBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 6, gap: 4, borderTopWidth: StyleSheet.hairlineWidth },
  banBtnText: { color: "#ef4444", fontSize: 12 },
});
