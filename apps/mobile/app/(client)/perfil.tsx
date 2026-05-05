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
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";

import { useAuth, API_BASE_URL } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function ClientPerfil() {
  const colors = useColors();
  const { user, logout, transactions, activeMode, switchActiveMode, fetchMyData } = useAuth();
  const insets = useSafeAreaInsets();
  const [uploading, setUploading] = React.useState(false);

  async function pickAvatarImage() {
    Alert.alert(
      "Selecionar Foto",
      "Escolha a origem da sua foto de perfil",
      [
        { text: "Câmera", onPress: () => openPicker("camera") },
        { text: "Galeria", onPress: () => openPicker("gallery") },
        { text: "Cancelar", style: "cancel" },
      ]
    );
  }

  async function openPicker(type: "camera" | "gallery") {
    let result;
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    };

    if (type === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permissão necessária", "Precisamos de acesso à câmera.");
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets[0].base64) {
      setUploading(true);
      try {
        const token = await SecureStore.getItemAsync("userToken");
        
        // Fazer upload da imagem
        const uploadRes = await fetch(`${API_BASE_URL}/api/upload`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            imageBase64: result.assets[0].base64,
            ext: "jpg",
          }),
        });

        if (!uploadRes.ok) throw new Error("Erro no upload");
        const { url } = await uploadRes.json();

        // Salvar no perfil do usuário
        const updateRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ avatarUrl: url }),
        });

        if (updateRes.ok) {
          fetchMyData(); // recarregar usuário
        }
      } catch (e) {
        Alert.alert("Erro", "Não foi possível atualizar a foto de perfil.");
      } finally {
        setUploading(false);
      }
    }
  }

  const myTransactions = transactions
    .filter((t) => t.userId === user?.id)
    .slice(-5)
    .reverse();

  function handleLogout() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Sair", "Deseja sair da sua conta?", [
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

  function handleSwitchMode() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (user?.role === "admin") {
      switchActiveMode("ADMIN");
      router.replace("/(admin)");
    } else {
      switchActiveMode("PROVIDER");
      router.replace("/(provider)/mural");
    }
  }

  const initials = user?.name
    ? user.name
        .trim()
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 20 : 10), borderBottomWidth: 1, borderBottomColor: colors.border + "30", backgroundColor: "#fff" }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerLogo, { fontFamily: "Inter_800ExtraBold", color: colors.primary }]}>Trampaí</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={[styles.iconBtn, { flexDirection: "row", width: "auto", paddingHorizontal: 12, gap: 6, backgroundColor: colors.primary + "10" }]} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={18} color={colors.primary} />
            <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 + insets.bottom }} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={[styles.profileHero, { backgroundColor: "#FFF" }]}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={pickAvatarImage} disabled={uploading}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={{ width: 90, height: 90, borderRadius: 45 }} contentFit="cover" />
              ) : (
                <Text style={[styles.avatarText, { color: "#FFF", fontFamily: "Inter_700Bold" }]}>{initials}</Text>
              )}
            </View>
            <View style={styles.editBadge}>
              {uploading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <MaterialCommunityIcons name="camera-plus" size={16} color="#FFF" />
              )}
            </View>
          </TouchableOpacity>
          <Text style={[styles.userName, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>{user?.name}</Text>
          <Text style={[styles.userEmail, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{user?.email}</Text>
          
          <View style={[styles.roleBadge, { backgroundColor: colors.primary + "10" }]}>
            <MaterialCommunityIcons name="account-check" size={14} color={colors.primary} />
            <Text style={[styles.roleText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Cliente Verificado</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.primaryAction, { backgroundColor: "#e8c08a" }]}
            onPress={() => router.push("/editar-perfil")}
          >
            <MaterialCommunityIcons name="account-edit" size={20} color={colors.primary} />
            <View>
              <Text style={[styles.actionText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Editar Perfil</Text>
              <Text style={{ color: colors.primary, fontSize: 11, opacity: 0.8 }}>Atualize seus dados</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.secondaryAction, { borderColor: colors.primary + "30" }]}
            onPress={handleSwitchMode}
          >
            <MaterialCommunityIcons name="shield-account" size={20} color={colors.primary} />
            <View>
              <Text style={[styles.actionText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                {user?.role === "admin" ? "Painel Admin" : "Ser Prestador"}
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Alternar visão</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* Credits Card */}
        <View style={styles.creditsCard}>
          <View style={[styles.creditsContent, { backgroundColor: "#FFF", borderColor: colors.border + "50" }]}>
            <View>
              <Text style={[styles.creditsLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Saldo de Créditos</Text>
              <Text style={[styles.creditsValue, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>{user?.creditBalance ?? 0} cr</Text>
            </View>
            <TouchableOpacity style={[styles.buyBtn, { backgroundColor: "#e8c08a" }]} onPress={() => router.push("/(client)")}>
              <Text style={[styles.buyBtnText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Comprar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: "#FFF" }]}>
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: colors.primary + "08" }]}>
              <MaterialCommunityIcons name="phone" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLab, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>WhatsApp</Text>
              <Text style={[styles.infoVal, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>{user?.phone || "Não informado"}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: colors.primary + "08" }]}>
              <MaterialCommunityIcons name="map-marker" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLab, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Cidade</Text>
              <Text style={[styles.infoVal, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>{user?.city || "Não informada"}</Text>
            </View>
          </View>
        </View>

        {/* Transactions Section */}
        {myTransactions.length > 0 && (
          <View style={[styles.transactionsSection, { backgroundColor: "#FFF" }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Últimas Transações</Text>
            </View>
            {myTransactions.map((tx, i) => (
              <View key={tx.id} style={styles.txRow}>
                <View style={[styles.txIcon, { backgroundColor: tx.credits > 0 ? colors.secondary + "15" : "#ef444415" }]}>
                  <MaterialCommunityIcons
                    name={tx.credits > 0 ? "arrow-down-left" : "arrow-up-right"}
                    size={16}
                    color={tx.credits > 0 ? colors.secondary : "#ef4444"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.txDesc, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>{tx.description}</Text>
                  <Text style={[styles.txDate, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{new Date(tx.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.txAmount, { color: tx.credits > 0 ? colors.secondary : "#ef4444", fontFamily: "Inter_700Bold" }]}>
                  {tx.credits > 0 ? "+" : ""}{tx.credits}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  profileHero: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0b1339",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    overflow: "hidden",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e8c08a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFF",
  },
  avatarText: {
    fontSize: 32,
  },
  userName: {
    fontSize: 24,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 15,
    marginBottom: 16,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 100,
  },
  roleText: {
    fontSize: 13,
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingRight: 40,
    gap: 12,
    marginBottom: 20,
  },
  primaryAction: {
    flexDirection: "row",
    height: 50,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    gap: 8,
    shadowColor: "#e8c08a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  secondaryAction: {
    flexDirection: "row",
    height: 50,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
  },
  actionText: {
    fontSize: 14,
  },
  creditsCard: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  creditsContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: "#0b1339",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  creditsLabel: {
    fontSize: 13,
    marginBottom: 2,
  },
  creditsValue: {
    fontSize: 32,
  },
  buyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
  },
  buyBtnText: {
    fontSize: 14,
  },
  infoSection: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    gap: 20,
    marginBottom: 24,
    shadowColor: "#0b1339",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLab: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoVal: {
    fontSize: 15,
  },
  transactionsSection: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    shadowColor: "#0b1339",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 12,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  txDesc: {
    fontSize: 14,
    marginBottom: 2,
  },
  txDate: {
    fontSize: 12,
  },
  txAmount: {
    fontSize: 16,
  },
});
