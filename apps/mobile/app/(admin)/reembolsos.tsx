import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";


interface Lead {
  id: string;
  jobTitle: string;
  providerName: string;
  providerId: string;
  cost: number;
  refundedAt: string | null;
  createdAt: string;
}

export default function ReembolsosAdmin() {
  const colors = useColors();
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      // Endpoint para listar leads desbloqueados recentemente
      const response = await api.get("/admin/leads/recent");
      setLeads(response?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = (lead: Lead) => {
    Alert.alert(
      "Confirmar Reembolso",
      `Deseja devolver ${lead.cost} créditos para ${lead.providerName}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              await api.post(`/admin/leads/${lead.id}/refund`, {});
              Alert.alert("Sucesso", "Créditos estornados com sucesso!");
              fetchLeads();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível processar o reembolso.");
            }
          },
        },
      ]
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Reembolsos</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Gerencie estornos de leads</Text>
        </View>
      </View>

      <FlatList
        data={leads}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLeads().finally(() => setRefreshing(false)); }} />
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={styles.jobInfo}>
                <Text style={[styles.jobTitle, { color: colors.foreground }]}>{item.jobTitle}</Text>
                <Text style={[styles.providerName, { color: colors.mutedForeground }]}>Profissional: {item.providerName}</Text>
              </View>
              <View style={[styles.costBadge, { backgroundColor: colors.primary + "10" }]}>
                <Text style={[styles.costText, { color: colors.primary }]}>{item.cost} CR</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border + "50" }]} />

            <View style={styles.cardFooter}>
              <Text style={[styles.date, { color: colors.mutedForeground }]}>
                {new Date(item.createdAt).toLocaleDateString("pt-BR")}
              </Text>
              
              {item.refundedAt ? (
                <View style={styles.refundedBadge}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={colors.secondary} />
                  <Text style={[styles.refundedText, { color: colors.secondary }]}>REEMBOLSADO</Text>
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.refundBtn, { backgroundColor: colors.destructive + "10" }]}
                  onPress={() => handleRefund(item)}
                >
                  <Text style={[styles.refundBtnText, { color: colors.destructive }]}>REEMBOLSAR</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="cash-off" size={48} color={colors.mutedForeground + "40"} />
            <Text style={{ color: colors.mutedForeground }}>Nenhum lead encontrado para reembolso.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 20, flexDirection: "row", alignItems: "center", gap: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 4 },
  list: { padding: 20, gap: 16 },
  card: { borderRadius: 20, borderWidth: 1, padding: 16 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  jobInfo: { flex: 1, gap: 4 },
  jobTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  providerName: { fontSize: 13, fontFamily: "Inter_500Medium" },
  costBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  costText: { fontSize: 12, fontFamily: "Inter_800ExtraBold" },
  divider: { height: 1, marginVertical: 12 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  date: { fontSize: 12 },
  refundBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  refundBtnText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  refundedBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  refundedText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 100, gap: 12 },
});
