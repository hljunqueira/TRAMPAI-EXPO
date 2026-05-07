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
import { Modal } from "@/components/Common/Modal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

const MENU_ITEMS = [
  { label: "Categorias", icon: "tag-multiple", route: "/(admin)/categorias", color: "#3b82f6" },
  { label: "Pacotes", icon: "package-variant-closed", route: "/(admin)/pacotes", color: "#ec4899" },
  { label: "Reembolsos", icon: "cash-refund", route: "/(admin)/reembolsos", color: "#f59e0b" },
  { label: "Push Center", icon: "bell-ring", route: "/(admin)/notificacoes", color: "#8b5cf6" },
];

export default function AdminConfig() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSection, setSelectedSection] = useState<any>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  async function loadConfigs() {
    try {
      const res = await api.get("/admin/config");
      setConfigs(res?.data || {});
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
      title: "Regras de Negócio",
      description: "Controle os custos de leads, expiração de serviços e limites operacionais da plataforma.",
      icon: "shield-crown-outline",
      color: "#3b82f6",
      keys: [
        { key: "lead_normal_cost", label: "Custo Lead Normal", icon: "flash-outline", suffix: "cr", keyboard: "number-pad" },
        { key: "lead_exclusive_cost", label: "Custo Lead Exclusivo", icon: "crown-outline", suffix: "cr", keyboard: "number-pad" },
        { key: "service_expiration_days", label: "Expiração de Serviços", icon: "calendar-clock", suffix: "dias", keyboard: "number-pad" },
        { key: "min_custom_credits", label: "Compra Mínima (Avulsa)", icon: "cart-arrow-down", suffix: "cr", keyboard: "number-pad" },
      ]
    },
    {
      title: "Boas-vindas e Indicações",
      description: "Defina os incentivos para novos usuários e recompensas por recomendação.",
      icon: "gift-outline",
      color: "#ec4899",
      keys: [
        { key: "referral_bonus", label: "Bônus por Indicação", icon: "account-multiple-plus-outline", suffix: "cr", keyboard: "number-pad" },
      ]
    },
    {
      title: "Pagamentos e Integrações",
      description: "Configurações do gateway Stripe e métodos de recebimento.",
      icon: "credit-card-settings-outline",
      color: "#10b981",
      keys: [
        { key: "stripe_enabled", label: "Stripe Ativo (true/false)", icon: "stripe", keyboard: "default" },
      ]
    },
    {
      title: "Suporte e Plataforma",
      description: "Canais de atendimento e links institucionais para os usuários.",
      icon: "help-circle-outline",
      color: "#f59e0b",
      keys: [
        { key: "support_whatsapp", label: "WhatsApp Suporte", icon: "whatsapp", keyboard: "phone-pad" },
        { key: "terms_url", label: "Link Termos de Uso", icon: "file-document-outline", keyboard: "url" },
      ]
    },
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

        <Text style={[styles.sectionLabel, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Configurações do Sistema</Text>
        <View style={styles.menuGrid}>
          {sections.map((section) => (
            <TouchableOpacity 
              key={section.title} 
              style={[styles.menuItem, { backgroundColor: "#fff" }]}
              onPress={() => {
                setSelectedSection(section);
                setModalVisible(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <View style={[styles.menuIcon, { backgroundColor: section.color + "15" }]}>
                <MaterialCommunityIcons name={section.icon as any} size={24} color={section.color} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold", textAlign: 'center' }]}>{section.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.footerNote}>Clique nos cards para ajustar as regras de negócio e configurações da plataforma.</Text>
      </ScrollView>

      {/* Modal de Edição de Configurações */}
      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={selectedSection?.title || ""}
        description={selectedSection?.description}
        footer={
          <TouchableOpacity 
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            onPress={() => setModalVisible(false)}
          >
            <Text style={{ color: "#fff", fontFamily: "Inter_700Bold" }}>CONCLUÍDO</Text>
          </TouchableOpacity>
        }
      >
        <View style={{ gap: 20 }}>
          {selectedSection?.keys.map((item: any) => (
            <View key={item.key} style={styles.modalInputGroup}>
              <View style={styles.inputLabelRow}>
                <MaterialCommunityIcons name={item.icon as any} size={16} color={colors.primary + "60"} />
                <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>{item.label}</Text>
              </View>
              <View style={[styles.inputWrapper, { backgroundColor: colors.primary + "03", borderColor: colors.primary + "10" }]}>
                <TextInput
                  style={[styles.modalInput, { color: colors.primary, fontFamily: "Inter_700Bold" }]}
                  value={configs[item.key] || ""}
                  onChangeText={(text) => setConfigs(prev => ({ ...prev, [item.key]: text }))}
                  onBlur={() => saveConfig(item.key, configs[item.key])}
                  keyboardType={item.keyboard as any}
                  placeholder="Não definido"
                  placeholderTextColor={colors.mutedForeground + "40"}
                />
                {item.suffix && (
                  <Text style={[styles.suffix, { color: colors.primary + "40", fontFamily: "Inter_700Bold" }]}>{item.suffix}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </Modal>

      {saving && (
        <View style={[styles.savingOverlay, { backgroundColor: colors.primary }]}>
          <ActivityIndicator size="small" color={colors.secondary} />
          <Text style={{ color: "#fff", marginLeft: 10, fontFamily: "Inter_600SemiBold" }}>Salvando...</Text>
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
  section: { marginBottom: 32 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 18,
    letterSpacing: -0.5,
  },
  sectionDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
    opacity: 0.7,
  },
  card: {
    borderRadius: 24,
    shadowColor: "#0b1339",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    overflow: "hidden",
  },
  inputRow: {
    padding: 18,
    paddingHorizontal: 20,
    gap: 8,
  },
  inputLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 13,
    letterSpacing: 0.3,
  },
  inputValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  input: {
    fontSize: 17,
    padding: 0,
    flex: 1,
  },
  suffix: {
    fontSize: 14,
    textTransform: "lowercase",
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(11, 19, 57, 0.6)", justifyContent: "flex-end" },
  modalContent: { height: "70%", padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32, gap: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  modalTitle: { fontSize: 20 },
  modalDesc: { fontSize: 13, marginTop: 4, opacity: 0.7, lineHeight: 18 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#f1f5f9" },
  modalInputGroup: { gap: 10 },
  inputWrapper: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 56, borderRadius: 16, borderWidth: 1 },
  modalInput: { flex: 1, fontSize: 16 },
  doneBtn: { height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center", marginTop: 10 },
  footerNote: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 24,
    paddingHorizontal: 40,
    lineHeight: 18,
    fontFamily: "Inter_500Medium",
  },
  savingOverlay: {
    position: "absolute",
    bottom: 40,
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
