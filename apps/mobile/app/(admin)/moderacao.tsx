import { MaterialCommunityIcons } from "@expo/vector-icons";
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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

interface Job {
  id: string;
  title: string;
  status: string;
  location: string;
  createdAt: string;
  category: { name: string; icon: string };
  client: { name: string; avatarUrl: string | null };
}

export default function ModeracaoAdmin() {
  const colors = useColors();
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "open" | "closed" | "cancelled">("ALL");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/jobs");
      setJobs(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (jobId: string, newStatus: string) => {
    try {
      await api.patch(`/admin/jobs/${jobId}/status`, { status: newStatus });
      fetchJobs();
    } catch (error) {
      Alert.alert("Erro", "Falha ao atualizar status do serviço.");
    }
  };

  const filteredJobs = jobs.filter(j => statusFilter === "ALL" || j.status === statusFilter);

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
        <Text style={[styles.title, { color: colors.foreground }]}>Moderação</Text>
        <View style={styles.filterRow}>
          {(["ALL", "open", "closed", "cancelled"] as const).map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setStatusFilter(f)}
              style={[
                styles.filterBtn,
                { backgroundColor: statusFilter === f ? colors.primary : colors.muted + "20" }
              ]}
            >
              <Text style={{ color: statusFilter === f ? "#fff" : colors.foreground, fontSize: 10, fontWeight: "bold" }}>
                {f.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchJobs().finally(() => setRefreshing(false)); }} />
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary + "10" }]}>
                <MaterialCommunityIcons name={item.category?.icon as any || "briefcase"} size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.jobTitle, { color: colors.foreground }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.clientName, { color: colors.mutedForeground }]}>Por {item.client.name}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: item.status === "open" ? colors.secondary + "20" : colors.muted + "20" }]}>
                <Text style={[styles.statusText, { color: item.status === "open" ? colors.secondary : colors.mutedForeground }]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.cardActions}>
              {item.status === "open" ? (
                <>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: colors.destructive + "10" }]}
                    onPress={() => handleUpdateStatus(item.id, "cancelled")}
                  >
                    <MaterialCommunityIcons name="close-circle-outline" size={18} color={colors.destructive} />
                    <Text style={[styles.actionText, { color: colors.destructive }]}>BLOQUEAR</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: colors.secondary + "10" }]}
                    onPress={() => handleUpdateStatus(item.id, "closed")}
                  >
                    <MaterialCommunityIcons name="check-decagram-outline" size={18} color={colors.secondary} />
                    <Text style={[styles.actionText, { color: colors.secondary }]}>FINALIZAR</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: colors.primary + "10" }]}
                  onPress={() => handleUpdateStatus(item.id, "open")}
                >
                  <MaterialCommunityIcons name="refresh" size={18} color={colors.primary} />
                  <Text style={[styles.actionText, { color: colors.primary }]}>REABRIR</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 20, gap: 16 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  filterRow: { flexDirection: "row", gap: 8 },
  filterBtn: { paddingHorizontal: 12, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  list: { paddingHorizontal: 20, paddingBottom: 100, gap: 16 },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 16 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  jobTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  clientName: { fontSize: 13, fontFamily: "Inter_400Regular" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontFamily: "Inter_800ExtraBold" },
  cardActions: { flexDirection: "row", gap: 10 },
  actionBtn: { flex: 1, height: 44, borderRadius: 12, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  actionText: { fontSize: 12, fontFamily: "Inter_700Bold" },
});
