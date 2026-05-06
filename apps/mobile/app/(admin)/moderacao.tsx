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
  Modal,
  Linking,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

interface Job {
  id: string;
  title: string;
  status: string;
  location: string;
  createdAt: string;
  category: { name: string; icon: string };
  client: { 
    id: string; 
    name: string; 
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    jobsPostedCount: number;
  };
  description?: string;
  budget?: number;
}

export default function ModeracaoAdmin() {
  const colors = useColors();
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "open" | "closed" | "cancelled">("ALL");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

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
          {[
            { id: "ALL", label: "TODOS" },
            { id: "open", label: "ABERTOS" },
            { id: "closed", label: "FINALIZADOS" },
            { id: "cancelled", label: "CANCELADOS" },
          ].map(f => (
            <TouchableOpacity
              key={f.id}
              onPress={() => setStatusFilter(f.id as any)}
              style={[
                styles.filterBtn,
                { backgroundColor: statusFilter === f.id ? colors.primary : colors.muted + "20" }
              ]}
            >
              <Text style={{ color: statusFilter === f.id ? "#fff" : colors.foreground, fontSize: 10, fontWeight: "bold" }}>
                {f.label}
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
          <TouchableOpacity 
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              setSelectedJob(item);
              setModalVisible(true);
            }}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary + "10" }]}>
                <MaterialCommunityIcons name={item.category?.icon as any || "briefcase"} size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.jobTitle, { color: colors.foreground }]} numberOfLines={1}>{item.title}</Text>
                <View style={styles.clientRow}>
                  {item.client.avatarUrl ? (
                    <Image source={{ uri: item.client.avatarUrl }} style={styles.miniAvatar} />
                  ) : (
                    <MaterialCommunityIcons name="account-circle" size={16} color={colors.mutedForeground} />
                  )}
                  <Text style={[styles.clientName, { color: colors.mutedForeground }]}>{item.client.name}</Text>
                </View>
              </View>
              <View style={[
                styles.statusBadge, 
                { 
                  backgroundColor: 
                    item.status === "open" ? colors.secondary + "20" : 
                    item.status === "cancelled" ? colors.destructive + "10" : 
                    colors.muted + "20" 
                }
              ]}>
                <Text style={[
                  styles.statusText, 
                  { 
                    color: 
                      item.status === "open" ? colors.secondary : 
                      item.status === "cancelled" ? colors.destructive : 
                      colors.mutedForeground 
                  }
                ]}>
                  {item.status === "open" ? "ABERTO" : 
                   item.status === "closed" ? "FINALIZADO" : 
                   "CANCELADO"}
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
          </TouchableOpacity>
        )}
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Detalhes da Moderação</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {selectedJob && (
              <FlatList
                data={[1]}
                keyExtractor={() => "1"}
                renderItem={() => (
                  <View style={{ gap: 24 }}>
                    {/* Job Section */}
                    <View style={styles.detailSection}>
                      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SERVIÇO</Text>
                      <Text style={[styles.detailTitle, { color: colors.foreground }]}>{selectedJob.title}</Text>
                      <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.mutedForeground} />
                        <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>{selectedJob.location}</Text>
                      </View>
                    </View>

                    {/* Client Section */}
                    <View style={[styles.clientCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginBottom: 12 }]}>SOLICITANTE</Text>
                      <View style={styles.clientHeader}>
                        {selectedJob.client.avatarUrl ? (
                          <Image source={{ uri: selectedJob.client.avatarUrl }} style={styles.largeAvatar} />
                        ) : (
                          <View style={[styles.largeAvatar, { backgroundColor: colors.primary + "10", justifyContent: 'center', alignItems: 'center' }]}>
                            <MaterialCommunityIcons name="account" size={40} color={colors.primary} />
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.clientNameText, { color: colors.foreground }]}>{selectedJob.client.name}</Text>
                          <Text style={[styles.clientEmail, { color: colors.mutedForeground }]}>{selectedJob.client.email}</Text>
                        </View>
                      </View>

                      <View style={styles.clientStats}>
                        <View style={styles.statBox}>
                          <Text style={[styles.statValue, { color: colors.primary }]}>{selectedJob.client.jobsPostedCount}</Text>
                          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Postagens</Text>
                        </View>
                        <TouchableOpacity 
                          style={[styles.whatsappBtn, { backgroundColor: "#25D366" }]}
                          onPress={() => Linking.openURL(`whatsapp://send?phone=${selectedJob.client.phone}`)}
                        >
                          <MaterialCommunityIcons name="whatsapp" size={20} color="#fff" />
                          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 13 }}>CONTATO</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Actions in Modal */}
                    <View style={{ gap: 12, marginBottom: 20 }}>
                      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>AÇÕES RÁPIDAS</Text>
                      <TouchableOpacity 
                        style={[styles.modalActionBtn, { backgroundColor: colors.destructive }]}
                        onPress={() => {
                          handleUpdateStatus(selectedJob.id, "cancelled");
                          setModalVisible(false);
                        }}
                      >
                        <Text style={{ color: "#fff", fontWeight: "bold" }}>BLOQUEAR SERVIÇO</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
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
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  miniAvatar: { width: 16, height: 16, borderRadius: 8 },
  clientName: { fontSize: 13, fontFamily: "Inter_400Regular" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontFamily: "Inter_800ExtraBold" },
  cardActions: { flexDirection: "row", gap: 10 },
  actionBtn: { flex: 1, height: 44, borderRadius: 12, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  actionText: { fontSize: 12, fontFamily: "Inter_700Bold" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  detailSection: { gap: 8 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_800ExtraBold", letterSpacing: 1 },
  detailTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  clientCard: { padding: 20, borderRadius: 24, borderWidth: 1, gap: 16 },
  clientHeader: { flexDirection: "row", alignItems: "center", gap: 16 },
  largeAvatar: { width: 64, height: 64, borderRadius: 32 },
  clientNameText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  clientEmail: { fontSize: 14, fontFamily: "Inter_400Regular" },
  clientStats: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  statBox: { alignItems: "center" },
  statValue: { fontSize: 20, fontFamily: "Inter_800ExtraBold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  whatsappBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, height: 44, borderRadius: 22 },
  modalActionBtn: { height: 56, borderRadius: 16, justifyContent: "center", alignItems: "center" },
});
