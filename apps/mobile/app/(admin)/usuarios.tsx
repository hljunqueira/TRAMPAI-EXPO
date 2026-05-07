import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
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
  Image,
  ActivityIndicator,
} from "react-native";


import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { User } from "@/types";

export default function AdminUsuarios() {
  const colors = useColors();
  const { allUsers, banUser, unbanUser, approveVerification, rejectVerification } = useAuth();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "CLIENT" | "PROVIDER" | "ADMIN">("ALL");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  
  // Estados para Concessão de Créditos
  const [creditsModalVisible, setCreditsModalVisible] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [isSubmittingCredits, setIsSubmittingCredits] = useState(false);

  const { api, fetchAdminData, user: loggedUser } = useAuth();

  const handlePromoteToAdmin = async (targetUser: User) => {
    if (loggedUser?.email !== "henrique@trampai.com.br") {
      Alert.alert("Erro", "Apenas o Super Admin pode realizar esta ação.");
      return;
    }

    Alert.alert(
      "Promover a Admin",
      `Deseja realmente promover ${targetUser.name} a administrador? Esta ação dará acesso total ao painel.`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Promover", 
          onPress: async () => {
            try {
              await api.patch(`/admin/users/${targetUser.id}/role`, { role: "admin" });
              Alert.alert("Sucesso", `${targetUser.name} agora é um administrador!`);
              fetchAdminData();
              setDetailsVisible(false);
            } catch (error) {
              Alert.alert("Erro", "Não foi possível promover o usuário.");
            }
          }
        }
      ]
    );
  };

  const handleGrantCredits = async () => {
    if (!selectedUser || !creditAmount || isSubmittingCredits) return;
    
    setIsSubmittingCredits(true);
    try {
      await api.post(`/admin/users/${selectedUser.id}/grant-credits`, {
        credits: Number(creditAmount),
        reason: creditReason || `${creditAmount} créditos concedidos pelo admin`
      });
      Alert.alert("Sucesso", "Créditos concedidos com sucesso!");
      setCreditsModalVisible(false);
      setCreditAmount("");
      setCreditReason("");
      fetchAdminData();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível conceder créditos.");
    } finally {
      setIsSubmittingCredits(false);
    }
  };

  const handleResetPassword = async (user: User) => {
    Alert.alert(
      "Resetar Senha",
      `Deseja realmente resetar a senha de ${user.name}? Uma nova senha temporária será enviada por e-mail.`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Confirmar", 
          onPress: async () => {
            try {
              await api.post(`/admin/users/${user.id}/reset-password`, {});
              Alert.alert("Sucesso", "E-mail de reset enviado!");
            } catch (error) {
              Alert.alert("Erro", "Falha ao resetar senha.");
            }
          }
        }
      ]
    );
  };


  const filteredUsers = allUsers
    .filter((u) => {
      const uRole = u.role?.toUpperCase();
      if (roleFilter !== "ALL" && uRole !== roleFilter) return false;
      if (search && !u.name?.toLowerCase().includes(search.toLowerCase()) && !u.email?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

  async function handleBan(u: User) {
    if (u.role?.toLowerCase() === "admin") {
      Alert.alert("Erro", "Não é possível banir um administrador.");
      return;
    }
    
    Alert.alert(
      "Banir usuário",
      `Deseja banir ${u.name}? Escolha o motivo:`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Spam / Abuso",
          style: "destructive",
          onPress: () => {
            if (u.id) {
              banUser(u.id, "Spam / Comportamento abusivo");
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
        {
          text: "Dados Falsos",
          style: "destructive",
          onPress: () => {
            if (u.id) {
              banUser(u.id, "Perfil com informações falsas");
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  }

  function handleApprove(u: User) {
    if (!u.id) return;
    Alert.alert("Aprovar verificação", `Aprovar conta de ${u.name}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Aprovar",
        onPress: () => {
          approveVerification(u.id!);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }

  function handleReject(u: User) {
    if (!u.id) return;
    Alert.alert("Rejeitar verificação", `Rejeitar conta de ${u.name}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Rejeitar",
        style: "destructive",
        onPress: () => rejectVerification(u.id!, "Documentos insuficientes"),
      },
    ]);
  }

  function handleUnban(u: User) {
    if (!u.id) return;
    Alert.alert("Desbanir usuário", `Deseja restaurar o acesso de ${u.name}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Desbanir",
        onPress: () => {
          unbanUser(u.id!);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }

  const getInitials = (name?: string) => {
    if (!name) return "??";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#fff", paddingTop: insets.top + (Platform.OS === "web" ? 20 : 10), borderBottomWidth: 1, borderBottomColor: colors.border + "30" }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>Gerenciar Usuários</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={[styles.searchWrapper, { backgroundColor: colors.primary + "05", borderRadius: 16 }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.primary, fontFamily: "Inter_500Medium" }]}
            placeholder="Buscar por nome ou email..."
            placeholderTextColor={colors.mutedForeground + "80"}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {(["ALL", "CLIENT", "PROVIDER", "ADMIN"] as const).map((role) => (
            <TouchableOpacity
              key={role}
              style={[
                styles.filterChip, 
                { 
                  backgroundColor: roleFilter === role ? colors.primary : "#fff",
                  borderColor: roleFilter === role ? colors.primary : colors.border + "50",
                  borderWidth: 1.5,
                  borderRadius: 100 
                }
              ]}
              onPress={() => {
                setRoleFilter(role);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={[
                styles.filterText, 
                { 
                  fontFamily: roleFilter === role ? "Inter_700Bold" : "Inter_600SemiBold",
                  color: roleFilter === role ? "#fff" : colors.mutedForeground
                }
              ]}>
                {role === "ALL" ? "Todos" : role === "CLIENT" ? "Clientes" : role === "PROVIDER" ? "Prestadores" : "Admins"}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={[styles.listCount, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
            {filteredUsers.length} usuários encontrados
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="account-search-outline" size={64} color={colors.mutedForeground + "20"} />
            <Text style={[styles.emptyTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Nenhum resultado</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Tente ajustar seus filtros de busca</Text>
          </View>
        }
        renderItem={({ item: u }) => {
          const uRole = u.role?.toLowerCase();
          const isProvider = uRole === "provider" || u.isProvider;
          const isPending = uRole !== "admin" && isProvider && u.verificationStatus === "PENDING";
          const isBanned = u.isBanned || !!(u as any).bannedAt;
          
          return (
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => {
                setSelectedUser(u);
                setDetailsVisible(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[
                styles.userCard, 
                { 
                  backgroundColor: "#fff", 
                  borderRadius: 24, 
                  borderColor: isPending ? colors.secondary : "transparent",
                  borderWidth: isPending ? 1.5 : 0,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 10,
                  elevation: 3,
                }
              ]}
            >
              <View style={styles.userHeader}>
                <View style={[styles.userAvatar, { backgroundColor: isProvider ? colors.primary + "10" : colors.primary + "05", overflow: 'hidden' }]}>
                  {u.avatarUrl ? (
                    <Image source={{ uri: u.avatarUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <Text style={[styles.userInitials, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                      {getInitials(u.name)}
                    </Text>
                  )}
                </View>
                
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.userName, { color: colors.primary, fontFamily: "Inter_700Bold" }]} numberOfLines={1}>
                      {u.name}
                    </Text>
                    {isBanned && (
                      <View style={[styles.badge, { backgroundColor: "#ef444415" }]}>
                        <Text style={[styles.badgeText, { color: "#ef4444", fontFamily: "Inter_800ExtraBold" }]}>BANIDO</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.userEmail, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
                    {u.email}
                  </Text>
                </View>

                <View style={[
                  styles.roleLabel, 
                  { 
                    backgroundColor: 
                      uRole === "admin" ? colors.secondary + "20" :
                      isProvider ? colors.primary + "08" : 
                      colors.primary + "05" 
                  }
                ]}>
                  <Text style={[
                    styles.roleLabelText, 
                    { 
                      color: uRole === "admin" ? colors.secondary : colors.primary, 
                      fontFamily: "Inter_800ExtraBold" 
                    }
                  ]}>
                    {uRole === "admin" ? "ADMIN" : isProvider ? "PRESTADOR" : "CLIENTE"}
                  </Text>
                </View>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="wallet" size={14} color={colors.primary + "60"} />
                  <Text style={[styles.infoText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>{u.creditBalance} cr</Text>
                </View>
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="map-marker" size={14} color={colors.primary + "60"} />
                  <Text style={[styles.infoText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
                    {u.neighborhood ? `${u.neighborhood}, ${u.city}` : u.city || "S/ Localização"}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="shield-check" size={14} color={u.verificationStatus === "APPROVED" ? colors.secondary : colors.primary + "40"} />
                  <Text style={[
                    styles.infoText, 
                    { 
                      color: u.verificationStatus === "APPROVED" ? colors.secondary : u.verificationStatus === "REJECTED" ? "#ef4444" : colors.primary + "60",
                      fontFamily: "Inter_700Bold" 
                    }
                  ]}>
                    {u.verificationStatus === "APPROVED" ? "APROVADO" : 
                     u.verificationStatus === "REJECTED" ? "REJEITADO" : 
                     "PENDENTE"}
                  </Text>
                </View>
              </View>

              {isPending && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
                    onPress={() => handleApprove(u)}
                  >
                    <MaterialCommunityIcons name="check-decagram" size={16} color={colors.primary} />
                    <Text style={[styles.actionBtnText, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>APROVAR</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#ef444415", borderWidth: 1, borderColor: "#ef444420" }]}
                    onPress={() => handleReject(u)}
                  >
                    <Text style={[styles.actionBtnText, { color: "#ef4444", fontFamily: "Inter_800ExtraBold" }]}>REJEITAR</Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={[styles.infoItem, { width: "100%", marginTop: 8 }]}>
                <MaterialCommunityIcons name="gesture-tap" size={14} color={colors.primary + "40"} />
                <Text style={[styles.infoText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Toque para ver detalhes</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Modal de Detalhes do Usuário */}
      <Modal
        visible={detailsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: "#fff", borderTopLeftRadius: 32, borderTopRightRadius: 32 }]}>
            <View style={[styles.modalIndicator, { backgroundColor: colors.border + "30" }]} />
            
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>Detalhes do Usuário</Text>
              <TouchableOpacity onPress={() => setDetailsVisible(false)} style={[styles.closeBtn, { backgroundColor: colors.primary + "05" }]}>
                <MaterialCommunityIcons name="close" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
                <View style={styles.profileSection}>
                  <View style={[styles.largeAvatar, { backgroundColor: colors.primary + "05", overflow: 'hidden' }]}>
                    {selectedUser.avatarUrl ? (
                      <Image source={{ uri: selectedUser.avatarUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <Text style={[styles.largeInitials, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                        {getInitials(selectedUser.name)}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.profileName, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>{selectedUser.name}</Text>
                  <View style={[styles.modalRoleBadge, { backgroundColor: (selectedUser.role === "provider" || selectedUser.isProvider) ? colors.secondary + "20" : colors.primary + "10" }]}>
                    <Text style={[styles.modalRoleText, { color: (selectedUser.role === "provider" || selectedUser.isProvider) ? colors.secondary : colors.primary, fontFamily: "Inter_800ExtraBold" }]}>
                      {(selectedUser.role === "provider" || selectedUser.isProvider) ? "PRESTADOR DE SERVIÇOS" : "CLIENTE"}
                    </Text>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View style={[styles.statItem, { backgroundColor: colors.primary + "03" }]}>
                    <Text style={[styles.statValue, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>{selectedUser.creditBalance}</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>Créditos</Text>
                  </View>
                  <View style={[styles.statItem, { backgroundColor: colors.primary + "03" }]}>
                    <Text style={[styles.statValue, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>
                      {selectedUser.verificationStatus === "APPROVED" ? "Aprovado" : 
                       selectedUser.verificationStatus === "REJECTED" ? "Rejeitado" : 
                       "Pendente"}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>Status</Text>
                  </View>
                </View>

                <View style={styles.infoSection}>
                  <Text style={[styles.infoSectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Informações de Contato</Text>
                  <View style={[styles.infoCard, { backgroundColor: colors.primary + "03" }]}>
                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="email" size={18} color={colors.primary + "60"} />
                      <Text style={[styles.infoRowText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>{selectedUser.email}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="phone" size={18} color={colors.primary + "60"} />
                      <Text style={[styles.infoRowText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>{selectedUser.phone || "Não informado"}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="map-marker" size={18} color={colors.primary + "60"} />
                      <Text style={[styles.infoRowText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
                        {selectedUser.neighborhood ? `${selectedUser.neighborhood}, ` : ""}{selectedUser.city || "Sem cidade"}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="ticket-percent" size={18} color={colors.primary + "60"} />
                      <Text style={[styles.infoRowText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Código: {selectedUser.referralCode || "---"}</Text>
                    </View>
                    {(selectedUser as any).referredBy && (
                      <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="account-arrow-left" size={18} color={colors.secondary} />
                        <Text style={[styles.infoRowText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>Indicado por ID: {(selectedUser as any).referredBy}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {selectedUser.role === "provider" && selectedUser.providerBio && (
                  <View style={styles.infoSection}>
                    <Text style={[styles.infoSectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Sobre o Profissional</Text>
                    <View style={[styles.infoCard, { backgroundColor: colors.primary + "03" }]}>
                      <Text style={[styles.bioText, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>{selectedUser.providerBio}</Text>
                    </View>
                  </View>
                )}

                {selectedUser.role === "provider" && (
                  <View style={styles.infoSection}>
                    <Text style={[styles.infoSectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Documentos de Identificação</Text>
                    <View style={styles.kycRow}>
                      <View style={styles.kycItem}>
                        <Text style={[styles.kycLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>Documento (Frente)</Text>
                        <TouchableOpacity 
                          disabled={!selectedUser.documentUrl}
                          onPress={() => Alert.alert("Visualizar", "Abrir imagem do documento?")}
                          style={[styles.kycImagePlaceholder, { backgroundColor: colors.primary + "05", borderStyle: 'dashed', borderWidth: 1, borderColor: colors.primary + "20" }]}
                        >
                          {selectedUser.documentUrl ? (
                            <Image source={{ uri: selectedUser.documentUrl }} style={styles.kycImage} />
                          ) : (
                            <View style={styles.kycMissing}>
                              <MaterialCommunityIcons name="image-off-outline" size={24} color={colors.primary + "20"} />
                              <Text style={{ fontSize: 10, color: colors.primary + "30" }}>Não enviado</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.kycItem}>
                        <Text style={[styles.kycLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>Selfie c/ Documento</Text>
                        <TouchableOpacity 
                          disabled={!selectedUser.selfieUrl}
                          onPress={() => Alert.alert("Visualizar", "Abrir selfie?")}
                          style={[styles.kycImagePlaceholder, { backgroundColor: colors.primary + "05", borderStyle: 'dashed', borderWidth: 1, borderColor: colors.primary + "20" }]}
                        >
                          {selectedUser.selfieUrl ? (
                            <Image source={{ uri: selectedUser.selfieUrl }} style={styles.kycImage} />
                          ) : (
                            <View style={styles.kycMissing}>
                              <MaterialCommunityIcons name="camera-off-outline" size={24} color={colors.primary + "20"} />
                              <Text style={{ fontSize: 10, color: colors.primary + "30" }}>Não enviado</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}

                {selectedUser.role === "provider" && selectedUser.portfolioImages && selectedUser.portfolioImages.length > 0 && (
                  <View style={styles.infoSection}>
                    <Text style={[styles.infoSectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Portfólio de Trabalhos</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.portfolioScroll}>
                      {selectedUser.portfolioImages.map((img, index) => (
                        <View key={index} style={styles.portfolioItem}>
                          <Image source={{ uri: img.url }} style={styles.portfolioImage} />
                          {img.description && (
                            <Text style={[styles.portfolioDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
                              {img.description}
                            </Text>
                          )}
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}


                {selectedUser.role === "provider" && selectedUser.verificationStatus === "PENDING" && (
                  <View style={styles.infoSection}>
                    <Text style={[styles.infoSectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Ações de Verificação</Text>
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.secondary, flex: 1.5 }]}
                        onPress={() => {
                          handleApprove(selectedUser);
                          setDetailsVisible(false);
                        }}
                      >
                        <MaterialCommunityIcons name="check-decagram" size={20} color={colors.primary} />
                        <Text style={[styles.actionBtnText, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>APROVAR CONTA</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: "#ef444415", borderWidth: 1, borderColor: "#ef444420", flex: 1 }]}
                        onPress={() => {
                          handleReject(selectedUser);
                          setDetailsVisible(false);
                        }}
                      >
                        <Text style={[styles.actionBtnText, { color: "#ef4444", fontFamily: "Inter_800ExtraBold" }]}>REJEITAR</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {selectedUser.role?.toLowerCase() !== "admin" && (
                  <View style={styles.actionSection}>
                    <TouchableOpacity 
                      style={[styles.modalActionBtn, { backgroundColor: colors.primary, marginBottom: 12 }]}
                      onPress={() => {
                        setCreditsModalVisible(true);
                      }}
                    >
                      <MaterialCommunityIcons name="plus-circle" size={20} color="#fff" />
                      <Text style={[styles.modalActionText, { color: "#fff", fontFamily: "Inter_800ExtraBold" }]}>
                        CONCEDER CRÉDITOS
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.modalActionBtn, { backgroundColor: colors.muted + "40", marginBottom: 12 }]}
                      onPress={() => handleResetPassword(selectedUser)}
                    >
                      <MaterialCommunityIcons name="lock-reset" size={20} color={colors.foreground} />
                      <Text style={[styles.modalActionText, { color: colors.foreground, fontFamily: "Inter_800ExtraBold" }]}>
                        RESETAR SENHA
                      </Text>
                    </TouchableOpacity>

                    {loggedUser?.email === "henrique@trampai.com.br" && selectedUser.role !== "admin" && (
                      <TouchableOpacity 
                        style={[styles.modalActionBtn, { backgroundColor: colors.secondary, marginBottom: 12 }]}
                        onPress={() => handlePromoteToAdmin(selectedUser)}
                      >
                        <MaterialCommunityIcons name="shield-star" size={20} color={colors.primary} />
                        <Text style={[styles.modalActionText, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>
                          PROMOVER A ADMIN
                        </Text>
                      </TouchableOpacity>
                    )}

                    {selectedUser.role !== "admin" && (
                      <TouchableOpacity 
                        style={[styles.modalActionBtn, { backgroundColor: colors.primary + "10", marginBottom: 12, borderWidth: 1, borderColor: colors.primary + "20" }]}
                        onPress={async () => {
                          const newRole = (selectedUser.role === "provider" || selectedUser.isProvider) ? "client" : "provider";
                          try {
                            await api.patch(`/admin/users/${selectedUser.id}/role`, { role: newRole });
                            Alert.alert("Sucesso", `Cargo alterado para ${newRole === 'provider' ? 'Prestador' : 'Cliente'}`);
                            fetchAdminData();
                            setDetailsVisible(false);
                          } catch (e: any) {
                            const errorMsg = e.response?.data?.error || e.message || "Erro desconhecido";
                            Alert.alert("Erro", `Falha ao alterar cargo: ${errorMsg}`);
                          }
                        }}
                      >
                        <MaterialCommunityIcons name="swap-horizontal" size={20} color={colors.primary} />
                        <Text style={[styles.modalActionText, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>
                          ALTERAR PARA {(selectedUser.role === "provider" || selectedUser.isProvider) ? "CLIENTE" : "PRESTADOR"}
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity 
                      style={[styles.modalActionBtn, { backgroundColor: selectedUser.isBanned ? colors.secondary : "#ef4444" }]}
                      onPress={() => {
                        if (selectedUser.isBanned) {
                          handleUnban(selectedUser);
                        } else {
                          handleBan(selectedUser);
                        }
                        setDetailsVisible(false);
                      }}
                    >
                      <MaterialCommunityIcons name={selectedUser.isBanned ? "check-circle" : "account-off"} size={20} color="#fff" />
                      <Text style={[styles.modalActionText, { color: "#fff", fontFamily: "Inter_800ExtraBold" }]}>
                        {selectedUser.isBanned ? "DESBANIR USUÁRIO" : "BANIR USUÁRIO"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de Concessão de Créditos */}
      <Modal visible={creditsModalVisible} animationType="fade" transparent>
        <View style={styles.creditsOverlay}>
          <View style={[styles.creditsContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.creditsTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Conceder Créditos</Text>
            <Text style={[styles.creditsSub, { color: colors.mutedForeground }]}>Usuário: {selectedUser?.name}</Text>
            
            <View style={styles.creditInputGroup}>
              <Text style={[styles.creditLabel, { color: colors.foreground }]}>Quantidade</Text>
              <TextInput
                style={[styles.creditInput, { color: colors.foreground, borderColor: colors.border }]}
                keyboardType="numeric"
                value={creditAmount}
                onChangeText={setCreditAmount}
                placeholder="Ex: 50"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            <View style={styles.creditInputGroup}>
              <Text style={[styles.creditLabel, { color: colors.foreground }]}>Motivo / Justificativa</Text>
              <TextInput
                style={[styles.creditInput, { color: colors.foreground, borderColor: colors.border, height: 80 }]}
                multiline
                value={creditReason}
                onChangeText={setCreditReason}
                placeholder="Ex: Bônus por indicação manual"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            <View style={styles.creditActions}>
              <TouchableOpacity 
                style={[styles.creditBtn, { backgroundColor: colors.muted + "20" }]} 
                onPress={() => setCreditsModalVisible(false)}
              >
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.creditBtn, { backgroundColor: colors.primary }]} 
                onPress={handleGrantCredits}
                disabled={isSubmittingCredits}
              >
                {isSubmittingCredits ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>Confirmar</Text>
                )}
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: "100%",
  },
  filterRow: {
    flexDirection: "row",
    gap: 10,
    paddingRight: 20,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  filterText: {
    fontSize: 14,
  },
  list: {
    padding: 20,
    gap: 16,
  },
  listCount: {
    fontSize: 12,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  empty: {
    alignItems: "center",
    padding: 48,
    gap: 12,
    marginTop: 24,
  },
  emptyTitle: {
    fontSize: 18,
  },
  emptySub: {
    fontSize: 14,
    textAlign: "center",
  },
  userCard: {
    padding: 16,
    gap: 16,
  },
  userHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  userAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  userInitials: {
    fontSize: 18,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    flex: 1,
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  roleLabel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleLabelText: {
    fontSize: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
  },
  divider: {
    height: 1,
    width: "100%",
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontSize: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 14,
    gap: 8,
  },
  actionBtnText: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  banBtnText: { fontSize: 13 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(11, 19, 57, 0.6)", justifyContent: "flex-end" },
  modalContent: { height: "85%", padding: 24, gap: 20 },
  modalIndicator: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 10 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 22 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  modalBody: { gap: 24, paddingBottom: 40 },
  profileSection: { alignItems: "center", gap: 12 },
  largeAvatar: { width: 100, height: 100, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  largeInitials: { fontSize: 36 },
  profileName: { fontSize: 24, textAlign: "center" },
  modalRoleBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  modalRoleText: { fontSize: 12, letterSpacing: 0.5 },
  statsRow: { flexDirection: "row", gap: 12 },
  statItem: { flex: 1, padding: 16, borderRadius: 20, alignItems: "center", gap: 4 },
  statValue: { fontSize: 20 },
  statLabel: { fontSize: 12, textTransform: "uppercase", letterSpacing: 1, opacity: 0.6 },
  infoSection: { gap: 12 },
  infoSectionTitle: { fontSize: 16 },
  infoCard: { padding: 20, borderRadius: 24, gap: 16 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoRowText: { fontSize: 15 },
  bioText: { fontSize: 15, lineHeight: 24 },
  actionSection: { marginTop: 12 },
  modalActionBtn: { height: 60, borderRadius: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  modalActionText: { fontSize: 16, letterSpacing: 1 },
  kycRow: { flexDirection: "row", gap: 12 },
  kycItem: { flex: 1, gap: 8 },
  kycLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  kycImagePlaceholder: { height: 160, borderRadius: 16, overflow: "hidden" },
  kycImage: { width: "100%", height: "100%", resizeMode: "cover" },
  kycMissing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  portfolioScroll: { gap: 12 },
  portfolioItem: { width: 140, gap: 8 },
  portfolioImage: { width: 140, height: 100, borderRadius: 12 },
  portfolioDesc: { fontSize: 11 },
  creditsOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 24 },
  creditsContent: { borderRadius: 24, padding: 24, gap: 16 },
  creditsTitle: { fontSize: 20 },
  creditsSub: { fontSize: 14, marginTop: -8 },
  creditInputGroup: { gap: 8 },
  creditLabel: { fontSize: 14, fontWeight: "600" },
  creditInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16 },
  creditActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  creditBtn: { flex: 1, height: 48, borderRadius: 12, justifyContent: "center", alignItems: "center" },
});


