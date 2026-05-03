import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { Service } from "@/types";

const CATEGORY_ICONS: Record<string, string> = {
  Pedreiro: "hammer",
  Eletricista: "lightning-bolt",
  Encanador: "pipe",
  Diarista: "broom",
  Pintor: "format-paint",
  Jardineiro: "flower",
  Marceneiro: "saw-blade",
  Chaveiro: "key",
  "Mecânico": "car-wrench",
  "Mudanças/Frete": "truck",
  "Refrigeração/Ar-condicionado": "air-conditioner",
  "Técnico de Informática": "laptop",
  Costureira: "scissors-cutting",
  Cuidador: "heart",
  Outros: "briefcase",
};

interface Props {
  service: Service;
  onUnlock?: () => void;
  showUnlock?: boolean;
  alreadyUnlocked?: boolean;
  onClose?: () => void;
  showClose?: boolean;
}

function getStatusColor(status: Service["status"]) {
  switch (status) {
    case "OPEN":
      return "#22c55e";
    case "LOCKED":
      return "#f59e0b";
    case "CLOSED":
      return "#6b7280";
    case "EXPIRED":
      return "#ef4444";
  }
}

function getStatusLabel(status: Service["status"]) {
  switch (status) {
    case "OPEN":
      return "Aberto";
    case "LOCKED":
      return "Reservado";
    case "CLOSED":
      return "Encerrado";
    case "EXPIRED":
      return "Expirado";
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Agora há pouco";
  if (hours < 24) return `${hours}h atrás`;
  return `${Math.floor(hours / 24)}d atrás`;
}

export function ServiceCard({
  service,
  onUnlock,
  showUnlock,
  alreadyUnlocked,
  onClose,
  showClose,
}: Props) {
  const colors = useColors();
  const icon = (CATEGORY_ICONS[service.category] ?? "briefcase") as never;
  const statusColor = getStatusColor(service.status);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: colors.navy + "15", borderRadius: colors.radius / 2 },
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={22}
            color={colors.navy}
          />
        </View>
        <View style={styles.headerText}>
          <Text
            style={[styles.title, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}
            numberOfLines={2}
          >
            {service.title}
          </Text>
          <View style={styles.metaRow}>
            <Text style={[styles.category, { color: colors.accent, fontFamily: "Inter_500Medium" }]}>
              {service.category}
            </Text>
            <View
              style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}
            >
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor, fontFamily: "Inter_500Medium" }]}>
                {getStatusLabel(service.status)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <Text
        style={[styles.description, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}
        numberOfLines={2}
      >
        {service.description}
      </Text>

      <View style={styles.footer}>
        <View style={styles.locationRow}>
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={13}
            color={colors.mutedForeground}
          />
          <Text style={[styles.location, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {service.neighborhood}, {service.city}
          </Text>
        </View>
        <Text style={[styles.time, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {timeAgo(service.createdAt)}
        </Text>
      </View>

      {showUnlock && !alreadyUnlocked && service.status === "OPEN" && (
        <TouchableOpacity
          style={[styles.unlockBtn, { backgroundColor: colors.accent, borderRadius: colors.radius }]}
          onPress={onUnlock}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="lock-open-outline" size={16} color="#fff" />
          <Text style={[styles.unlockText, { fontFamily: "Inter_600SemiBold" }]}>
            Desbloquear Lead
          </Text>
        </TouchableOpacity>
      )}

      {alreadyUnlocked && (
        <View style={[styles.unlockedBadge, { borderRadius: colors.radius, backgroundColor: "#22c55e15" }]}>
          <MaterialCommunityIcons name="check-circle" size={14} color="#22c55e" />
          <Text style={[styles.unlockedText, { fontFamily: "Inter_500Medium" }]}>
            Já desbloqueado
          </Text>
        </View>
      )}

      {showClose && service.status === "OPEN" && (
        <TouchableOpacity
          style={[styles.closeBtn, { borderColor: colors.border, borderRadius: colors.radius }]}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Text style={[styles.closeBtnText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
            Marcar como Resolvido
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  category: {
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  location: {
    fontSize: 12,
  },
  time: {
    fontSize: 12,
  },
  unlockBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginTop: 12,
    gap: 6,
  },
  unlockText: {
    color: "#fff",
    fontSize: 14,
  },
  unlockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginTop: 12,
    gap: 6,
  },
  unlockedText: {
    color: "#22c55e",
    fontSize: 13,
  },
  closeBtn: {
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 12,
    borderWidth: 1,
  },
  closeBtnText: {
    fontSize: 13,
  },
});
