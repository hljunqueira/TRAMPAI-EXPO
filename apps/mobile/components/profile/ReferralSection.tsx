import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface ReferralSectionProps {
  referralCode: string;
  bonus?: string;
  onShare: () => void;
}

export const ReferralSection: React.FC<ReferralSectionProps> = ({ referralCode, bonus = "10", onShare }) => {
  const colors = useColors();

  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.navy }]}>
      <View style={styles.referralHeader}>
        <View style={styles.referralIconBox}>
          <MaterialCommunityIcons name="gift-outline" size={24} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.referralTitle, { color: "#FFF", fontFamily: "Inter_800ExtraBold" }]}>Convite e Ganhe</Text>
          <Text style={[styles.referralSub, { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" }]}>
            Convide amigos e ganhe {bonus} créditos por cada um que se cadastrar.
          </Text>
        </View>
      </View>
      
      <View style={[styles.codeBox, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
          <Text style={styles.codeLabel}>SEU CÓDIGO EXCLUSIVO</Text>
          <Text style={[styles.codeText, { color: colors.accent }]}>{referralCode || "TRAMPAI2024"}</Text>
      </View>

      <TouchableOpacity 
        style={[styles.shareBtn, { backgroundColor: colors.accent }]} 
        onPress={onShare}
      >
        <MaterialCommunityIcons name="share-variant" size={20} color={colors.navy} />
        <Text style={[styles.shareBtnText, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>Convidar Amigos</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: { marginHorizontal: 20, borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: "#0b1339", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  referralHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  referralIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.1)", alignItems: 'center', justifyContent: 'center' },
  referralTitle: { fontSize: 18, marginBottom: 2 },
  referralSub: { fontSize: 12, lineHeight: 18 },
  codeBox: { padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 16 },
  codeLabel: { color: "rgba(255,255,255,0.5)", fontSize: 10, letterSpacing: 1, marginBottom: 4 },
  codeText: { fontSize: 24, fontFamily: "Inter_900Black" },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, gap: 12 },
  shareBtnText: { fontSize: 15 },
});
