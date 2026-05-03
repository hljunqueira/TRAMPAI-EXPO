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
          backgroundColor: pkg.highlight ? colors.navy : colors.card,
          borderColor: pkg.highlight ? colors.accent : colors.border,
          borderRadius: colors.radius,
        },
      ]}
      onPress={onSelect}
      activeOpacity={0.85}
    >
      {pkg.highlight && (
        <View
          style={[
            styles.badge,
            { backgroundColor: colors.accent, borderRadius: 6 },
          ]}
        >
          <Text style={[styles.badgeText, { fontFamily: "Inter_600SemiBold" }]}>
            Popular
          </Text>
        </View>
      )}

      <MaterialCommunityIcons
        name="star-circle"
        size={28}
        color={pkg.highlight ? colors.accent : colors.navy}
        style={styles.icon}
      />

      <Text
        style={[
          styles.label,
          {
            color: pkg.highlight ? "#fff" : colors.foreground,
            fontFamily: "Inter_700Bold",
          },
        ]}
      >
        {pkg.label}
      </Text>

      <Text
        style={[
          styles.credits,
          {
            color: pkg.highlight ? colors.accent : colors.accent,
            fontFamily: "Inter_700Bold",
          },
        ]}
      >
        {pkg.credits}
      </Text>
      <Text
        style={[
          styles.creditsLabel,
          {
            color: pkg.highlight ? "#ffffff90" : colors.mutedForeground,
            fontFamily: "Inter_400Regular",
          },
        ]}
      >
        créditos
      </Text>

      <Text
        style={[
          styles.price,
          {
            color: pkg.highlight ? "#ffffffCC" : colors.mutedForeground,
            fontFamily: "Inter_400Regular",
          },
        ]}
      >
        {formatPrice(pkg.priceCents)}
      </Text>

      <View
        style={[
          styles.perCredit,
          {
            backgroundColor: pkg.highlight ? "#ffffff15" : colors.muted,
            borderRadius: 6,
          },
        ]}
      >
        <Text
          style={[
            styles.perCreditText,
            {
              color: pkg.highlight ? "#ffffffCC" : colors.mutedForeground,
              fontFamily: "Inter_400Regular",
            },
          ]}
        >
          R$ {((pkg.priceCents / pkg.credits) / 100).toFixed(2).replace(".", ",")} / crédito
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderWidth: 1.5,
    minWidth: 100,
    position: "relative",
    paddingTop: 20,
  },
  badge: {
    position: "absolute",
    top: -10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  icon: {
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  credits: {
    fontSize: 36,
    lineHeight: 40,
  },
  creditsLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    marginBottom: 8,
  },
  perCredit: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  perCreditText: {
    fontSize: 11,
  },
});
