import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

const MENU_ITEMS = [
  { label: "Categorias", icon: "tag-multiple", route: "/(admin)/categorias", color: "#3b82f6" },
  { label: "Reembolsos", icon: "cash-refund", route: "/(admin)/reembolsos", color: "#f59e0b" },
  { label: "Push Center", icon: "bell-ring", route: "/(admin)/notificacoes", color: "#8b5cf6" },
  { label: "Suporte", icon: "help-circle", route: "/(admin)/suporte", color: "#10b981" },
];

export default function AdminConfig() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configs, setConfigs] = useState<Record<string, string>>({});

  useEffect(() => {
    loadConfigs();
  }, []);

  async function loadConfigs() {
    try {
      const res = await api.get("/admin/config");
      setConfigs(res.data);
    } catch (e) {
      console.error(e);
      Alert.alert("Erro", "Falha ao carregar configurações");
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig(key: string, value: string) {
    setSaving(true);
    try {
      await api.patch(`/admin/config/${key}`, { value });
      setConfigs(prev => ({ ...prev, [key]: value }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert("Erro", "Falha ao salvar configuração");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const sections = [
    {
      title: "Custos de Leads",
      icon: "cash-multiple",
      keys: [
        { key: "lead_normal_cost", label: "Custo Lead Normal (créditos)", keyboard: "number-pad" },
        { key: "lead_exclusive_cost", label: "Custo Lead Exclusivo (créditos)", keyboard: "number-pad" },
      ]
    },
    {
      title: "Boas-vindas e Indicações",
      icon: "gift",
      keys: [
        { key: "welcome_credits", label: "Créditos de Boas-vindas", keyboard: "number-pad" },
        { key: "referral_bonus", label: "Bônus por Indicação", keyboard: "number-pad" },
      ]
    },
    {
      title: "Configurações de PIX",
      icon: "qrcode",
      keys: [
        { key: "pix_key", label: "Chave PIX", keyboard: "default" },
        { key: "pix_holder_name", label: "Titular da Conta", keyboard: "default" },
        { key: "pix_key_type", label: "Tipo de Chave (CPF, CNPJ, EMAIL, PHONE, RANDOM)", keyboard: "default" },
      ]
    },
    {
      title: "Plataforma e Suporte",
      icon: "cog",
      keys: [
        { key: "service_expiration_days", label: "Expiração de Serviços (Dias)", keyboard: "number-pad" },
        { key: "max_service_images", label: "Máximo de Imagens por Serviço", keyboard: "number-pad" },
        { key: "support_whatsapp", label: "WhatsApp de Suporte (DDI+DDD+Número)", keyboard: "phone-pad" },
        { key: "min_custom_credits", label: "Mínimo para Compra Avulsa", keyboard: "number-pad" },
      ]
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#fff", paddingTop: insets.top + (Platform.OS === "web" ? 20 : 10), borderBottomWidth: 1, borderBottomColor: colors.border + "30" }]}>
        <Text style={[styles.headerTitle, { color: colors.primary, fontFamily: "Inter_800ExtraBold", marginLeft: 20 }]}>Sistema</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
        
        {/* Menu Operacional */}
        <Text style={[styles.sectionLabel, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Ferramentas Operacionais</Text>
        <View style={styles.menuGrid}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity 
              key={item.label} 
              style={[styles.menuItem, { backgroundColor: "#fff" }]}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + "15" }]}>
                <MaterialCommunityIcons name={item.icon as any} size={24} color={item.color} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border + "30" }]} />

        <Text style={[styles.sectionLabel, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Ajustes Globais</Text>

        {sections.map(section => (
          <View key={section.title} style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name={section.icon as any} size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>{section.title}</Text>
            </View>
            
            <View style={[styles.card, { backgroundColor: "#fff" }]}>
              {section.keys.map((item, idx) => (
                <View key={item.key} style={[styles.inputRow, idx !== section.keys.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border + "10" }]}>
                  <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>{item.label}</Text>
                  <TextInput
                    style={[styles.input, { color: colors.primary, fontFamily: "Inter_700Bold" }]}
                    value={configs[item.key] || ""}
                    onChangeText={(text) => setConfigs(prev => ({ ...prev, [item.key]: text }))}
                    onBlur={() => saveConfig(item.key, configs[item.key])}
                    keyboardType={item.keyboard as any}
                    placeholder="Não definido"
                    placeholderTextColor={colors.mutedForeground + "40"}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.footerNote}>As alterações são salvas automaticamente ao sair do campo de edição.</Text>
      </ScrollView>

      {saving && (
        <View style={[styles.savingOverlay, { backgroundColor: colors.primary }]}>
          <ActivityIndicator size="small" color={colors.secondary} />
          <Text style={{ color: "#fff", marginLeft: 10, fontFamily: "Inter_600SemiBold" }}>Salvando alterações...</Text>
        </View>
      )}
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
  headerTitle: { fontSize: 22, letterSpacing: -1 },
  content: { padding: 20 },
  sectionLabel: { fontSize: 16, marginBottom: 16, marginLeft: 4 },
  menuGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 8 },
  menuItem: { width: "48%", padding: 16, borderRadius: 20, alignItems: "center", justifyContent: "center", gap: 10, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  menuIcon: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 13 },
  divider: { height: 1, marginVertical: 32, marginHorizontal: -20 },
  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  card: {
    borderRadius: 24,
    shadowColor: "#0b1339",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    overflow: "hidden",
  },
  inputRow: {
    padding: 16,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    fontSize: 16,
    padding: 0,
  },
  footerNote: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 12,
    paddingHorizontal: 40,
    lineHeight: 18,
  },
  savingOverlay: {
    position: "absolute",
    bottom: 120,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  }
});
