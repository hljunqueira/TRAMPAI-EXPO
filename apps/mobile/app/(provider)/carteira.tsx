import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  Alert,
  ScrollView,
  Modal,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";

import { useAuth, API_BASE_URL } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceCents: number;
  bonusCredits: number;
  isHighlighted: boolean;
}

interface Transaction {
  id: string;
  type: string;
  credits: number;
  amountCents: number;
  description: string;
  createdAt: string;
}

export default function CarteiraScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, fetchMyData } = useAuth();

  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [transactionsData, setTransactionsData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customCredits, setCustomCredits] = useState("10");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingPackage, setPendingPackage] = useState<{ id: string, amount?: number } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const token = await SecureStore.getItemAsync("trampai_auth_token");
      const [pkgsRes, transRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/payments/packages`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/users/me/transactions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (pkgsRes.ok) setPackages(await pkgsRes.json());
      if (transRes.ok) setTransactionsData(await transRes.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleBuy(packageId: string, amount?: number) {
    setPendingPackage({ id: packageId, amount });
    setShowPaymentModal(true);
  }

  async function processPayment(method: "stripe" | "cakto") {
    if (!pendingPackage) return;

    const { id: packageId, amount: customAmount } = pendingPackage;
    setShowPaymentModal(false);

    try {
      setBuying(packageId);
      const token = await SecureStore.getItemAsync("trampai_auth_token");

      const endpoint = method === "stripe" ? "/api/payments/checkout" : "/api/payments/cakto/checkout";

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          packageId,
          ...(customAmount ? { customCredits: customAmount } : {})
        }),
      });

      const data = await res.json();

      if (res.ok && data.url) {
        // Abrir o checkout no in-app browser
        WebBrowser.openBrowserAsync(data.url);
      } else {
        Alert.alert("Erro", data.error || "Não foi possível iniciar o pagamento.");
      }
    } catch (error) {
      Alert.alert("Erro", "Falha na conexão.");
    } finally {
      setBuying(null);
      setPendingPackage(null);
    }
  }

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Saldo Card */}
      <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
        <Text style={styles.balanceLabel}>Seu Saldo</Text>
        <View style={styles.balanceRow}>
          <MaterialCommunityIcons name="diamond-stone" size={32} color={colors.accent} />
          <Text style={[styles.balanceValue, { color: "#FFF" }]}>{user?.creditBalance || 0}</Text>
          <Text style={styles.creditsLabel}>créditos</Text>
        </View>
        <Text style={styles.balanceSub}>Use para desbloquear contatos e destacar serviços.</Text>
      </View>

      {/* Título Pacotes */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Comprar Créditos 💎</Text>
      </View>

      {/* Lista de Pacotes (Grid 2x2) */}
      <View style={styles.packagesContainer}>
        {packages.map(pkg => (
          <TouchableOpacity
            key={pkg.id}
            style={[
              styles.packageCard,
              { borderColor: pkg.isHighlighted ? colors.accent : colors.border },
              pkg.isHighlighted && { borderWidth: 2 }
            ]}
            onPress={() => handleBuy(pkg.id)}
            disabled={!!buying}
          >
            {pkg.isHighlighted && (
              <View style={[styles.popularBadge, { backgroundColor: colors.accent }]}>
                <Text style={styles.popularText}>POPULAR</Text>
              </View>
            )}
            <Text style={[styles.pkgCredits, { color: colors.primary }]}>{pkg.credits + pkg.bonusCredits} CR</Text>
            {pkg.bonusCredits > 0 && (
              <Text style={[styles.pkgBonus, { color: "#22c55e" }]}>+{pkg.bonusCredits} BÔNUS</Text>
            )}
            <Text style={[styles.pkgPrice, { color: colors.mutedForeground }]}>{formatCurrency(pkg.priceCents)}</Text>

            <View style={[styles.buyBtn, { backgroundColor: pkg.isHighlighted ? colors.accent : colors.primary }]}>
              {buying === pkg.id ? (
                <ActivityIndicator size="small" color={pkg.isHighlighted ? colors.primary : "#FFF"} />
              ) : (
                <Text style={[styles.buyBtnText, { color: pkg.isHighlighted ? colors.primary : "#FFF" }]}>COMPRAR</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {/* Pacote Personalizado */}
        <TouchableOpacity
          style={[styles.packageCard, { borderColor: colors.border, justifyContent: 'center' }]}
          onPress={() => setCustomModalVisible(true)}
          disabled={!!buying}
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={32} color={colors.primary} style={{ marginBottom: 8 }} />
          <Text style={[styles.pkgCredits, { color: colors.primary, fontSize: 16 }]}>Avulso</Text>
          <Text style={[styles.pkgPrice, { color: colors.mutedForeground, textAlign: 'center', fontSize: 12, marginTop: 4 }]}>Min. 10 CR</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Histórico</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Fixo */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <View style={{ width: 40 }} />
        <Text style={[styles.topBarTitle, { fontFamily: "Inter_700Bold", color: colors.primary }]}>Minha Carteira</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={transactionsData}
          keyExtractor={item => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <View style={styles.transactionItem}>
              <View style={[styles.transIcon, { backgroundColor: item.credits > 0 ? "#22c55e15" : "#ef444415" }]}>
                <MaterialCommunityIcons
                  name={item.credits > 0 ? "arrow-up-right" : "arrow-down-left"}
                  size={20}
                  color={item.credits > 0 ? "#22c55e" : "#ef4444"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.transTitle, { color: colors.primary }]}>{item.description}</Text>
                <Text style={[styles.transDate, { color: colors.mutedForeground }]}>
                  {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                </Text>
              </View>
              <Text style={[styles.transAmount, { color: item.credits > 0 ? "#22c55e" : "#ef4444" }]}>
                {item.credits > 0 ? "+" : ""}{item.credits}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ color: colors.mutedForeground }}>Nenhuma transação ainda.</Text>
            </View>
          }
        />
      )}

      {/* Modal de Créditos Personalizados */}
      <Modal
        visible={customModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.primary }]}>Créditos Avulsos</Text>
            <Text style={[styles.modalSubtitle, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              Digite a quantidade desejada (mínimo de 10 créditos). O valor é calculado a partir de R$ 9,99 a cada 10 créditos.
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, width: '100%' }}>
              <TouchableOpacity
                style={[styles.selectorBtn, { backgroundColor: colors.muted }]}
                onPress={() => {
                  const val = parseInt(customCredits || "0");
                  setCustomCredits(String(Math.max(10, val - 5)));
                }}
              >
                <MaterialCommunityIcons name="minus" size={24} color={colors.primary} />
              </TouchableOpacity>

              <TextInput
                style={[styles.modalInput, { borderColor: colors.border, color: colors.primary, flex: 1, marginBottom: 0 }]}
                keyboardType="number-pad"
                value={customCredits}
                onChangeText={setCustomCredits}
                maxLength={4}
              />

              <TouchableOpacity
                style={[styles.selectorBtn, { backgroundColor: colors.muted }]}
                onPress={() => {
                  const val = parseInt(customCredits || "0");
                  setCustomCredits(String(val < 10 ? 10 : val + 5));
                }}
              >
                <MaterialCommunityIcons name="plus" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <TouchableOpacity onPress={() => setCustomModalVisible(false)}>
                <Text style={{ color: colors.mutedForeground, fontWeight: '600', padding: 8 }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setCustomModalVisible(false);
                  handleBuy("custom", parseInt(customCredits));
                }}
                disabled={!customCredits || parseInt(customCredits) < 10}
              >
                <Text style={{ color: colors.primary, fontWeight: '700', padding: 8 }}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Selecao de Pagamento */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, maxWidth: 320 }]}>
            <Text style={[styles.modalTitle, { color: colors.primary, textAlign: 'center' }]}>Forma de Pagamento</Text>
            <Text style={[styles.modalSubtitle, { color: colors.mutedForeground, textAlign: 'center', marginBottom: 24, fontFamily: 'Inter_400Regular' }]}>
              Escolha como deseja concluir sua compra
            </Text>

            <TouchableOpacity
              style={[styles.paymentOption, { borderColor: colors.border }]}
              onPress={() => processPayment("cakto")}
            >
              <View style={[styles.paymentIconContainer, { backgroundColor: '#E7F9F3' }]}>
                <MaterialCommunityIcons name="qrcode" size={24} color="#00BFA5" />
              </View>
              <View>
                <Text style={[styles.paymentOptionTitle, { color: colors.foreground }]}>Pix</Text>
                <Text style={[styles.paymentOptionSub, { color: colors.mutedForeground }]}>Aprovação imediata</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentOption, { borderColor: colors.border, marginTop: 12 }]}
              onPress={() => processPayment("stripe")}
            >
              <View style={[styles.paymentIconContainer, { backgroundColor: '#F0F2FF' }]}>
                <MaterialCommunityIcons name="credit-card-outline" size={24} color="#635BFF" />
              </View>
              <View>
                <Text style={[styles.paymentOptionTitle, { color: colors.foreground }]}>Cartão / Boleto</Text>
                <Text style={[styles.paymentOptionSub, { color: colors.mutedForeground }]}>Boleto a partir de R$99,99</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowPaymentModal(false)}
              style={{ marginTop: 20, alignSelf: 'center' }}
            >
              <Text style={{ color: colors.mutedForeground, fontWeight: '600' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 15, backgroundColor: "#FFF" },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  topBarTitle: { fontSize: 18 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerContent: { padding: 20 },
  balanceCard: { borderRadius: 24, padding: 24, gap: 8, marginBottom: 32 },
  balanceLabel: { color: "rgba(255,255,255,0.7)", fontSize: 14, fontFamily: "Inter_500Medium" },
  balanceRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  balanceValue: { fontSize: 42, fontFamily: "Inter_700Bold" },
  creditsLabel: { color: "rgba(255,255,255,0.8)", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  balanceSub: { color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 18 },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  packagesContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12, marginBottom: 24 },
  packageCard: { width: "48%", backgroundColor: "#FFF", borderRadius: 16, padding: 16, alignItems: "center", borderWidth: 1, position: "relative", overflow: "hidden" },
  popularBadge: { position: "absolute", top: 0, left: 0, right: 0, paddingVertical: 2, alignItems: "center" },
  popularText: { color: "#FFF", fontSize: 9, fontFamily: "Inter_800ExtraBold" },
  pkgCredits: { fontSize: 20, fontFamily: "Inter_700Bold", marginTop: 8 },
  pkgBonus: { fontSize: 11, fontFamily: "Inter_700Bold", marginBottom: 4 },
  pkgPrice: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  buyBtn: { width: "100%", paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  buyBtnText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  transactionItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#F0F0F0", gap: 16 },
  transIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  transTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  transDate: { fontSize: 12 },
  transAmount: { fontSize: 16, fontFamily: "Inter_700Bold" },
  empty: { padding: 40, alignItems: "center" },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { borderRadius: 16, padding: 24, alignItems: 'center', width: '100%' },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  paymentIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  paymentOptionSub: {
    fontSize: 12,
  },
  modalInput: { width: '100%', borderWidth: 1, borderRadius: 8, padding: 16, fontSize: 24, textAlign: 'center', fontFamily: 'Inter_700Bold', marginBottom: 24 },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtn: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
  modalBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  selectorBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }
});