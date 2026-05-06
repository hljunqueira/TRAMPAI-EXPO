import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { CreditPackage } from "@/types";

interface Props {
  pkg: CreditPackage;
  onSelect: () => void;
}

function formatPrice(cents: number) {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export function CreditPackageCard({ pkg, onSelect }: Props) {
  const colors = useColors();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: pkg.isHighlighted ? colors.navy : colors.card,
          borderColor: pkg.isHighlighted ? colors.accent : colors.border,
          borderRadius: colors.radius,
        },
      ]}
      onPress={onSelect}
      activeOpacity={0.85}
    >
      {pkg.isHighlighted && (
        <View
          style={[
            styles.badge,
            { backgroundColor: colors.accent, borderRadius: 6 },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MaterialCommunityIcons name="check-decagram" size={12} color={colors.navy} />
            <Text style={[styles.badgeText, { fontFamily: "Inter_800ExtraBold", color: colors.navy }]}>
              POPULAR
            </Text>
          </View>
        </View>
      )}

      <MaterialCommunityIcons
        name="star-box"
        size={32}
        color={pkg.isHighlighted ? colors.accent : colors.navy}
        style={styles.icon}
      />

      <Text
        style={[
          styles.label,
          {
            color: pkg.isHighlighted ? "#fff" : colors.primary,
            fontFamily: "Inter_700Bold",
          },
        ]}
      >
        {pkg.name}
      </Text>

      <View style={styles.creditsContainer}>
        <Text
          style={[
            styles.credits,
            {
              color: pkg.isHighlighted ? colors.accent : colors.primary,
              fontFamily: "Inter_800ExtraBold",
            },
          ]}
        >
          {pkg.credits}
        </Text>
        {pkg.bonusCredits ? (
          <Text style={[styles.bonusText, { color: pkg.isHighlighted ? "#fff" : colors.secondary }]}>
            +{pkg.bonusCredits}
          </Text>
        ) : null}
      </View>
      
      <Text
        style={[
          styles.creditsLabel,
          {
            color: pkg.isHighlighted ? "#ffffff90" : colors.mutedForeground,
            fontFamily: "Inter_500Medium",
          },
        ]}
      >
        créditos
      </Text>

      <Text
        style={[
          styles.price,
          {
            color: pkg.isHighlighted ? "#ffffffCC" : colors.primary,
            fontFamily: "Inter_700Bold",
          },
        ]}
      >
        {formatPrice(pkg.priceCents)}
      </Text>

      <View
        style={[
          styles.perCredit,
          {
            backgroundColor: pkg.isHighlighted ? "#ffffff15" : colors.primary + "08",
            borderRadius: 6,
          },
        ]}
      >
        <Text
          style={[
            styles.perCreditText,
            {
              color: pkg.isHighlighted ? "#ffffffCC" : colors.mutedForeground,
              fontFamily: "Inter_400Regular",
            },
          ]}
        >
          R$ {((pkg.priceCents / (pkg.credits + (pkg.bonusCredits || 0))) / 100).toFixed(2).replace(".", ",")} / cr
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 2,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  badge: {
    position: "absolute",
    top: -14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: 1,
  },
  icon: {
    marginBottom: 10,
  },
  label: {
    fontSize: 10,
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  creditsContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
    marginBottom: 2,
  },
  credits: {
    fontSize: 32,
    lineHeight: 36,
  },
  bonusText: {
    fontSize: 16,
    fontFamily: "Inter_800ExtraBold",
    marginLeft: 2,
  },
  creditsLabel: {
    fontSize: 12,
    marginBottom: 12,
    textTransform: "lowercase",
  },
  price: {
    fontSize: 16,
    marginBottom: 12,
  },
  perCredit: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  perCreditText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
});
