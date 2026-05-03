import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
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
import { CREDIT_PACKAGES, MIN_CUSTOM_CREDITS } from "@/constants/categories";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function Carteira() {
  const colors = useColors();
  const { user, transactions, buyCredits } = useAuth();
  const insets = useSafeAreaInsets();

  const [customAmount, setCustomAmount] = useState("");
  const [buying, setBuying] = useState(false);
  const [showPix, setShowPix] = useState(false);
  const [pixFor, setPixFor] = useState<{ credits: number; price: number } | null>(null);

  const myTxs = transactions
    .filter((t) => t.userId === user?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  function formatCurrency(cents: number) {
    return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
  }

  async function handleBuyPackage(packageId: string) {
    const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) return;
    setPixFor({ credits: pkg.credits, price: pkg.priceCents });
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
      if (pixFor.credits === parseInt(customAmount, 10)) {
        await buyCredits("", pixFor.credits);
      } else {
        const pkg = CREDIT_PACKAGES.find((p) => p.credits === pixFor.credits);
        await buyCredits(pkg?.id ?? "", undefined);
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

  if (showPix && pixFor) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.navy, paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
          <TouchableOpacity onPress={() => setShowPix(false)}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontFamily: "Inter_700Bold" }]}>Pagamento via PIX</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={[styles.pixContent, { paddingBottom: insets.bottom + 40 }]}>
          <View style={[styles.pixSummary, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}>
            <Text style={[styles.pixSummaryLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Você está comprando</Text>
            <Text style={[styles.pixSummaryCredits, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>{pixFor.credits} créditos</Text>
            <Text style={[styles.pixSummaryPrice, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>{formatCurrency(pixFor.price)}</Text>
          </View>

          <View style={[styles.pixBox, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}>
            <View style={[styles.qrPlaceholder, { backgroundColor: colors.muted, borderRadius: 8 }]}>
              <MaterialCommunityIcons name="qrcode" size={120} color={colors.navy} />
              <Text style={[styles.qrText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>QR Code PIX</Text>
            </View>

            <View style={[styles.copyPasteBox, { backgroundColor: colors.muted, borderRadius: 8 }]}>
              <Text style={[styles.copyPasteLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Copia e Cola</Text>
              <Text style={[styles.copyPasteCode, { color: colors.foreground, fontFamily: "Inter_400Regular" }]} selectable>
                00020126580014BR.GOV.BCB.PIX0136trampa-i-mock-key-demo-pix@trampai.app5204000053039865802BR5925Trampaí Tecnologia6009SAO PAULO62070503***63044A9E
              </Text>
            </View>

            <Text style={[styles.pixInstructions, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Abra seu banco e escaneie o QR Code ou use o código copia-e-cola. Após o pagamento, os créditos serão adicionados automaticamente.
            </Text>
          </View>

          <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: "#22c55e", borderRadius: colors.radius }]} onPress={confirmPix} disabled={buying} activeOpacity={0.85}>
            {buying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="check-circle-outline" size={20} color="#fff" />
                <Text style={[styles.confirmBtnText, { fontFamily: "Inter_600SemiBold" }]}>Confirmar pagamento</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={[styles.pixNote, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Demo: ao confirmar, os créditos são adicionados imediatamente.</Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.navy, colors.navy + "EE"]} style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <Text style={[styles.headerTitle, { fontFamily: "Inter_700Bold" }]}>Carteira</Text>
        <View style={styles.balanceSection}>
          <Text style={[styles.balanceLabel, { fontFamily: "Inter_400Regular" }]}>Saldo disponível</Text>
          <Text style={[styles.balanceAmount, { fontFamily: "Inter_700Bold" }]}>{user?.creditBalance ?? 0}</Text>
          <Text style={[styles.balanceUnit, { fontFamily: "Inter_400Regular" }]}>créditos</Text>
          <Text style={[styles.balanceSub, { fontFamily: "Inter_400Regular" }]}>1 crédito = 1 desbloqueio normal · 3 créditos = exclusivo</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Pacotes de créditos</Text>

        <View style={styles.packagesRow}>
          {CREDIT_PACKAGES.map((pkg) => (
            <View key={pkg.id} style={styles.packageItem}>
              <CreditPackageCard pkg={pkg} onSelect={() => handleBuyPackage(pkg.id)} />
            </View>
          ))}
        </View>

        <View style={[styles.customSection, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}>
          <Text style={[styles.customTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Quantidade personalizada</Text>
          <Text style={[styles.customSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Mínimo {MIN_CUSTOM_CREDITS} créditos · R$ 1,00 por crédito</Text>
          <View style={styles.customInputRow}>
            <TextInput style={[styles.customInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground, borderRadius: colors.radius, fontFamily: "Inter_400Regular" }]} placeholder={`Min. ${MIN_CUSTOM_CREDITS}`} placeholderTextColor={colors.mutedForeground} value={customAmount} onChangeText={(t) => setCustomAmount(t.replace(/\D/g, ""))} keyboardType="number-pad" />
            {customAmount && parseInt(customAmount) >= MIN_CUSTOM_CREDITS && <Text style={[styles.customPrice, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>= R$ {customAmount},00</Text>}
          </View>
          <TouchableOpacity style={[styles.customBtn, { backgroundColor: colors.navy, borderRadius: colors.radius }]} onPress={handleBuyCustom} activeOpacity={0.85}>
            <MaterialCommunityIcons name="plus-circle-outline" size={18} color="#fff" />
            <Text style={[styles.customBtnText, { fontFamily: "Inter_600SemiBold" }]}>Comprar via PIX</Text>
          </TouchableOpacity>
        </View>

        {myTxs.length > 0 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Extrato</Text>
            <View style={[styles.txList, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}>
              {myTxs.slice(0, 10).map((tx, i) => (
                <View key={tx.id}>
                  {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                  <View style={styles.txRow}>
                    <View style={[styles.txIcon, { backgroundColor: tx.credits > 0 ? "#22c55e15" : "#ef444415" }]}>
                      <MaterialCommunityIcons name={tx.credits > 0 ? "plus" : "minus"} size={14} color={tx.credits > 0 ? "#22c55e" : "#ef4444"} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.txDesc, { color: colors.foreground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>{tx.description}</Text>
                      <Text style={[styles.txDate, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{new Date(tx.createdAt).toLocaleDateString("pt-BR")}</Text>
                    </View>
                    <Text style={[styles.txAmount, { color: tx.credits > 0 ? "#22c55e" : "#ef4444", fontFamily: "Inter_700Bold" }]}>{tx.credits > 0 ? "+" : ""}{tx.credits}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 28 },
  headerTitle: { color: "#fff", fontSize: 22, marginBottom: 16, textAlign: "center" },
  balanceSection: { alignItems: "center", gap: 4 },
  balanceLabel: { color: "#ffffff80", fontSize: 13 },
  balanceAmount: { color: "#fff", fontSize: 64, lineHeight: 70 },
  balanceUnit: { color: "#ffffff80", fontSize: 16 },
  balanceSub: { color: "#ffffff60", fontSize: 12, textAlign: "center", marginTop: 8 },
  content: { padding: 16, gap: 20 },
  sectionTitle: { fontSize: 18, textAlign: "center" },
  packagesRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  packageItem: { flex: 1, minWidth: 140 },
  customSection: { padding: 16, borderWidth: 1, gap: 10 },
  customTitle: { fontSize: 15, textAlign: "center" },
  customSub: { fontSize: 12, textAlign: "center" },
  customInputRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  customInput: { flex: 1, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, textAlign: "center" },
  customPrice: { fontSize: 16 },
  customBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, gap: 8 },
  customBtnText: { color: "#fff", fontSize: 15 },
  txList: { borderWidth: 1, overflow: "hidden" },
  txRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  txIcon: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  txDesc: { fontSize: 13 },
  txDate: { fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 15 },
  divider: { height: StyleSheet.hairlineWidth },
  pixContent: { padding: 20, gap: 20 },
  pixSummary: { alignItems: "center", padding: 20, borderWidth: 1, gap: 4 },
  pixSummaryLabel: { fontSize: 13 },
  pixSummaryCredits: { fontSize: 32 },
  pixSummaryPrice: { fontSize: 22 },
  pixBox: { padding: 20, borderWidth: 1, gap: 16, alignItems: "center" },
  qrPlaceholder: { padding: 20, alignItems: "center", gap: 8 },
  qrText: { fontSize: 12 },
  copyPasteBox: { width: "100%", padding: 12, gap: 4 },
  copyPasteLabel: { fontSize: 11 },
  copyPasteCode: { fontSize: 12, lineHeight: 16 },
  pixInstructions: { fontSize: 13, textAlign: "center", lineHeight: 18 },
  confirmBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, gap: 8 },
  confirmBtnText: { color: "#fff", fontSize: 16 },
  pixNote: { fontSize: 12, textAlign: "center" },
});