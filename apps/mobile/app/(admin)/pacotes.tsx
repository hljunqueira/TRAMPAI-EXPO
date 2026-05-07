import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
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
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { CREDIT_PACKAGES } from "@/constants/categories";
import { useAuth, API_BASE_URL } from "@/context/AuthContext";

const TOKEN_KEY = "trampai_auth_token";

interface Package {
  id: string;
  label: string;
  credits: number;
  priceCents: number;
  bonusCredits: number;
  isActive: boolean;
  highlight: boolean;
  sortOrder: number;
}

export default function AdminPackages() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<Package[]>(CREDIT_PACKAGES.map(p => ({
    ...p,
    label: p.name || "", 
    bonusCredits: p.bonusCredits || 0,
    isActive: true,
    highlight: !!p.isHighlighted,
    sortOrder: 0
  })));
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPkg, setEditingPkg] = useState<Partial<Package> | null>(null);

  useEffect(() => {
    loadPackages();
  }, []);

  async function loadPackages() {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/api/admin/packages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPackages(data);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Erro", "Falha ao carregar pacotes");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!editingPkg?.label || !editingPkg?.credits || !editingPkg?.priceCents) {
      Alert.alert("Erro", "Nome, créditos e preço são obrigatórios");
      return;
    }

    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const isNew = !editingPkg.id;
      const url = isNew ? `${API_BASE_URL}/api/admin/packages` : `${API_BASE_URL}/api/admin/packages/${editingPkg.id}`;
      const method = isNew ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editingPkg)
      });

      if (res.ok) {
        loadPackages();
        setModalVisible(false);
        setEditingPkg(null);
      }
    } catch (e) {
      Alert.alert("Erro", "Falha ao salvar pacote");
    }
  }

  async function toggleActive(pkg: Package) {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/api/admin/packages/${pkg.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !pkg.isActive })
      });
      if (res.ok) loadPackages();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#fff", paddingTop: insets.top + (Platform.OS === "web" ? 20 : 10), borderBottomWidth: 1, borderBottomColor: colors.border + "30" }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>Pacotes</Text>
          <TouchableOpacity 
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => { 
              setEditingPkg({ isActive: true, sortOrder: 0, bonusCredits: 0 }); 
              setModalVisible(true); 
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          >
            <MaterialCommunityIcons name="plus" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={packages}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: 40 + insets.bottom }]}
        refreshing={loading}
        onRefresh={loadPackages}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="package-variant-closed" size={64} color={colors.mutedForeground + "20"} />
              <Text style={[styles.empty, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Nenhum pacote cadastrado</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
            <View style={[
            styles.packageCard, 
            { 
              backgroundColor: "#fff", 
              borderColor: item.highlight ? colors.secondary : "transparent",
              borderWidth: item.highlight ? 1.5 : 0,
              borderRadius: 20, 
              opacity: item.isActive ? 1 : 0.6,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 10,
              elevation: 3,
            }
          ]}>
            <View style={[styles.packageIcon, { backgroundColor: colors.primary + "05" }]}>
              <MaterialCommunityIcons name="package-variant-closed" size={24} color={item.highlight ? colors.secondary : colors.primary + "60"} />
            </View>
            
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={[styles.packageName, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>{item.label}</Text>
                {item.highlight && (
                  <View style={[styles.highlightBadge, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.highlightText, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>POPULAR</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.packageDetails, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                {item.credits} créditos {item.bonusCredits > 0 ? `+ ${item.bonusCredits} bônus` : ""}
              </Text>
              <Text style={[styles.packagePrice, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>
                R$ {(item.priceCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </Text>
            </View>
            
            <View style={styles.actions}>
              <TouchableOpacity 
                style={[styles.actionIconButton, { backgroundColor: colors.primary + "05" }]}
                onPress={() => { setEditingPkg(item); setModalVisible(true); }}
              >
                <MaterialCommunityIcons name="pencil" size={18} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionIconButton, { backgroundColor: item.isActive ? colors.secondary + "20" : colors.primary + "05" }]}
                onPress={() => {
                  toggleActive(item);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
              >
                <MaterialCommunityIcons name={item.isActive ? "eye" : "eye-off"} size={18} color={item.isActive ? colors.primary : colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: "#fff", borderRadius: 32 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>
                {editingPkg?.id ? "Editar Pacote" : "Novo Pacote"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>Nome do Pacote</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.primary + "05", color: colors.primary, borderRadius: 16, fontFamily: "Inter_600SemiBold" }]}
                  value={editingPkg?.label}
                  onChangeText={t => setEditingPkg(prev => ({ ...prev!, label: t }))}
                  placeholder="Ex: Start, Gold, Pro..."
                  placeholderTextColor={colors.mutedForeground + "40"}
                />
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>Créditos</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.primary + "05", color: colors.primary, borderRadius: 16, fontFamily: "Inter_600SemiBold" }]}
                    value={String(editingPkg?.credits ?? "")}
                    onChangeText={t => setEditingPkg(prev => ({ ...prev!, credits: Number(t) }))}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>Bônus</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.primary + "05", color: colors.primary, borderRadius: 16, fontFamily: "Inter_600SemiBold" }]}
                    value={String(editingPkg?.bonusCredits ?? "")}
                    onChangeText={t => setEditingPkg(prev => ({ ...prev!, bonusCredits: Number(t) }))}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>Preço (Centavos)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.primary + "05", color: colors.primary, borderRadius: 16, fontFamily: "Inter_600SemiBold" }]}
                  value={String(editingPkg?.priceCents ?? "")}
                  onChangeText={t => setEditingPkg(prev => ({ ...prev!, priceCents: Number(t) }))}
                  keyboardType="number-pad"
                  placeholder="Ex: 1000 para R$ 10,00"
                  placeholderTextColor={colors.mutedForeground + "40"}
                />
              </View>

              <TouchableOpacity 
                style={[styles.toggleRow, { backgroundColor: colors.primary + "05", borderRadius: 16 }]}
                onPress={() => setEditingPkg(prev => ({ ...prev!, highlight: !prev!.highlight }))}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleLabel, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Destaque</Text>
                  <Text style={[styles.toggleSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Marcar como "Mais Popular"</Text>
                </View>
                <MaterialCommunityIcons 
                  name={editingPkg?.highlight ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} 
                  size={24} 
                  color={editingPkg?.highlight ? colors.secondary : colors.primary + "20"} 
                />
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
                <Text style={[styles.saveBtnText, { color: "#fff", fontFamily: "Inter_800ExtraBold" }]}>Salvar Pacote</Text>
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
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20 },
  addBtn: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  
  list: { padding: 20, gap: 16 },
  packageCard: { flexDirection: "row", alignItems: "center", padding: 16, gap: 16 },
  packageIcon: { width: 54, height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  packageName: { fontSize: 16 },
  packageDetails: { fontSize: 12, marginTop: 2 },
  packagePrice: { fontSize: 20, marginTop: 4 },
  
  highlightBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  highlightText: { fontSize: 10 },
  
  actions: { gap: 12 },
  actionIconButton: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  
  emptyContainer: { alignItems: "center", padding: 60, gap: 16 },
  empty: { textAlign: "center", fontSize: 14 },
  
  modalOverlay: { flex: 1, backgroundColor: "rgba(11, 19, 57, 0.6)", justifyContent: "flex-end" },
  modalContent: { padding: 24, gap: 20, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  modalTitle: { fontSize: 24 },
  form: { gap: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 },
  input: { paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  row: { flexDirection: "row", gap: 16, marginBottom: 16 },
  toggleRow: { flexDirection: "row", alignItems: "center", padding: 16, marginBottom: 20 },
  toggleLabel: { fontSize: 15 },
  toggleSub: { fontSize: 12, marginTop: 2 },
  modalButtons: { marginTop: 12 },
  saveBtn: { height: 56, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  saveBtnText: { fontSize: 16 },
});
