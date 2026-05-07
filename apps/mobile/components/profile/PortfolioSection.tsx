import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useColors } from '@/hooks/useColors';

interface PortfolioItem {
  url: string;
  description?: string;
}

interface PortfolioSectionProps {
  portfolioImages: (string | PortfolioItem)[];
  hasUnlockedPortfolio?: boolean;
  onAddPress: () => void;
  stylesOverride?: {
    emptyPortfolio?: any;
    emptyText?: any;
  };
}

export const PortfolioSection: React.FC<PortfolioSectionProps> = ({ 
  portfolioImages, 
  hasUnlockedPortfolio, 
  onAddPress,
  stylesOverride
}) => {
  const colors = useColors();

  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Portfólio</Text>
        <TouchableOpacity onPress={onAddPress}>
          <Text style={[styles.seeAll, { color: colors.secondary, fontFamily: "Inter_600SemiBold" }]}>Adicionar Foto</Text>
        </TouchableOpacity>
      </View>

      {portfolioImages && portfolioImages.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {portfolioImages.map((img, index) => {
            const url = typeof img === 'string' ? img : img.url;
            return (
              <View key={index} style={styles.portfolioImgWrapper}>
                <Image source={{ uri: url }} style={styles.portfolioImg} contentFit="cover" />
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <TouchableOpacity 
          style={[
            styles.emptyPortfolio, 
            { borderColor: colors.border + "40", backgroundColor: colors.card + "50" },
            stylesOverride?.emptyPortfolio
          ]} 
          onPress={onAddPress}
        >
          <MaterialCommunityIcons name="image-plus" size={32} color={colors.mutedForeground + "40"} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }, stylesOverride?.emptyText]}>
            Nenhuma foto adicionada
          </Text>
        </TouchableOpacity>
      )}

      {!hasUnlockedPortfolio && (
        <View style={[styles.limitBadge, { backgroundColor: colors.accent + "15" }]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={14} color={colors.accent} />
          <Text style={[styles.limitText, { color: colors.accent, fontFamily: "Inter_600SemiBold" }]}>
            Você está usando o limite gratuito (1 foto)
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: { marginHorizontal: 20, borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: "#0b1339", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 16 },
  seeAll: { fontSize: 12 },
  portfolioImgWrapper: { borderRadius: 12, overflow: 'hidden' },
  portfolioImg: { width: 100, height: 100 },
  emptyPortfolio: { alignItems: "center", justifyContent: "center", paddingVertical: 24, borderWidth: 1, borderRadius: 16, gap: 8 },
  emptyText: { fontSize: 13 },
  limitBadge: { flexDirection: "row", alignItems: "center", gap: 6, padding: 10, borderRadius: 12, marginTop: 12 },
  limitText: { fontSize: 11 },
});
