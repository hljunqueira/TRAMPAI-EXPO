import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface VerificationSectionProps {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  onPress: () => void;
}

export const VerificationSection: React.FC<VerificationSectionProps> = ({ status, onPress }) => {
  const colors = useColors();

  const getStatusConfig = () => {
    switch (status) {
      case 'APPROVED':
        return {
          icon: 'shield-check',
          color: '#22c55e',
          title: 'Perfil Verificado',
          desc: 'Sua identidade foi confirmada. Você transmite mais confiança aos clientes.'
        };
      case 'PENDING':
        return {
          icon: 'shield-clock',
          color: '#f59e0b',
          title: 'Em Análise',
          desc: 'Seus documentos estão sendo revisados pela nossa equipe. Aguarde.'
        };
      case 'REJECTED':
        return {
          icon: 'shield-alert',
          color: '#ef4444',
          title: 'Verificação Recusada',
          desc: 'Houve um problema com seus documentos. Clique para tentar novamente.'
        };
      default:
        return {
          icon: 'shield-outline',
          color: colors.mutedForeground,
          title: 'Verificar Identidade',
          desc: 'Envie seus documentos para ganhar o selo de verificado e atrair mais clientes.'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
      <TouchableOpacity style={styles.content} onPress={onPress} disabled={status === 'APPROVED' || status === 'PENDING'}>
        <View style={[styles.iconBox, { backgroundColor: config.color + "15" }]}>
          <MaterialCommunityIcons name={config.icon as any} size={24} color={config.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>{config.title}</Text>
          <Text style={[styles.desc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{config.desc}</Text>
        </View>
        {!status && <MaterialCommunityIcons name="chevron-right" size={20} color={colors.border} />}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: { marginHorizontal: 20, borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: "#0b1339", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, marginBottom: 4 },
  desc: { fontSize: 12, lineHeight: 18 },
});
