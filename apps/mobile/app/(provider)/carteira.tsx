import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CreditPackageCard } from "@/components/CreditPackageCard";
import { MIN_CUSTOM_CREDITS } from "@/constants/categories";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function Carteira() {
  const colors = useColors();
  const { user, transactions, buyCredits } = useAuth();
  const insets = useSafeAreaInsets();

  const [customAmount, setCustomAmount] = useState("");
  const [buying, setBuying] = useState(false);
  const [showPix, setShowPix] = useState(false);
  const [pixFor, setPixFor] = useState<{ credits: number; price: number; packageId?: string } | null>(null);
  const [dbPackages, setDbPackages] = useState<any[]>([]);
  const [appConfig, setAppConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const baseUrl = process.env.EXPO_PUBLIC_API_URL || "https://api.trampai.com.br";
      const [pkgRes, configRes] = await Promise.all([
        fetch(`${baseUrl}/api/packages`),
        fetch(`${baseUrl}/api/config`)
      ]);
      if (pkgRes.ok) setDbPackages(await pkgRes.json());
      if (configRes.ok) setAppConfig(await configRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const myTxs = transactions
    .filter((t) => t.userId === user?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  function formatCurrency(cents: number) {
    return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
  }

  async function handleBuyPackage(packageId: string) {
    const pkg = dbPackages.find((p) => p.id === packageId);
    if (!pkg) return;
    setPixFor({ credits: pkg.credits + (pkg.bonusCredits || 0), price: pkg.priceCents, packageId: pkg.id });
    setShowPix(true);
  }

  async function handleBuyCustom() {
    const amount = parseInt(customAmount, 10);
    if (isNaN(amount) || amount < MIN_CUSTOM_CREDITS) {
      Alert.alert("Quantidade inválida", `Mínimo de ${MIN_CUSTOM_CREDITS} créditos.`);
      return;
    }
    setPixFor({ credits: amount, price: amount * 100 });
    setShowPix(true);
  }

  async function confirmPix() {
    if (!pixFor) return;
    setBuying(true);
    try {
      if (!pixFor.packageId) {
        await buyCredits("", pixFor.credits);
      } else {
        await buyCredits(pixFor.packageId, undefined);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowPix(false);
      setPixFor(null);
      setCustomAmount("");
      Alert.alert("Pagamento confirmado!", `${pixFor.credits} créditos adicionados à sua carteira.`);
    } finally {
      setBuying(false);
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return "??";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  if (showPix && pixFor) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Custom Header for PIX */}
        <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 20 : 10), borderBottomWidth: 1, borderBottomColor: colors.border + "30", backgroundColor: "#fff" }]}>
          <TouchableOpacity onPress={() => setShowPix(false)} style={styles.iconBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerLogo, { fontFamily: "Inter_800ExtraBold", color: colors.primary, flex: 1, textAlign: "center", marginRight: 40 }]}>Pagamento</Text>
        </View>

        <ScrollView contentContainerStyle={[styles.pixContent, { paddingBottom: insets.bottom + 40 }]}>
          <View style={[styles.pixSummary, { backgroundColor: "#FFF", borderRadius: 24, borderColor: colors.border + "50", borderWidth: 1 }]}>
            <Text style={[styles.pixSummaryLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Você está comprando</Text>
            <Text style={[styles.pixSummaryCredits, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>{pixFor.credits} créditos</Text>
            <Text style={[styles.pixSummaryPrice, { color: colors.secondary, fontFamily: "Inter_700Bold" }]}>{formatCurrency(pixFor.price)}</Text>
          </View>

          <View style={[styles.pixBox, { backgroundColor: "#FFF", borderRadius: 24, borderColor: colors.border + "50", borderWidth: 1 }]}>
            <View style={[styles.qrPlaceholder, { backgroundColor: colors.primary + "05", borderRadius: 16 }]}>
              <MaterialCommunityIcons name="qrcode" size={140} color={colors.primary} />
              <Text style={[styles.qrText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>QR Code PIX</Text>
            </View>

            <View style={[styles.copyPasteBox, { backgroundColor: colors.primary + "05", borderRadius: 12 }]}>
              <Text style={[styles.copyPasteLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>Chave PIX</Text>
              <Text style={[styles.copyPasteCode, { color: colors.primary, fontFamily: "Inter_400Regular" }]} selectable>
                {appConfig.pix_key || "Chave PIX não configurada pelo administrador."}
              </Text>
              {appConfig.pix_holder_name && (
                <Text style={[styles.copyPasteLabel, { color: colors.mutedForeground, marginTop: 8 }]}>Titular: {appConfig.pix_holder_name}</Text>
              )}
            </View>

            <Text style={[styles.pixInstructions, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Abra seu banco e escaneie o QR Code ou use o código copia-e-cola. Após o pagamento, os créditos serão adicionados automaticamente.
            </Text>
          </View>

          <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: "#22c55e", borderRadius: 16 }]} onPress={confirmPix} disabled={buying} activeOpacity={0.85}>
            {buying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                <Text style={[styles.confirmBtnText, { color: "#FFF", fontFamily: "Inter_700Bold" }]}>Confirmar Pagamento</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 20 : 10), borderBottomWidth: 1, borderBottomColor: colors.border + "30", backgroundColor: "#fff" }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerLogo, { fontFamily: "Inter_800ExtraBold", color: colors.primary }]}>Trampaí</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={[styles.initialsAvatar, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(provider)/perfil")}
          >
            <Text style={[styles.initialsText, { color: "#FFF", fontFamily: "Inter_700Bold" }]}>
              {getInitials(user?.name)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        {/* Balance Hero Section */}
        <View style={[styles.balanceHero, { backgroundColor: "#FFF" }]}>
          <Text style={[styles.balanceLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Saldo Disponível</Text>
          <View style={styles.balanceMain}>
            <Text style={[styles.balanceAmount, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>{user?.creditBalance ?? 0}</Text>
            <Text style={[styles.balanceUnit, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>cr</Text>
          </View>
          <View style={[styles.balanceInfoBox, { backgroundColor: colors.primary + "05" }]}>
            <MaterialCommunityIcons name="information" size={14} color={colors.primary} />
            <Text style={[styles.balanceSub, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>
              1 crédito = 1 desbloqueio normal
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Pacotes de Créditos</Text>

        <View style={styles.packagesGrid}>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
          ) : (
            dbPackages.map((pkg) => (
              <TouchableOpacity 
                key={pkg.id} 
                style={styles.packageCardWrapper}
                onPress={() => handleBuyPackage(pkg.id)}
                activeOpacity={0.8}
              >
                <CreditPackageCard pkg={pkg} onSelect={() => handleBuyPackage(pkg.id)} />
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={[styles.customSection, { backgroundColor: "#FFF", borderRadius: 24, borderColor: colors.border + "50", borderWidth: 1 }]}>
          <Text style={[styles.customTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Quantidade Personalizada</Text>
          <Text style={[styles.customSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Mínimo {MIN_CUSTOM_CREDITS} créditos · R$ 1,00/cr</Text>
          <View style={styles.customInputRow}>
            <TextInput 
              style={[styles.customInput, { backgroundColor: colors.primary + "05", color: colors.primary, borderRadius: 12, fontFamily: "Inter_600SemiBold" }]} 
              placeholder={`Min. ${MIN_CUSTOM_CREDITS}`} 
              placeholderTextColor={colors.mutedForeground} 
              value={customAmount} 
              onChangeText={(t) => setCustomAmount(t.replace(/\D/g, ""))} 
              keyboardType="number-pad" 
            />
            {customAmount && parseInt(customAmount) >= MIN_CUSTOM_CREDITS && (
              <Text style={[styles.customPrice, { color: colors.secondary, fontFamily: "Inter_700Bold" }]}>
                = R$ {customAmount},00
              </Text>
            )}
          </View>
          <TouchableOpacity style={[styles.customBtn, { backgroundColor: colors.primary, borderRadius: 12 }]} onPress={handleBuyCustom} activeOpacity={0.85}>
            <MaterialCommunityIcons name="plus-circle" size={18} color="#fff" />
            <Text style={[styles.customBtnText, { color: "#FFF", fontFamily: "Inter_700Bold" }]}>Comprar via PIX</Text>
          </TouchableOpacity>
        </View>

        {myTxs.length > 0 && (
          <View style={[styles.transactionsSection, { backgroundColor: "#FFF" }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold", textAlign: 'left', marginBottom: 16 }]}>Extrato</Text>
            {myTxs.slice(0, 10).map((tx, i) => (
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
                  <Text style={[styles.txDate, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{new Date(tx.createdAt).toLocaleDateString("pt-BR")}</Text>
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
  initialsAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: {
    fontSize: 14,
  },
  content: { padding: 20, gap: 24 },
  balanceHero: {
    alignItems: "center",
    padding: 32,
    borderRadius: 32,
    shadowColor: "#0b1339",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  balanceLabel: { fontSize: 14, marginBottom: 8 },
  balanceMain: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  balanceAmount: { fontSize: 64 },
  balanceUnit: { fontSize: 24 },
  balanceInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    marginTop: 16,
  },
  balanceSub: { fontSize: 12 },
  sectionTitle: { fontSize: 20 },
  packagesGrid: { 
    flexDirection: "row", 
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  packageCardWrapper: { 
    width: "50%", 
    padding: 8,
  },
  customSection: {
    padding: 24,
    borderWidth: 1,
    gap: 16,
    shadowColor: "#0b1339",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  customTitle: { fontSize: 18, textAlign: "center" },
  customSub: { fontSize: 13, textAlign: "center", marginTop: -8 },
  customInputRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  customInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 18, textAlign: "center" },
  customPrice: { fontSize: 18 },
  customBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 54, gap: 10 },
  customBtnText: { fontSize: 16 },
  transactionsSection: {
    padding: 24,
    borderRadius: 24,
    shadowColor: "#0b1339",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  txRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 16 },
  txIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  txDesc: { fontSize: 14, marginBottom: 2 },
  txDate: { fontSize: 12 },
  txAmount: { fontSize: 16 },
  pixContent: { padding: 20, gap: 24 },
  pixSummary: { alignItems: "center", padding: 24, borderWidth: 1, gap: 8 },
  pixSummaryLabel: { fontSize: 14 },
  pixSummaryCredits: { fontSize: 40 },
  pixSummaryPrice: { fontSize: 24 },
  pixBox: { padding: 24, borderWidth: 1, gap: 20, alignItems: "center" },
  qrPlaceholder: { width: "100%", padding: 32, alignItems: "center", gap: 12 },
  qrText: { fontSize: 14 },
  copyPasteBox: { width: "100%", padding: 16, gap: 8 },
  copyPasteLabel: { fontSize: 12 },
  copyPasteCode: { fontSize: 13, lineHeight: 20 },
  pixInstructions: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  confirmBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 60, gap: 10 },
  confirmBtnText: { fontSize: 18 },
});