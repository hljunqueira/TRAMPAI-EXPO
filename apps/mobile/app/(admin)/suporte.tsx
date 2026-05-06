import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const FAQS = [
  {
    question: "Como funciona o sistema de créditos?",
    answer: "Os prestadores compram pacotes de créditos para desbloquear o contato (leads) dos clientes. Cada lead tem um custo fixo definido nas configurações do sistema.",
  },
  {
    question: "Como aprovar um novo prestador?",
    answer: "Vá em 'Usuários', clique no perfil pendente, revise os documentos KYC e clique em 'Aprovar'. Isso liberará o acesso dele ao mural.",
  },
  {
    question: "O que acontece ao banir um usuário?",
    answer: "O usuário perde acesso imediato ao aplicativo e suas sessões são encerradas. Ele verá uma mensagem com o motivo do banimento ao tentar logar.",
  },
  {
    question: "Como realizar um estorno?",
    answer: "Na aba 'Reembolsos', localize o lead contestado e clique em 'Reembolsar'. Os créditos voltarão instantaneamente para o saldo do profissional.",
  }
];

export default function SuporteAdmin() {
  const colors = useColors();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleWhatsAppSupport = () => {
    const message = "Olá, preciso de ajuda com o painel administrativo do Trampaí.";
    const url = `whatsapp://send?phone=5511999999999&text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert("Erro", "WhatsApp não instalado.");
      }
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Central de Ajuda</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Suporte operacional e base de conhecimento</Text>
        </View>

        {/* Support Cards */}
        <View style={styles.supportCards}>
          <TouchableOpacity 
            style={[styles.supportCard, { backgroundColor: "#25D366" }]}
            onPress={handleWhatsAppSupport}
          >
            <MaterialCommunityIcons name="whatsapp" size={32} color="#fff" />
            <Text style={styles.cardTitle}>Suporte Técnico</Text>
            <Text style={styles.cardSub}>Falar com desenvolvedores</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.supportCard, { backgroundColor: colors.primary }]}
            onPress={() => Linking.openURL("https://trampai.com.br/ajuda")}
          >
            <MaterialCommunityIcons name="book-open-variant" size={32} color="#fff" />
            <Text style={styles.cardTitle}>Documentação</Text>
            <Text style={styles.cardSub}>Manual de operações</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Perguntas Frequentes</Text>
        <View style={styles.faqList}>
          {FAQS.map((faq, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.faqItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
            >
              <View style={styles.faqHeader}>
                <Text style={[styles.faqQuestion, { color: colors.foreground }]}>{faq.question}</Text>
                <MaterialCommunityIcons 
                  name={expandedFaq === index ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={colors.mutedForeground} 
                />
              </View>
              {expandedFaq === index && (
                <Text style={[styles.faqAnswer, { color: colors.mutedForeground }]}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* System Status Info */}
        <View style={[styles.statusBox, { backgroundColor: colors.secondary + "10" }]}>
          <View style={[styles.statusDot, { backgroundColor: colors.secondary }]} />
          <Text style={[styles.statusText, { color: colors.secondary }]}>Todos os sistemas operacionais</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 24 },
  header: { marginBottom: 8 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 4 },
  supportCards: { flexDirection: "row", gap: 12 },
  supportCard: { flex: 1, padding: 16, borderRadius: 20, gap: 8, elevation: 2 },
  cardTitle: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  cardSub: { color: "#ffffffb0", fontSize: 11, fontFamily: "Inter_500Medium" },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginTop: 8 },
  faqList: { gap: 12 },
  faqItem: { padding: 16, borderRadius: 16, borderWidth: 1 },
  faqHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  faqQuestion: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold", paddingRight: 8 },
  faqAnswer: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 12, lineHeight: 18 },
  statusBox: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, borderRadius: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontFamily: "Inter_700Bold" },
});
