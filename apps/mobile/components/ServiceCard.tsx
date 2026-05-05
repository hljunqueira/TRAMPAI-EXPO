import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { Service } from "@/types";
import type { Job } from "@workspace/api-client-react";

const CATEGORY_IMAGES: Record<string, string> = {
  Pintor: "https://lh3.googleusercontent.com/aida-public/AB6AXuAEGwEQAVLkNqiJ4ox5luaNs84Dy309DUfoa8y4wUcrJK4t1FKimHyn1Qixepamj3eKXG-4VWopjSqGBmgMHPsR2L0fdjXU4mwerSNBsTaU6nh7VXRToOuqAZn512-WvtlyWQvnVkKd7RElZT8bNsaw27JMMOmyfFdNnZ4jFXT3igPd59AcqJfrUBIsKksByIlvgloDdGGpAwDQWaYaYYhM4dpcKVHdqk8eCpekfC4l4MhwYxOuyIKkmsLbpG7iVb5zXh34nNpzqL4",
  Pedreiro: "https://lh3.googleusercontent.com/aida-public/AB6AXuCsR_m7x_M9r7X7o9x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7x7",
  "Refrigeração/Ar-condicionado": "https://lh3.googleusercontent.com/aida-public/AB6AXuByXtrt5SJUFPg4NlR9Cdjcv3v1NLdY0yv9paILBRay6xWKTzRgxtnsFVUR0SNFqgC9HT0wqW8Q-7GRMrALUPK1dPsv4VFoJsG4BS9QFhgpwjmfST9y3yPmX7udZaFUwb5agbntLJd3KtZRr7k9SbjYwczDhn4diBT72bOQ1gnTMn5xgBMCWB7hLZpMC0-AjMXLqQ4609EN-TW2WqVnV3BghvE9gSaUx679Mqp16GCrwM38qrUt1_Pfv9q5zlIoKgdauGVhcpo-ZXA",
  Limpeza: "https://lh3.googleusercontent.com/aida-public/AB6AXuCGABizx9cTsRIMYggAQqFh8bWRf1kBBpyzeajhhiAfvwJsiHyaUZVpZ0cy8tUEtrOk9T9ft9DWy7Qtq9Uuhn3E0vH1EpqX3-T4SPj-eTMSeG_xPTmqntmRQYdqAFxQyIt85RJoMSQjG2UzCb3wRfA-YG4LNXrYYudZAJQN6lyXWTIBPP5s2Vex_k9AqTKE4FpPk_tMNO8vq21htim_7m0FtzP8LAxeKXnwJh7lgv06tVhzfR2Yfbd_AJscc4gNrwgJpAh8XJcOQNY",
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1581578731548-c64695cc6958?q=80&w=800&auto=format&fit=crop";

interface Props {
  service: Service | Job;
  onUnlock?: () => void;
  showUnlock?: boolean;
  alreadyUnlocked?: boolean;
  onClose?: () => void;
  showClose?: boolean;
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
  
  // Normalização de dados
  const isJob = "categoryId" in service;
  const categoryName = isJob ? (service as any).category?.name || "Serviço" : (service as any).category;
  const locationText = isJob ? service.location : `${(service as any).neighborhood}, ${(service as any).city}`;
  const status = isJob ? service.status : (service as any).status;
  const isUrgent = (service as any).priority === "URGENT" || (service as any).isUrgent;

  const isClosed = status === "CLOSED" || status === "COMPLETED";
  const imageUrl = CATEGORY_IMAGES[categoryName] || DEFAULT_IMAGE;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: isClosed ? 0.7 : 1,
        },
      ]}
    >
      <View style={styles.mainContent}>
        <View style={styles.textContent}>
          <View style={styles.badgesRow}>
            <View style={[styles.categoryBadge, { backgroundColor: colors.cyan + "15" }]}>
              <Text style={[styles.categoryText, { color: colors.cyan, fontFamily: "Inter_600SemiBold" }]}>
                {categoryName}
              </Text>
            </View>
            {isUrgent && (
              <View style={[styles.urgentBadge, { backgroundColor: "#F6992615" }]}>
                <MaterialCommunityIcons name="bolt" size={12} color="#F69926" />
                <Text style={[styles.urgentText, { fontFamily: "Inter_700Bold" }]}>Urgente</Text>
              </View>
            )}
          </View>

          <Text
            style={[styles.title, { color: colors.navy, fontFamily: "Inter_700Bold" }]}
            numberOfLines={2}
          >
            {service.title}
          </Text>

          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.mutedForeground} />
            <Text style={[styles.location, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {locationText}
            </Text>
          </View>

          <Text
            style={[styles.description, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}
            numberOfLines={2}
          >
            {service.description}
          </Text>
        </View>

        <Image source={{ uri: imageUrl }} style={styles.serviceImg} />
      </View>

      {isClosed ? (
        <View style={styles.closedOverlay}>
           <Text style={[styles.closedLabel, { fontFamily: "Inter_700Bold" }]}>Finalizado</Text>
        </View>
      ) : (
        <View style={styles.actions}>
          {showUnlock && !alreadyUnlocked && (
            <View style={styles.unlockActions}>
              <TouchableOpacity
                style={[styles.unlockBtn, { backgroundColor: "#F69926" }]}
                onPress={onUnlock}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="lock-open-outline" size={18} color={colors.navy} />
                <Text style={[styles.unlockBtnText, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>
                  Desbloquear (1 cr)
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.exclusiveBtn, { backgroundColor: colors.navy }]}
                onPress={onUnlock}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="star" size={18} color="#fff" />
                <Text style={[styles.exclusiveBtnText, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
                  Exclusivo (3 cr)
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {alreadyUnlocked && (
            <TouchableOpacity 
              style={[styles.detailsBtn, { borderColor: colors.navy }]}
              onPress={() => router.push({ pathname: "/(provider)/mural", params: { id: service.id } })}
            >
              <Text style={[styles.detailsBtnText, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>
                Ver Detalhes
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 3,
    shadowColor: "#21284E",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    overflow: "hidden",
  },
  mainContent: {
    flexDirection: "row",
    gap: 15,
  },
  textContent: {
    flex: 1,
  },
  badgesRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
  },
  urgentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  urgentText: {
    color: "#F69926",
    fontSize: 11,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  location: {
    fontSize: 12,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  serviceImg: {
    width: 85,
    height: 85,
    borderRadius: 15,
    backgroundColor: "#f1f5f9",
  },
  actions: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderColor: "#00000005",
  },
  unlockActions: {
    gap: 10,
  },
  unlockBtn: {
    flexDirection: "row",
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    gap: 8,
  },
  unlockBtnText: {
    fontSize: 14,
  },
  exclusiveBtn: {
    flexDirection: "row",
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    gap: 8,
  },
  exclusiveBtnText: {
    fontSize: 14,
  },
  detailsBtn: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 2,
  },
  detailsBtnText: {
    fontSize: 14,
  },
  closedOverlay: {
    marginTop: 15,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
  },
  closedLabel: {
    color: "#94a3b8",
    fontSize: 13,
    textTransform: "uppercase",
  },
});
