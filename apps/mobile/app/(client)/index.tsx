import * as SecureStore from "expo-secure-store";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Share,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth, API_BASE_URL } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function ClientDashboard() {
  const colors = useColors();
  const { user, services, activeMode, switchActiveMode, fetchMyData } = useAuth();
  const insets = useSafeAreaInsets();
  const [unreadCount, setUnreadCount] = React.useState(0);

  const getInitials = (name?: string) => {
    if (!name) return "??";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  useFocusEffect(
    React.useCallback(() => {
      checkNotifications();
    }, [])
  );

  async function checkNotifications() {
    try {
      const token = await SecureStore.getItemAsync("trampai_auth_token");
      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.filter((n: any) => !n.read).length);
      }
    } catch (e) {}
  }

  const myServices = services.filter((s) => s.clientId === user?.id);
  const openServices = myServices.filter((s) => s.status === "open");
  const closedServices = myServices.filter((s) => s.status === "completed");

  async function handleRespondExclusive(jobId: string, action: 'ACCEPT' | 'DECLINE') {
    try {
      const token = await SecureStore.getItemAsync("trampai_auth_token");
      // Usar fetch direto para simplicidade ou o api-client se disponível
      const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/respond-exclusive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        // Recarregar os serviços
        await fetchMyData();
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 20 : 10), borderBottomWidth: 1, borderBottomColor: colors.border + "30", backgroundColor: "#fff" }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerLogo, { fontFamily: "Inter_800ExtraBold", color: colors.primary }]}>Trampaí</Text>
        </View>
        
        <View style={styles.headerRight}>
          {user?.role === "admin" && (
            <TouchableOpacity
              style={[styles.switchModeBtn, { borderColor: colors.primary + "30" }]}
              onPress={() => {
                switchActiveMode("PROVIDER");
                router.replace("/(provider)/mural");
              }}
            >
              <MaterialCommunityIcons name="swap-horizontal" size={18} color={colors.primary} />
              <Text style={[styles.switchModeText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Cliente</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.iconBtn}
            onPress={() => router.push("/notificacoes")}
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color={colors.primary} />
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.accent }]} />
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.initialsAvatar, { backgroundColor: colors.primary, overflow: 'hidden' }]}
            onPress={() => router.push("/(client)/perfil")}
          >
            {user?.avatarUrl ? (
              <Image 
                source={{ uri: user.avatarUrl }} 
                style={{ width: '100%', height: '100%' }} 
                resizeMode="cover"
              />
            ) : (
              <Text style={[styles.initialsText, { color: "#FFF", fontFamily: "Inter_700Bold" }]}>
                {getInitials(user?.name)}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Text style={[styles.greeting, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Olá, {user?.name?.split(" ")[0]} 👋</Text>
          <Text style={[styles.title, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Meu Painel</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: "#FFF", borderColor: colors.border + "30" }]}>
            <Text style={[styles.statNumber, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>{openServices.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>Abertos</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#FFF", borderColor: colors.border + "30" }]}>
            <Text style={[styles.statNumber, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>{closedServices.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>Concluídos</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#FFF", borderColor: colors.border + "30" }]}>
            <Text style={[styles.statNumber, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>{myServices.reduce((sum, s) => sum + s.unlockedByProviders.length, 0)}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>Interesses</Text>
          </View>
        </View>

        {/* Quick Categories */}
        <View style={styles.categoriesSection}>
          <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold", marginBottom: 12 }]}>Do que você precisa?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            {[
              { id: '1', name: 'Limpeza', icon: 'broom' },
              { id: '2', name: 'Elétrica', icon: 'flash' },
              { id: '3', name: 'Reforma', icon: 'hammer-wrench' },
              { id: '4', name: 'Pintura', icon: 'format-paint' },
              { id: '5', name: 'Mecânico', icon: 'car-wrench' },
              { id: '6', name: 'Mudança', icon: 'truck-delivery' },
            ].map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                style={[styles.categoryCard, { backgroundColor: "#FFF" }]}
                onPress={() => router.push({ pathname: "/(client)/novo-servico", params: { category: cat.name } })}
              >
                <View style={[styles.categoryIcon, { backgroundColor: colors.primary + "08" }]}>
                  <MaterialCommunityIcons name={cat.icon as any} size={24} color={colors.primary} />
                </View>
                <Text style={[styles.categoryName, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>



        <TouchableOpacity
          style={[styles.ctaCard, { backgroundColor: "#e8c08a", borderRadius: 20 }]}
          onPress={() => router.push("/(client)/novo-servico")}
          activeOpacity={0.9}
        >
          <View style={styles.ctaContent}>
            <View style={[styles.ctaIcon, { backgroundColor: "#FFF" }]}>
              <MaterialCommunityIcons name="plus" size={24} color={colors.primary} />
            </View>
            <View style={styles.ctaTextBlock}>
              <Text style={[styles.ctaTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Postar novo serviço</Text>
              <Text style={[styles.ctaSub, { color: colors.primary + "90", fontFamily: "Inter_500Medium" }]}>Receba propostas em minutos</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Serviços recentes</Text>
          {openServices.length > 0 && (
            <TouchableOpacity onPress={() => router.push("/(client)/meus-servicos")}>
              <Text style={[styles.seeAllText, { color: colors.accent, fontFamily: "Inter_600SemiBold" }]}>Ver todos</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Solicitações Exclusivas Pendentes */}
        {myServices.some(s => s.status === 'exclusive_pending') && (
          <View style={styles.exclusiveSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.exclusiveTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Solicitações Exclusivas 💎</Text>
            </View>
            <Text style={[styles.exclusiveSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Profissionais querem te atender com exclusividade. Aprove o perfil para liberar o contato.
            </Text>
            
            {myServices.filter(s => s.status === 'exclusive_pending').map(s => (
              <View key={s.id} style={[styles.exclusiveCard, { backgroundColor: colors.navy + "05", borderColor: colors.navy + "20" }]}>
                <View style={styles.exclusiveHeader}>
                  <Text style={[styles.exclusiveJobTitle, { color: colors.navy, fontFamily: "Inter_600SemiBold" }]}>{s.title}</Text>
                  <View style={[styles.exclusiveBadge, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.badgeText, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>EXCLUSIVO</Text>
                  </View>
                </View>
                
                <View style={styles.exclusiveActions}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: colors.navy }]}
                    onPress={() => handleRespondExclusive(s.id, 'ACCEPT')}
                  >
                    <Text style={[styles.actionBtnText, { color: "#FFF", fontFamily: "Inter_600SemiBold" }]}>Aceitar Profissional</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border }]}
                    onPress={() => handleRespondExclusive(s.id, 'DECLINE')}
                  >
                    <Text style={[styles.actionBtnText, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>Recusar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {openServices.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: "#FFF", borderRadius: 20 }]}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Nada por aqui ainda</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Poste seu primeiro serviço e deixe que os profissionais encontrem você.
            </Text>
          </View>
        ) : (
          <View style={styles.serviceList}>
            {openServices.slice(0, 3).map((s) => (
              <TouchableOpacity 
                key={s.id} 
                style={[styles.serviceCard, { backgroundColor: "#FFF", borderRadius: 16 }]}
                onPress={() => router.push("/(client)/meus-servicos")}
              >
                <View style={styles.serviceInfo}>
                  <Text style={[styles.serviceTitle, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
                    {s.title}
                  </Text>
                  <Text style={[styles.serviceCategory, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                    {s.category.name}
                  </Text>
                </View>
                <View style={[styles.interestBadge, { backgroundColor: colors.secondary + "10" }]}>
                  <MaterialCommunityIcons name="account-group" size={14} color={colors.secondary} />
                  <Text style={[styles.interestCount, { color: colors.secondary, fontFamily: "Inter_700Bold" }]}>
                    {s.unlockedByProviders.length}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={[styles.tipCard, { backgroundColor: colors.primary + "05", borderRadius: 16 }]}>
          <View style={[styles.tipIcon, { backgroundColor: colors.primary + "10" }]}>
            <MaterialCommunityIcons name="lightbulb-on" size={20} color={colors.primary} />
          </View>
          <Text style={[styles.tipText, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>
            <Text style={{ fontFamily: "Inter_700Bold" }}>Dica: </Text>
            Adicione fotos reais do que precisa ser feito para atrair melhores profissionais.
          </Text>
        </View>
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
  switchModeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  switchModeText: {
    fontSize: 12,
  },
  scrollView: { flex: 1 },
  content: { padding: 20, gap: 24 },
  heroSection: {
    marginBottom: 8,
  },
  greeting: {
    fontSize: 15,
    marginBottom: 2,
  },
  title: {
    fontSize: 28,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 22,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ctaCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    justifyContent: "space-between",
    shadowColor: "#e8c08a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  ctaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaTextBlock: { flex: 1 },
  ctaTitle: { fontSize: 18 },
  ctaSub: { fontSize: 13, marginTop: 1 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 20 },
  seeAllText: { fontSize: 14 },
  emptyState: {
    alignItems: "center",
    padding: 40,
    gap: 12,
    borderWidth: 1,
    borderColor: "#00000005",
  },
  emptyTitle: { fontSize: 18, textAlign: "center" },
  emptyDesc: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  serviceList: {
    gap: 12,
  },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    justifyContent: "space-between",
    shadowColor: "#0b1339",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  serviceInfo: { flex: 1, marginRight: 12 },
  serviceTitle: { fontSize: 15, marginBottom: 2 },
  serviceCategory: { fontSize: 13 },
  interestBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  interestCount: { fontSize: 14 },
  tipCard: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    alignItems: "center",
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  tipText: { flex: 1, fontSize: 13, lineHeight: 18 },
  exclusiveSection: {
    padding: 20,
    backgroundColor: "#FFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#00000005",
    gap: 12,
  },
  exclusiveTitle: { fontSize: 18 },
  exclusiveSub: { fontSize: 13, marginBottom: 8 },
  exclusiveCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 16,
  },
  exclusiveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exclusiveJobTitle: { fontSize: 15, flex: 1, marginRight: 8 },
  exclusiveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeText: { fontSize: 10 },
  initialsAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  initialsText: {
    fontSize: 16,
  },
  exclusiveActions: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  actionBtnText: { fontSize: 14 },
  categoriesSection: {
    marginTop: 8,
  },
  categoriesScroll: {
    paddingRight: 20,
    gap: 12,
  },
  categoryCard: {
    width: 100,
    alignItems: "center",
    padding: 12,
    borderRadius: 20,
    shadowColor: "#0b1339",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    textAlign: "center",
  },
  referralBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 24,
    justifyContent: "space-between",
  },
  referralContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  referralTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  referralSub: {
    fontSize: 12,
    lineHeight: 18,
  },
});