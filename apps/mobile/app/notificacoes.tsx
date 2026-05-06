// Refresh trigger
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth, API_BASE_URL } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import * as SecureStore from "expo-secure-store";

interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
  data?: any;
}

export default function NotificacoesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      const token = await SecureStore.getItemAsync("trampai_auth_token");
      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function markAsRead(id: string) {
    try {
      const token = await SecureStore.getItemAsync("trampai_auth_token");
      await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error(error);
    }
  }

  async function markAllAsRead() {
    try {
      const token = await SecureStore.getItemAsync("trampai_auth_token");
      await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error(error);
    }
  }

  function handleNotificationPress(notif: Notification) {
    if (!notif.read) markAsRead(notif.id);

    // Navegação inteligente baseada no tipo
    switch (notif.type) {
      case "new_job":
        // Se for prestador, vai pro mural. Se for admin, pode ir ver o job.
        if (user?.role === "admin") {
          router.push("/(admin)");
        } else {
          router.push("/(provider)/mural");
        }
        break;
      
      case "lead_unlocked":
        router.push("/(client)");
        break;
      
      case "verification":
        if (user?.role === "admin") {
          router.push("/(admin)/usuarios");
        } else {
          const targetPath = user?.isProvider ? "/(provider)/perfil" : "/(client)/perfil";
          // @ts-ignore
          router.push(targetPath);
        }
        break;

      case "admin_alert":
        if (user?.role === "admin") {
          router.push("/(admin)/usuarios");
        }
        break;

      case "purchase":
        const walletPath = user?.isProvider ? "/(provider)/carteira" : "/(client)/carteira";
        // @ts-ignore
        router.push(walletPath);
        break;

      default:
        // Apenas marca como lida (já feito acima)
        break;
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "new_job": return "briefcase-plus-outline";
      case "lead_unlocked": return "account-check-outline";
      case "verification": return "shield-check-outline";
      case "purchase": return "wallet-outline";
      case "admin_alert": return "shield-alert-outline";
      default: return "bell-outline";
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "new_job": return colors.primary;
      case "lead_unlocked": return colors.secondary;
      case "verification": return "#22c55e";
      case "purchase": return colors.accent;
      case "admin_alert": return "#ef4444";
      default: return colors.mutedForeground;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomWidth: 1, borderBottomColor: colors.border + "30", backgroundColor: "#fff" }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: "Inter_700Bold", color: colors.primary }]}>Notificações</Text>
        <TouchableOpacity onPress={markAllAsRead}>
          <Text style={{ color: colors.primary, fontSize: 12, fontFamily: "Inter_600SemiBold" }}>Ler todas</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="bell-off-outline" size={48} color={colors.mutedForeground + "40"} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Nenhuma notificação por aqui.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.notifCard, { backgroundColor: item.read ? "transparent" : colors.primary + "05", borderBottomColor: colors.border + "20" }]}
              onPress={() => handleNotificationPress(item)}
            >
              <View style={[styles.iconBox, { backgroundColor: getIconColor(item.type) + "15" }]}>
                <MaterialCommunityIcons name={getIcon(item.type)} size={22} color={getIconColor(item.type)} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.notifTitle, { color: colors.primary, fontFamily: item.read ? "Inter_600SemiBold" : "Inter_700Bold" }]}>{item.title}</Text>
                <Text style={[styles.notifBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{item.body}</Text>
                <Text style={[styles.notifDate, { color: colors.mutedForeground + "80" }]}>
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: ptBR })}
                </Text>
              </View>
              {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 15 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginLeft: -10 },
  headerTitle: { fontSize: 18, flex: 1, marginLeft: 10 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 100, gap: 16 },
  emptyText: { fontSize: 15 },
  notifCard: { flexDirection: "row", padding: 20, borderBottomWidth: 1, gap: 16, alignItems: "flex-start" },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  notifTitle: { fontSize: 15, marginBottom: 2 },
  notifBody: { fontSize: 14, lineHeight: 20, marginBottom: 6 },
  notifDate: { fontSize: 11 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 10 },
});
