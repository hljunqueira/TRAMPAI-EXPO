import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function AdminPerfil() {
  const colors = useColors();
  const { user, logout, activeMode, switchActiveMode, getUserLocation } = useAuth();
  const insets = useSafeAreaInsets();

  function handleLogout() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Sair", "Deseja sair do Painel Admin?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  }

  function handleSwitchMode(mode: "CLIENT" | "PROVIDER") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    switchActiveMode(mode);
    router.replace(mode === "CLIENT" ? "/(client)" : "/(provider)/mural");
  }

  const getInitials = (name?: string) => {
    if (!name) return "??";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }} 
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={[styles.profileHeader, { paddingTop: insets.top + 32 }]}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
                {getInitials(user?.name)}
              </Text>
            </View>
            <View style={[styles.onlineIndicator, { backgroundColor: colors.secondary, borderColor: "#fff" }]} />
          </View>
          
          <Text style={[styles.userName, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>{user?.name}</Text>
          <Text style={[styles.userEmail, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{user?.email}</Text>
          
          <View style={[styles.adminBadge, { backgroundColor: colors.primary + "10" }]}>
            <MaterialCommunityIcons name="shield-check" size={14} color={colors.primary} />
            <Text style={[styles.adminBadgeText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Administrador Master</Text>
          </View>
        </View>

        {/* Navigation Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Minhas Ações</Text>
          <View style={styles.bentoRow}>
            <TouchableOpacity 
              style={[styles.bentoCard, { backgroundColor: "#fff" }]}
              onPress={() => router.push("/(client)/meus-servicos")}
            >
              <View style={[styles.bentoIcon, { backgroundColor: colors.primary + "05" }]}>
                <MaterialCommunityIcons name="clipboard-text-clock" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.bentoLabel, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Meus Serviços</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.bentoCard, { backgroundColor: "#fff" }]}
              onPress={() => router.push("/editar-perfil")}
            >
              <View style={[styles.bentoIcon, { backgroundColor: colors.secondary + "15" }]}>
                <MaterialCommunityIcons name="account-edit" size={24} color={colors.secondary} />
              </View>
              <Text style={[styles.bentoLabel, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Editar Perfil</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Navigation Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Navegação</Text>
          <View style={styles.bentoRow}>
            <TouchableOpacity 
              style={[styles.bentoCard, { backgroundColor: "#fff" }]}
              onPress={() => handleSwitchMode("CLIENT")}
            >
              <View style={[styles.bentoIcon, { backgroundColor: colors.primary + "05" }]}>
                <MaterialCommunityIcons name="account-search" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.bentoLabel, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Visão Cliente</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.bentoCard, { backgroundColor: "#fff" }]}
              onPress={() => handleSwitchMode("PROVIDER")}
            >
              <View style={[styles.bentoIcon, { backgroundColor: colors.secondary + "15" }]}>
                <MaterialCommunityIcons name="account-hard-hat" size={24} color={colors.secondary} />
              </View>
              <Text style={[styles.bentoLabel, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Visão Prestador</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* System Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Sistema</Text>
          <View style={[styles.menuCard, { backgroundColor: "#fff" }]}>
            <View style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: "#22c55e10" }]}>
                <MaterialCommunityIcons name="server" size={20} color="#22c55e" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Status da API</Text>
                <Text style={[styles.menuSub, { color: colors.mutedForeground }]}>Operacional · Latência: 45ms</Text>
              </View>
            </View>
            
            <View style={[styles.divider, { backgroundColor: colors.border + "10" }]} />
            
            <View style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: colors.primary + "05" }]}>
                <MaterialCommunityIcons name="database" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Versão do Banco</Text>
                <Text style={[styles.menuSub, { color: colors.mutedForeground }]}>PostgreSQL 15.0 · Drizzle v0.29</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border + "10" }]} />

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={async () => {
                const loc = await getUserLocation();
                if (loc) {
                  Alert.alert("Localização Atual", `Lat: ${loc.coords.latitude}\nLong: ${loc.coords.longitude}`);
                }
              }}
            >
              <View style={[styles.menuIcon, { backgroundColor: "#6366f110" }]}>
                <MaterialCommunityIcons name="map-marker-radius" size={20} color="#6366f1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Testar GPS</Text>
                <Text style={[styles.menuSub, { color: colors.mutedForeground }]}>Obter coordenadas atuais</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.primary + "40"} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border + "10" }]} />

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push("/(admin)/configuracoes")}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.primary + "10" }]}>
                <MaterialCommunityIcons name="tune" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Configurações</Text>
                <Text style={[styles.menuSub, { color: colors.mutedForeground }]}>Taxas, Prazos e Notificações</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.primary + "40"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dangerous Area */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.logoutBtn, { backgroundColor: "#ef444415" }]} 
            onPress={handleLogout}
          >
            <MaterialCommunityIcons name="logout-variant" size={20} color="#ef4444" />
            <Text style={[styles.logoutBtnText, { color: "#ef4444", fontFamily: "Inter_800ExtraBold" }]}>Sair do Painel Admin</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.versionText, { color: colors.mutedForeground }]}>Trampaí Enterprise · v2.5.0-PRO</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileHeader: { alignItems: "center", paddingHorizontal: 20, paddingBottom: 24 },
  avatarWrapper: { position: "relative", marginBottom: 20 },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center", shadowColor: "#0b1339", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  avatarText: { fontSize: 32 },
  onlineIndicator: { position: "absolute", bottom: 4, right: 4, width: 18, height: 18, borderRadius: 9, borderWidth: 3 },
  userName: { fontSize: 24, marginBottom: 4 },
  userEmail: { fontSize: 14, marginBottom: 16 },
  adminBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  adminBadgeText: { fontSize: 11, textTransform: "uppercase" },
  section: { paddingHorizontal: 20, marginTop: 32 },
  sectionTitle: { fontSize: 16, marginBottom: 16, marginLeft: 4 },
  bentoRow: { flexDirection: "row", gap: 12 },
  bentoCard: { flex: 1, padding: 20, borderRadius: 24, shadowColor: "#0b1339", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  bentoIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  bentoLabel: { fontSize: 13 },
  menuCard: { borderRadius: 24, padding: 16, shadowColor: "#0b1339", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  menuIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 14 },
  menuSub: { fontSize: 11, marginTop: 2 },
  divider: { height: 1, marginVertical: 8, marginHorizontal: 4 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, height: 56, borderRadius: 16 },
  logoutBtnText: { fontSize: 14, textTransform: "uppercase", letterSpacing: 0.5 },
  versionText: { textAlign: "center", marginTop: 32, fontSize: 11, fontFamily: "Inter_500Medium", opacity: 0.5 },
});
