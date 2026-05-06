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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

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

  async function handleBuy(packageId: string) {
    try {
      setBuying(packageId);
      const token = await SecureStore.getItemAsync("trampai_auth_token");
      
      const res = await fetch(`${API_BASE_URL}/api/payments/checkout`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ packageId }),
      });

      const data = await res.json();
      
      if (res.ok && data.url) {
        // Abrir o checkout do Stripe no navegador
        Linking.openURL(data.url);
      } else {
        Alert.alert("Erro", data.error || "Não foi possível iniciar o pagamento.");
      }
    } catch (error) {
      Alert.alert("Erro", "Falha na conexão.");
    } finally {
      setBuying(null);
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

      {/* Lista de Pacotes (Horizontal) */}
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
  packagesContainer: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 32 },
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
  empty: { padding: 40, alignItems: "center" }
});