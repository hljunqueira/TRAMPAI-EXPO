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
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";

import { useAuth, API_BASE_URL } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function ProviderPerfil() {
  const colors = useColors();
  const { user, logout, leads, activeMode, switchActiveMode, fetchMyData } = useAuth();
  const insets = useSafeAreaInsets();

  const [bioModalVisible, setBioModalVisible] = React.useState(false);
  const [tempBio, setTempBio] = React.useState(user?.providerBio || "");
  const [savingBio, setSavingBio] = React.useState(false);

  const [portfolioModalVisible, setPortfolioModalVisible] = React.useState(false);
  const [boostModalVisible, setBoostModalVisible] = React.useState(false);
  const [premiumModalVisible, setPremiumModalVisible] = React.useState(false);

  const myLeads = leads.filter((l) => l.providerId === user?.id);
  const isVerified = user?.verificationStatus === "APPROVED" || user?.role === "admin";

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
      switchActiveMode("CLIENT");
      router.replace("/(client)");
    }
  }

  async function handleBoost() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBoostModalVisible(true);
  }

  async function confirmBoost() {
    setBoostModalVisible(false);
    try {
      const token = await SecureStore.getItemAsync("userToken");
      const response = await fetch(`${API_BASE_URL}/api/users/me/boost`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        Alert.alert("Sucesso!", "Seu perfil agora está em destaque.");
        fetchMyData();
      } else {
        Alert.alert("Erro", "Saldo insuficiente ou erro na requisição.");
      }
    } catch (e) {
      Alert.alert("Erro", "Não foi possível completar a ação.");
    }
  }

  async function handlePremium() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPremiumModalVisible(true);
  }

  async function confirmPremium() {
    setPremiumModalVisible(false);
    try {
      const token = await SecureStore.getItemAsync("userToken");
      const response = await fetch(`${API_BASE_URL}/api/users/me/premium`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        Alert.alert("Parabéns!", "Você agora é um profissional Premium.");
        fetchMyData();
      } else {
        Alert.alert("Erro", "Saldo insuficiente ou erro na requisição.");
      }
    } catch (e) {
      Alert.alert("Erro", "Não foi possível completar a ação.");
    }
  }

  async function saveBio() {
    setSavingBio(true);
    try {
      const token = await SecureStore.getItemAsync("userToken");
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ providerBio: tempBio }),
      });
      if (res.ok) {
        setBioModalVisible(false);
        fetchMyData();
      }
    } catch (e) {
      Alert.alert("Erro", "Falha ao salvar biografia.");
    } finally {
      setSavingBio(false);
    }
  }

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
      setSavingBio(true);
      try {
        const token = await SecureStore.getItemAsync("userToken");
        const uploadRes = await fetch(`${API_BASE_URL}/api/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ imageBase64: result.assets[0].base64, ext: "jpg" }),
        });
        if (!uploadRes.ok) throw new Error();
        const { url } = await uploadRes.json();
        const updateRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ avatarUrl: url }),
        });
        if (updateRes.ok) fetchMyData();
      } catch (e) {
        Alert.alert("Erro", "Falha ao atualizar foto.");
      } finally {
        setSavingBio(false);
      }
    }
  }

  async function pickPortfolioImage(isPaid = false) {
    const currentImages = user?.portfolioImages || [];
    if (!isPaid && currentImages.length >= 1 && !user?.hasUnlockedPortfolio) {
      Alert.alert("Limite Atingido", "Você já usou sua foto gratuita. Desbloqueie o pacote de 6 fotos por 5 créditos.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setSavingBio(true);
      try {
        const token = await SecureStore.getItemAsync("userToken");
        const uploadRes = await fetch(`${API_BASE_URL}/api/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ imageBase64: result.assets[0].base64, ext: "jpg" }),
        });
        const { url } = await uploadRes.json();

        const newImages = [...currentImages, url];
        const updateRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ portfolioImages: newImages }),
        });

        if (updateRes.ok) {
          setPortfolioModalVisible(false);
          fetchMyData();
        } else {
          const err = await updateRes.json();
          Alert.alert("Erro", err.error || "Erro ao salvar foto no portfólio.");
        }
      } catch (e) {
        Alert.alert("Erro", "Falha no processo de upload.");
      } finally {
        setSavingBio(false);
      }
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
        <View style={[styles.profileHero, { backgroundColor: "#FFF" }]}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={pickAvatarImage}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={{ width: 90, height: 90, borderRadius: 45 }} contentFit="cover" />
              ) : (
                <Text style={[styles.avatarText, { color: "#FFF", fontFamily: "Inter_700Bold" }]}>{getInitials(user?.name)}</Text>
              )}
            </View>
            <View style={[styles.editBadge, { backgroundColor: colors.secondary }]}>
              <MaterialCommunityIcons name="camera" size={16} color="#FFF" />
            </View>
            {isVerified && (
              <View style={[styles.verifiedBadge, { backgroundColor: colors.secondary }]}>
                <MaterialCommunityIcons name="check-bold" size={18} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>{user?.name}</Text>
              {user?.isPremium && (
                <View style={[styles.premiumBadge, { backgroundColor: colors.accent }]}>
                  <MaterialCommunityIcons name="crown" size={12} color={colors.navy} />
                  <Text style={[styles.premiumBadgeText, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>PREMIUM</Text>
                </View>
              )}
              <View style={[styles.ratingChip, { backgroundColor: colors.secondary + "15" }]}>
                <MaterialCommunityIcons name="star" size={12} color={colors.secondary} />
                <Text style={[styles.ratingText, { color: colors.secondary, fontFamily: "Inter_700Bold" }]}>{user?.rating || "5.0"}</Text>
              </View>
            </View>
            
            <Text style={[styles.userRole, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {user?.providerBio ? user.providerBio.substring(0, 80) + (user.providerBio.length > 80 ? "..." : "") : "Profissional de Serviços"}
            </Text>

            <View style={styles.chipsRow}>
              <View style={[styles.chip, { backgroundColor: colors.primary + "08" }]}>
                <MaterialCommunityIcons name="map-marker" size={12} color={colors.primary} />
                <Text style={[styles.chipText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>{user?.city || "Local não informado"}</Text>
              </View>
              <View style={[styles.chip, { backgroundColor: colors.primary + "08" }]}>
                <MaterialCommunityIcons name="shield-check" size={12} color={colors.primary} />
                <Text style={[styles.chipText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>{isVerified ? "Verificado" : "Pendente"}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.statsGrid, { backgroundColor: "#FFF" }]}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>{myLeads.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Serviços</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border + "40" }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>{user?.creditBalance ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Créditos</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border + "40" }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.secondary, fontFamily: "Inter_800ExtraBold" }]}>{user?.reviewCount || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Avaliações</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActions}>
          <TouchableOpacity style={[styles.primaryAction, { backgroundColor: "#e8c08a" }]} onPress={() => router.push("/editar-perfil")}>
            <MaterialCommunityIcons name="account-edit" size={20} color={colors.primary} />
            <View>
               <Text style={[styles.actionText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Editar Perfil</Text>
               <Text style={{ color: colors.primary, fontSize: 11, opacity: 0.8 }}>Atualize seus dados</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.secondaryAction, { borderColor: colors.primary + "30" }]} onPress={() => router.push("/(provider)/carteira")}>
            <MaterialCommunityIcons name="wallet" size={20} color={colors.primary} />
            <View>
               <Text style={[styles.actionText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Minha Carteira</Text>
               <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Comprar créditos</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.secondaryAction, { borderColor: colors.primary + "30" }]} onPress={handleSwitchMode}>
            <MaterialCommunityIcons name="shield-account" size={20} color={colors.primary} />
            <View>
               <Text style={[styles.actionText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                 {user?.role === "admin" ? "Painel Admin" : "Sou Cliente"}
               </Text>
               <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Alternar visão</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        <View style={[styles.sectionCard, { backgroundColor: colors.navy, borderColor: colors.accent, borderWidth: 1 }]}>
          <Text style={[styles.sectionTitle, { color: "#FFF", fontFamily: "Inter_700Bold" }]}>Crescimento e Destaque 🚀</Text>
          <Text style={[styles.sectionDesc, { color: "#ffffff90", fontFamily: "Inter_400Regular", marginBottom: 16 }]}>
            Aumente suas chances de fechar serviços aparecendo no topo.
          </Text>
          <View style={styles.growthActions}>
            <TouchableOpacity style={[styles.growthBtn, { backgroundColor: colors.accent }]} onPress={handleBoost}>
              <MaterialCommunityIcons name="rocket-launch" size={18} color={colors.navy} />
              <View>
                <Text style={[styles.growthBtnTitle, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>Impulsionar (24h)</Text>
                <Text style={[styles.growthBtnSub, { color: colors.navy + "80" }]}>5 créditos</Text>
              </View>
            </TouchableOpacity>

            {!user?.isPremium && (
              <TouchableOpacity style={[styles.growthBtn, { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.accent }]} onPress={handlePremium}>
                <MaterialCommunityIcons name="shield-crown" size={18} color={colors.accent} />
                <View>
                  <Text style={[styles.growthBtnTitle, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>Selo Premium</Text>
                  <Text style={[styles.growthBtnSub, { color: colors.accent + "80" }]}>20 créditos / mês</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: "#FFF" }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Sobre o Profissional</Text>
            <TouchableOpacity onPress={() => { setTempBio(user?.providerBio || ""); setBioModalVisible(true); }}>
               <Text style={[styles.seeAll, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Editar</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.sectionDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {user?.providerBio || "Você ainda não preencheu sua biografia. Complete seu perfil para passar mais confiança aos clientes."}
          </Text>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: "#FFF" }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Portfólio</Text>
            <TouchableOpacity onPress={() => setPortfolioModalVisible(true)}>
               <Text style={[styles.seeAll, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Adicionar</Text>
            </TouchableOpacity>
          </View>
          
          {user?.portfolioImages && user.portfolioImages.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {user.portfolioImages.map((img: string, idx: number) => (
                <Image key={idx} source={{ uri: img }} style={styles.portfolioImg} contentFit="cover" />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyPortfolio}>
              <MaterialCommunityIcons name="image-outline" size={32} color={colors.mutedForeground + "40"} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Nenhuma foto adicionada</Text>
            </View>
          )}
        </View>

        <View style={[styles.sectionCard, { backgroundColor: "#FFF", marginBottom: 32 }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Avaliações Recentes</Text>
          {user?.reviewCount ? <View style={styles.reviewCard} /> : (
            <View style={styles.emptyPortfolio}>
              <MaterialCommunityIcons name="star-outline" size={32} color={colors.mutedForeground + "40"} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Nenhuma avaliação recebida</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={bioModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: "#FFF" }]}>
            <Text style={[styles.modalTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Sobre o Profissional</Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>Conte aos clientes sobre sua experiência e diferenciais.</Text>
            <TextInput style={[styles.bioInput, { borderColor: colors.border, color: colors.primary }]} multiline value={tempBio} onChangeText={setTempBio} placeholder="Digite aqui sua biografia profissional..." />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setBioModalVisible(false)} disabled={savingBio}>
                <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirm, { backgroundColor: colors.secondary }]} onPress={saveBio} disabled={savingBio}>
                {savingBio ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: "#FFF", fontFamily: "Inter_700Bold" }}>Salvar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={portfolioModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: "#FFF" }]}>
            <Text style={[styles.modalTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Adicionar ao Portfólio</Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>Mostre seus melhores trabalhos para atrair mais clientes.</Text>
            <View style={styles.portfolioOptions}>
              <TouchableOpacity style={[styles.portOption, { borderColor: colors.border }]} onPress={() => pickPortfolioImage(false)}>
                <MaterialCommunityIcons name="image-plus" size={24} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.portOpTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Adicionar 1 foto</Text>
                  <Text style={[styles.portOpSub, { color: colors.secondary, fontFamily: "Inter_600SemiBold" }]}>Grátis</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.portOption, { borderColor: colors.accent, backgroundColor: "#e8c08a10" }]} onPress={() => pickPortfolioImage(true)}>
                <MaterialCommunityIcons name="image-multiple" size={24} color={colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.portOpTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Pacote 6 fotos</Text>
                  <Text style={[styles.portOpSub, { color: colors.accent, fontFamily: "Inter_600SemiBold" }]}>5 créditos</Text>
                </View>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.modalCancelFull} onPress={() => setPortfolioModalVisible(false)}>
              <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={boostModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: "#FFF", alignItems: "center" }]}>
            <View style={[styles.modalIconBox, { backgroundColor: colors.accent + "20" }]}>
              <MaterialCommunityIcons name="rocket-launch" size={32} color={colors.accent} />
            </View>
            <Text style={[styles.modalTitleCenter, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>Impulsionar Perfil</Text>
            <Text style={[styles.modalSubCenter, { color: colors.mutedForeground }]}>Você aparecerá no topo do mural para todos os clientes por 24 horas.</Text>
            <View style={[styles.priceTag, { backgroundColor: colors.navy + "10" }]}>
              <Text style={[styles.priceTagText, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>Custo: 5 créditos</Text>
            </View>
            <View style={styles.modalActionsFull}>
              <TouchableOpacity style={[styles.modalBtnFull, { backgroundColor: colors.accent }]} onPress={confirmBoost}>
                <Text style={{ color: colors.navy, fontFamily: "Inter_700Bold", fontSize: 16 }}>Confirmar Impulso</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCancelFull} onPress={() => setBoostModalVisible(false)}>
                <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={premiumModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: "#FFF", alignItems: "center" }]}>
            <View style={[styles.modalIconBox, { backgroundColor: colors.accent + "20" }]}>
              <MaterialCommunityIcons name="shield-crown" size={32} color={colors.accent} />
            </View>
            <Text style={[styles.modalTitleCenter, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>Selo Premium</Text>
            <Text style={[styles.modalSubCenter, { color: colors.mutedForeground }]}>Acesso antecipado aos serviços e selo de confiança dourado no seu perfil.</Text>
            <View style={[styles.priceTag, { backgroundColor: colors.navy + "10" }]}>
              <Text style={[styles.priceTagText, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>Custo: 20 créditos / mês</Text>
            </View>
            <View style={styles.modalActionsFull}>
              <TouchableOpacity style={[styles.modalBtnFull, { backgroundColor: colors.navy }]} onPress={confirmPremium}>
                <Text style={{ color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 16 }}>Assinar Agora</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCancelFull} onPress={() => setPremiumModalVisible(false)}>
                <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
  headerLeft: { flex: 1 },
  headerLogo: { fontSize: 22, letterSpacing: -1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  profileHero: { alignItems: "center", paddingTop: 24, paddingBottom: 20, paddingHorizontal: 20 },
  avatarWrapper: { position: "relative", marginBottom: 16 },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center", shadowColor: "#0b1339", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4, overflow: "hidden" },
  avatarText: { fontSize: 32 },
  editBadge: { position: "absolute", bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#FFF" },
  verifiedBadge: { position: "absolute", bottom: 0, left: 0, width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#FFF" },
  headerInfo: { alignItems: "center", width: "100%" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  userName: { fontSize: 22 },
  ratingChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  ratingText: { fontSize: 13 },
  userRole: { fontSize: 14, textAlign: "center", marginBottom: 16, paddingHorizontal: 20 },
  chipsRow: { flexDirection: "row", gap: 10 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  chipText: { fontSize: 12 },
  quickActions: { flexDirection: "row", paddingHorizontal: 20, paddingRight: 40, gap: 12, marginBottom: 20 },
  primaryAction: { flexDirection: "row", height: 50, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", borderRadius: 16, gap: 8, shadowColor: "#e8c08a", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  secondaryAction: { flexDirection: "row", height: 50, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", borderRadius: 16, borderWidth: 1.5, gap: 8 },
  actionText: { fontSize: 14 },
  statsGrid: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, padding: 20, borderRadius: 24, marginBottom: 20, shadowColor: "#0b1339", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  statBox: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 20, marginBottom: 2 },
  statLabel: { fontSize: 11 },
  statDivider: { width: 1, height: 24 },
  sectionCard: { marginHorizontal: 20, borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: "#0b1339", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 16, marginBottom: 8 },
  sectionDesc: { fontSize: 13, lineHeight: 20 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  seeAll: { fontSize: 12 },
  portfolioImg: { width: 100, height: 100, borderRadius: 12 },
  emptyPortfolio: { alignItems: "center", justifyContent: "center", paddingVertical: 24, borderWidth: 1, borderColor: "#00000008", borderRadius: 16, backgroundColor: "#FDFBF7", gap: 8 },
  emptyText: { fontSize: 13 },
  reviewCard: { gap: 12 },
  growthActions: { gap: 12 },
  growthBtn: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16, gap: 12 },
  growthBtnTitle: { fontSize: 15 },
  growthBtnSub: { fontSize: 11 },
  premiumBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  premiumBadgeText: { fontSize: 10 },
  modalOverlay: { flex: 1, backgroundColor: "#00000080", justifyContent: "flex-end" },
  modalContent: { padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 40 },
  modalTitle: { fontSize: 20, marginBottom: 8 },
  modalSub: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
  bioInput: { borderWidth: 1.5, borderRadius: 12, padding: 16, height: 120, textAlignVertical: "top", fontSize: 15, marginBottom: 20 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  modalCancel: { paddingHorizontal: 20, paddingVertical: 12, justifyContent: "center" },
  modalConfirm: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, justifyContent: "center" },
  portfolioOptions: { gap: 12, marginBottom: 20 },
  portOption: { flexDirection: "row", alignItems: "center", padding: 16, borderWidth: 1.5, borderRadius: 16, gap: 16 },
  portOpTitle: { fontSize: 16, marginBottom: 2 },
  portOpSub: { fontSize: 14 },
  modalIconBox: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  modalTitleCenter: { fontSize: 22, textAlign: "center", marginBottom: 8 },
  modalSubCenter: { fontSize: 14, textAlign: "center", marginBottom: 20, lineHeight: 22 },
  priceTag: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, marginBottom: 24 },
  priceTagText: { fontSize: 14 },
  modalActionsFull: { width: "100%", gap: 12 },
  modalBtnFull: { width: "100%", height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  modalCancelFull: { width: "100%", height: 50, alignItems: "center", justifyContent: "center" },
});
