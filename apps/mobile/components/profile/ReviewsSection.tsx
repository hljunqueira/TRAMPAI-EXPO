import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useColors } from '@/hooks/useColors';

interface Review {
  id: string;
  fromUserName: string;
  fromUserAvatar?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

interface ReviewsSectionProps {
  reviews: Review[];
  reviewCount?: number;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ reviews, reviewCount }) => {
  const colors = useColors();

  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
        Avaliações Recentes ({reviewCount || 0})
      </Text>
      
      {reviews && reviews.length > 0 ? (
        <View style={styles.reviewList}>
          {reviews.map((rev) => (
            <View key={rev.id} style={[styles.reviewItem, { borderBottomColor: colors.border + "20" }]}>
              <View style={styles.reviewHeader}>
                {rev.fromUserAvatar ? (
                  <Image source={{ uri: rev.fromUserAvatar }} style={styles.reviewerAvatar} />
                ) : (
                  <View style={[styles.reviewerAvatar, { backgroundColor: colors.primary + "10", alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 10, color: colors.primary, fontFamily: 'Inter_700Bold' }}>
                      {rev.fromUserName?.[0] || "?"}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.reviewerName, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>{rev.fromUserName}</Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <MaterialCommunityIcons 
                        key={star} 
                        name="star" 
                        size={12} 
                        color={star <= rev.rating ? colors.secondary : colors.border} 
                      />
                    ))}
                  </View>
                </View>
                <Text style={[styles.reviewDate, { color: colors.mutedForeground }]}>
                  {new Date(rev.createdAt).toLocaleDateString('pt-BR')}
                </Text>
              </View>
              {rev.comment ? (
                <Text style={[styles.reviewComment, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>
                  "{rev.comment}"
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="star-outline" size={32} color={colors.mutedForeground + "40"} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Nenhuma avaliação recebida
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: { marginHorizontal: 20, borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: "#0b1339", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 16, marginBottom: 16 },
  reviewList: { gap: 16 },
  reviewItem: { borderBottomWidth: 1, paddingBottom: 16 },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  reviewerAvatar: { width: 32, height: 32, borderRadius: 16 },
  reviewerName: { fontSize: 14 },
  starsRow: { flexDirection: "row", gap: 2 },
  reviewDate: { fontSize: 11 },
  reviewComment: { fontSize: 13, lineHeight: 18, fontStyle: 'italic' },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 13 },
});
