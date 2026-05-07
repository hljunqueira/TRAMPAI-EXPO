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
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  KeyboardAvoidingView,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import * as ImagePicker from "expo-image-picker";

import { useAuth, API_BASE_URL } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useImageUpload } from "@/hooks/useImageUpload";

// Componentes do Perfil
import { PortfolioSection } from "@/components/profile/PortfolioSection";
import { VerificationSection } from "@/components/profile/VerificationSection";
import { ReferralSection } from "@/components/profile/ReferralSection";
import { ReviewsSection } from "@/components/profile/ReviewsSection";

export default function ProviderPerfil() {
  const colors = useColors();
  const { user, logout, leads, reviews, activeMode, switchActiveMode, fetchMyData, api, appConfig } = useAuth();
  const insets = useSafeAreaInsets();
  const { uploading: isUploading, pickImage, takePhoto } = useImageUpload();

  const [bioModalVisible, setBioModalVisible] = React.useState(false);
  const [tempBio, setTempBio] = React.useState(user?.providerBio || "");
  const [savingBio, setSavingBio] = React.useState(false);

  const [portfolioModalVisible, setPortfolioModalVisible] = React.useState(false);
  const [boostModalVisible, setBoostModalVisible] = React.useState(false);
  const [premiumModalVisible, setPremiumModalVisible] = React.useState(false);
  const [verificationModalVisible, setVerificationModalVisible] = React.useState(false);
  const [descModalVisible, setDescModalVisible] = React.useState(false);
  const [tempPortfolioDesc, setTempPortfolioDesc] = React.useState("");
  const [pendingImageUrl, setPendingImageUrl] = React.useState("");
  const [isPaidUpload, setIsPaidUpload] = React.useState(false);

  const [localDoc, setLocalDoc] = React.useState<{uri: string, base64: string} | null>(null);
  const [localSelfie, setLocalSelfie] = React.useState<{uri: string, base64: string} | null>(null);
  const [isSubmittingVerification, setIsSubmittingVerification] = React.useState(false);

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

  async function shareReferral() {
    try {
      const code = user?.referralCode || "TRAMPAI26";
      const referralLink = `https://trampai.com.br?ref=${code}`;
      const message = `Ei! Use meu código *${code}* no Trampaí para ganhar ${appConfig?.REFERRAL_BONUS || 10} créditos de bônus e oferecer seus serviços para milhares de clientes! 🚀\n\nBaixe agora: ${referralLink}`;
      
      const result = await Share.share({
        message,
        url: referralLink, // iOS usa url separado
        title: "Convite Trampaí",
      });

      if (result.action === Share.sharedAction) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function handleBoost() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBoostModalVisible(true);
  }



  async function handlePremium() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPremiumModalVisible(true);
  }



  async function saveBio() {
    setSavingBio(true);
    try {
      const res = await api.patch("/auth/me", { providerBio: tempBio });
      if (res.ok) {
        setBioModalVisible(false);
        Alert.alert("Sucesso", "Biografia profissional atualizada com sucesso!");
        await fetchMyData();
      } else {
        Alert.alert("Erro", "Erro ao salvar biografia.");
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
        { text: "Câmera", onPress: async () => {
          const url = await takePhoto();
          if (url) updateAvatar(url);
        }},
        { text: "Galeria", onPress: async () => {
          const url = await pickImage();
          if (url) updateAvatar(url);
        }},
        { text: "Cancelar", style: "cancel" },
      ]
    );
  }

  async function updateAvatar(url: string) {
    try {
      await api.patch("/auth/me", { avatarUrl: url });
      fetchMyData();
    } catch (e) {
      Alert.alert("Erro", "Falha ao atualizar foto de perfil.");
    }
  }

  async function pickPortfolioImage(isPaid = false) {
    const currentImages = user?.portfolioImages || [];
    const cost = parseInt(appConfig?.PORTFOLIO_COST || "5");
    if (isPaid) {
      if ((user?.creditBalance || 0) < cost) {
        Alert.alert("Créditos Insuficientes", `Você precisa de ${cost} créditos para desbloquear o pacote de 6 fotos.`);
        return;
      }
    }

    if (!isPaid && currentImages.length >= 1 && !user?.hasUnlockedPortfolio) {
      Alert.alert("Limite Atingido", `Você já usou sua foto gratuita. Desbloqueie o pacote de 6 fotos por ${cost} créditos.`);
      return;
    }

    const url = await pickImage({ aspect: [4, 3], quality: 0.6 });
    if (url) {
      setPendingImageUrl(url);
      setIsPaidUpload(isPaid);
      setPortfolioModalVisible(false);
      setDescModalVisible(true);
    }
  }

  async function pickVerificationImage(field: 'documentUrl' | 'selfieUrl', type: "camera" | "gallery") {
    let result;
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: field === 'selfieUrl' ? [1, 1] : [4, 3],
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
      const imageData = { uri: result.assets[0].uri, base64: result.assets[0].base64 };
      if (field === 'documentUrl') setLocalDoc(imageData);
      else setLocalSelfie(imageData);
    }
  }

  async function submitVerification() {
    if (!localDoc || !localSelfie) {
      Alert.alert("Atenção", "Você precisa selecionar as duas fotos para continuar.");
      return;
    }

    setIsSubmittingVerification(true);
    try {
      const updateRes = await api.patch("/auth/me", { 
        documentUrl: localDoc.uri, 
        selfieUrl: localSelfie.uri, 
        verificationStatus: 'PENDING' 
      });
      
      if (updateRes.ok) {
        Alert.alert("Sucesso", "Documentos enviados para análise!");
        setVerificationModalVisible(false);
        setLocalDoc(null);
        setLocalSelfie(null);
        fetchMyData();
      }
    } catch (e) {
      Alert.alert("Erro", "Falha ao enviar documentos.");
    } finally {
      setIsSubmittingVerification(false);
    }
  }

  async function savePortfolioItem() {
    setSavingBio(true);
    try {
      const currentImages = user?.portfolioImages || [];
      const newItem = { url: pendingImageUrl, description: tempPortfolioDesc };
      const normalizedImages = currentImages.map(img => typeof img === 'string' ? { url: img, description: "" } : img);
      const newImages = [...normalizedImages, newItem];

      await api.patch("/auth/me", { portfolioImages: newImages });

      setDescModalVisible(false);
      setTempPortfolioDesc("");
      setPendingImageUrl("");
      fetchMyData();
    } catch (e: any) {
      Alert.alert("Erro", "Falha ao salvar portfólio.");
    } finally {
      setSavingBio(false);
    }
  }

  async function confirmBoost() {
    const cost = parseInt(appConfig?.BOOST_COST || "5");
    if ((user?.creditBalance || 0) < cost) {
      Alert.alert("Créditos Insuficientes", `Você precisa de ${cost} créditos para impulsionar seu perfil.`);
      return;
    }

    try {
      const res = await api.post("/admin/boost", { userId: user?.id });
      if (res.ok) {
        Alert.alert("Sucesso", "Perfil impulsionado com sucesso!");
        setBoostModalVisible(false);
        fetchMyData();
      }
    } catch (e) {
      Alert.alert("Erro", "Falha na conexão.");
    }
  }

  async function confirmPremium() {
    const cost = parseInt(appConfig?.PREMIUM_COST || "20");
    if ((user?.creditBalance || 0) < cost) {
      Alert.alert("Créditos Insuficientes", `Você precisa de ${cost} créditos para assinar o plano premium.`);
      return;
    }

    try {
      const res = await api.post("/admin/premium", { userId: user?.id });
      if (res.ok) {
        Alert.alert("Sucesso", "Assinatura Premium ativada!");
        setPremiumModalVisible(false);
        fetchMyData();
      }
    } catch (e) {
      Alert.alert("Erro", "Falha na conexão.");
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
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 20 : 10), borderBottomWidth: 1, borderBottomColor: colors.border + "30", backgroundColor: colors.background }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerLogo, { fontFamily: "Inter_800ExtraBold", color: colors.primary }]}>Perfil</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={handleSwitchMode} 
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              gap: 6, 
              backgroundColor: colors.primary + "08",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 100,
              borderWidth: 1,
              borderColor: colors.primary + "10"
            }}
          >
            <MaterialCommunityIcons name="swap-horizontal" size={16} color={colors.primary} />
            <Text style={{ color: colors.primary, fontFamily: "Inter_700Bold", fontSize: 12 }}>
              {user?.role === "admin" ? "Modo Admin" : "Modo Cliente"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileHero, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={pickAvatarImage}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={{ width: 90, height: 90, borderRadius: 45 }} contentFit="cover" />
              ) : (
                <Text style={[styles.avatarText, { color: colors.card, fontFamily: "Inter_700Bold" }]}>{getInitials(user?.name)}</Text>
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
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.userName, { color: colors.primary, fontFamily: "Inter_800ExtraBold", textAlign: 'center' }]}>{user?.name}</Text>
              <View style={[styles.badgesRowBelow, { marginTop: 4 }]}>
                {(!user?.reviewCount || user.reviewCount === 0) && (
                  <View style={[styles.ratingChip, { backgroundColor: colors.secondary + "15" }]}>
                    <MaterialCommunityIcons name="leaf" size={12} color={colors.secondary} />
                    <Text style={[styles.ratingText, { color: colors.secondary, fontFamily: "Inter_700Bold" }]}>Novo</Text>
                  </View>
                )}
                {user?.isPremium && (
                  <View style={[styles.premiumBadge, { backgroundColor: colors.accent }]}>
                    <MaterialCommunityIcons name="crown" size={12} color={colors.navy} />
                    <Text style={[styles.premiumBadgeText, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>PREMIUM</Text>
                  </View>
                )}
                {user?.reviewCount ? user.reviewCount > 0 && (
                  <View style={[styles.ratingChip, { backgroundColor: colors.secondary + "15" }]}>
                    <MaterialCommunityIcons name="star" size={12} color={colors.secondary} />
                    <Text style={[styles.ratingText, { color: colors.secondary, fontFamily: "Inter_700Bold" }]}>{String(user.rating || "0.0")}</Text>
                  </View>
                ) : null}
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

        <View style={[styles.statsGrid, { backgroundColor: colors.card }]}>
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

        <VerificationSection 
          status={user?.verificationStatus as any}
          onPress={() => setVerificationModalVisible(true)}
        />

        <View style={styles.quickActionsVertical}>
          <TouchableOpacity style={[styles.primaryActionFull, { backgroundColor: "#e8c08a" }]} onPress={() => router.push("/editar-perfil")}>
            <MaterialCommunityIcons name="account-edit" size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
               <Text style={[styles.actionText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Editar Perfil</Text>
               <Text style={{ color: colors.primary, fontSize: 11, opacity: 0.8 }}>Atualize seus dados pessoais e contato</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.primary + "40"} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.secondaryActionFull, { borderColor: colors.primary + "15", backgroundColor: "#fff" }]} onPress={() => router.push("/(provider)/carteira")}>
            <MaterialCommunityIcons name="wallet" size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
               <Text style={[styles.actionText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Minha Carteira</Text>
               <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Saldo de créditos: {user?.creditBalance || 0}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.primary + "40"} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.outlineActionFull, { borderColor: colors.primary + "15", backgroundColor: "#fff" }]} onPress={handleSwitchMode}>
            <MaterialCommunityIcons name="swap-horizontal" size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
               <Text style={[styles.actionText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                 {user?.role === "admin" ? "Painel Admin" : "Sou Cliente"}
               </Text>
               <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Alternar visão do aplicativo</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.primary + "40"} />
          </TouchableOpacity>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
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

        <PortfolioSection 
          portfolioImages={user?.portfolioImages || []}
          hasUnlockedPortfolio={user?.hasUnlockedPortfolio}
          onAddPress={() => setPortfolioModalVisible(true)}
          stylesOverride={{
            emptyPortfolio: { borderColor: colors.border + "40", backgroundColor: colors.card + "50" },
            emptyText: { color: colors.mutedForeground }
          }}
        />


        <ReferralSection 
          referralCode={user?.referralCode || ""}
          bonus={appConfig?.REFERRAL_BONUS || "10"}
          onShare={shareReferral}
        />

        <ReviewsSection 
          reviews={reviews}
          reviewCount={user?.reviewCount}
        />

        <TouchableOpacity 
          style={[styles.logoutBtnFull, { backgroundColor: "#fee2e2", borderColor: "#fecaca", borderWidth: 1 }]} 
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="logout" size={22} color="#dc2626" />
          <Text style={[styles.logoutBtnText, { color: "#dc2626", fontFamily: "Inter_700Bold" }]}>Encerrar Sessão</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={bioModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Sobre o Profissional</Text>
              <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>Conte aos clientes sobre sua experiência e diferenciais.</Text>
              <TextInput style={[styles.bioInput, { borderColor: colors.border, color: colors.primary }]} multiline value={tempBio} onChangeText={setTempBio} placeholder="Digite aqui sua biografia profissional..." />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setBioModalVisible(false)} disabled={savingBio}>
                  <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalConfirm, { backgroundColor: colors.secondary }]} onPress={saveBio} disabled={savingBio}>
                  {savingBio ? <ActivityIndicator color={colors.card} /> : <Text style={{ color: colors.card, fontFamily: "Inter_700Bold" }}>Salvar</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={portfolioModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
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

      <Modal visible={descModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ width: "100%" }}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>Legenda da Foto</Text>
              <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>Adicione uma breve descrição para este trabalho em seu portfólio.</Text>
              
              <TextInput
                style={[styles.bioInput, { borderColor: colors.border, height: 80 }]}
                value={tempPortfolioDesc}
                onChangeText={setTempPortfolioDesc}
                placeholder="Ex: Reforma de quadro elétrico em condomínio..."
                multiline
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => { setDescModalVisible(false); setPendingImageUrl(""); }}>
                  <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalConfirm, { backgroundColor: colors.navy }]} onPress={savePortfolioItem} disabled={savingBio}>
                  {savingBio ? <ActivityIndicator color={colors.card} /> : <Text style={{ color: colors.card, fontFamily: "Inter_700Bold" }}>Salvar no Portfólio</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={boostModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, alignItems: "center" }]}>
            <View style={[styles.modalIconBox, { backgroundColor: colors.accent + "20" }]}>
              <MaterialCommunityIcons name="rocket-launch" size={32} color={colors.accent} />
            </View>
            <Text style={[styles.modalTitleCenter, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>Impulsionar Perfil</Text>
            <Text style={[styles.modalSubCenter, { color: colors.mutedForeground }]}>Você aparecerá no topo do mural para todos os clientes por 24 horas.</Text>
            <View style={[styles.priceTag, { backgroundColor: colors.navy + "10" }]}>
              <Text style={[styles.priceTagText, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>Custo: {appConfig?.BOOST_COST || "5"} créditos</Text>
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
          <View style={[styles.modalContent, { backgroundColor: colors.card, alignItems: "center" }]}>
            <View style={[styles.modalIconBox, { backgroundColor: colors.accent + "20" }]}>
              <MaterialCommunityIcons name="shield-crown" size={32} color={colors.accent} />
            </View>
            <Text style={[styles.modalTitleCenter, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>Selo Premium</Text>
            <Text style={[styles.modalSubCenter, { color: colors.mutedForeground }]}>Acesso antecipado aos serviços e selo de confiança dourado no seu perfil.</Text>
            <View style={[styles.priceTag, { backgroundColor: colors.navy + "10" }]}>
              <Text style={[styles.priceTagText, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>Custo: {appConfig?.PREMIUM_COST || "20"} créditos / mês</Text>
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

      <Modal visible={verificationModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>Verificar Identidade</Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>Precisamos de uma foto do seu documento (RG ou CNH) e uma selfie segurando o documento para sua segurança.</Text>
            
            <View style={styles.uploadRow}>
              <TouchableOpacity 
                style={[styles.uploadBox, { backgroundColor: colors.card, borderColor: colors.border }, localDoc ? { borderColor: colors.secondary, borderStyle: 'solid' } : {}]} 
                onPress={() => pickVerificationImage('documentUrl', 'gallery')}
              >
                {localDoc ? (
                  <Image source={{ uri: localDoc.uri }} style={{ width: '100%', height: '100%', borderRadius: 18 }} contentFit="cover" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="card-account-details-outline" size={32} color={colors.mutedForeground} />
                    <Text style={[styles.uploadLabel, { color: colors.primary }]}>Foto do RG</Text>
                  </>
                )}
                {localDoc && (
                   <View style={[styles.checkBadge, { backgroundColor: colors.secondary }]}>
                     <MaterialCommunityIcons name="check" size={12} color="#FFF" />
                   </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.uploadBox, { backgroundColor: colors.card, borderColor: colors.border }, localSelfie ? { borderColor: colors.secondary, borderStyle: 'solid' } : {}]} 
                onPress={() => pickVerificationImage('selfieUrl', 'camera')}
              >
                {localSelfie ? (
                  <Image source={{ uri: localSelfie.uri }} style={{ width: '100%', height: '100%', borderRadius: 18 }} contentFit="cover" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="camera-account" size={32} color={colors.mutedForeground} />
                    <Text style={[styles.uploadLabel, { color: colors.primary }]}>Sua Selfie</Text>
                  </>
                )}
                {localSelfie && (
                   <View style={[styles.checkBadge, { backgroundColor: colors.secondary }]}>
                     <MaterialCommunityIcons name="check" size={12} color="#FFF" />
                   </View>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[
                styles.modalBtnFull, 
                { backgroundColor: (localDoc && localSelfie) ? colors.navy : colors.border, marginTop: 24 }
              ]} 
              onPress={submitVerification}
              disabled={!localDoc || !localSelfie || isSubmittingVerification}
            >
              {isSubmittingVerification ? (
                <ActivityIndicator color={colors.card} />
              ) : (
                <Text style={{ color: colors.card, fontFamily: "Inter_700Bold", fontSize: 16 }}>
                  Enviar Documentos
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setVerificationModalVisible(false)} 
              style={styles.modalCancelFull}
              disabled={isSubmittingVerification}
            >
              <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }}>Cancelar</Text>
            </TouchableOpacity>
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
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6, paddingHorizontal: 10 },
  badgesRowBelow: { flexDirection: "row", alignItems: "center", gap: 8 },
  userName: { fontSize: 22 },
  ratingChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100 },
  ratingText: { fontSize: 13 },
  userRole: { fontSize: 14, textAlign: "center", marginBottom: 16, paddingHorizontal: 20 },
  chipsRow: { flexDirection: "row", gap: 10 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  chipText: { fontSize: 12 },
  statDivider: { width: 1, height: 24 },
  statsGrid: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, padding: 20, borderRadius: 24, marginBottom: 20, shadowColor: "#0b1339", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  statBox: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 20, marginBottom: 2 },
  statLabel: { fontSize: 11 },
  actionText: { fontSize: 15 },
  quickActionsVertical: { paddingHorizontal: 20, gap: 12, marginBottom: 24 },
  primaryActionFull: { flexDirection: "row", padding: 16, alignItems: "center", borderRadius: 20, gap: 16, shadowColor: "#e8c08a", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 3 },
  secondaryActionFull: { flexDirection: "row", padding: 16, alignItems: "center", borderRadius: 20, borderWidth: 1.5, gap: 16 },
  outlineActionFull: { flexDirection: "row", padding: 16, alignItems: "center", borderRadius: 20, borderWidth: 1.5, gap: 16 },
  sectionCard: { marginHorizontal: 20, borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: "#0b1339", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 16, marginBottom: 8 },
  sectionDesc: { fontSize: 13, lineHeight: 20 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  seeAll: { fontSize: 12 },
  portfolioImg: { width: 100, height: 100, borderRadius: 12 },
  emptyPortfolio: { 
    alignItems: "center", 
    justifyContent: "center", 
    paddingVertical: 24, 
    borderWidth: 1, 
    borderRadius: 16, 
    gap: 8 
  },
  emptyText: { fontSize: 13 },
  reviewCard: { gap: 16 },
  reviewItem: { borderBottomWidth: 1, borderBottomColor: "#00000008", paddingBottom: 16 },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  reviewerAvatar: { width: 32, height: 32, borderRadius: 16 },
  reviewerName: { fontSize: 14 },
  starsRow: { flexDirection: "row", gap: 2 },
  reviewDate: { fontSize: 11 },
  reviewComment: { fontSize: 13, lineHeight: 18 },
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
  logoutBtnFull: { 
    marginHorizontal: 20, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    padding: 16, 
    borderRadius: 20, 
    gap: 12, 
    marginBottom: 40 
  },
  logoutBtnText: { fontSize: 16 },
  uploadRow: { flexDirection: "row", gap: 16 },
  uploadBox: { 
    flex: 1, 
    height: 140, 
    borderRadius: 20, 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 12, 
    borderStyle: "dashed", 
    borderWidth: 2, 
    overflow: 'hidden'
  },
  uploadLabel: { fontSize: 11, textAlign: "center", paddingHorizontal: 8 },
  checkBadge: { 
    position: 'absolute', 
    top: 10, 
    right: 10, 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 2, 
    borderColor: '#FFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3
  },
});
