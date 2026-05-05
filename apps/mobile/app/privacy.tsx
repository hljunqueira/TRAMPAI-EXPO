import React from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="close" size={24} color="#21284E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacidade</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.updateDate}>Última atualização: 03 de Maio de 2026</Text>
        
        <Text style={styles.sectionTitle}>1. Coleta de Dados</Text>
        <Text style={styles.text}>
          Coletamos seu nome, e-mail e telefone para possibilitar a conexão entre clientes e profissionais. Dados de localização são usados para encontrar serviços próximos a você.
        </Text>

        <Text style={styles.sectionTitle}>2. Uso das Informações</Text>
        <Text style={styles.text}>
          Seus dados nunca serão vendidos a terceiros. Eles são utilizados exclusivamente para o funcionamento do marketplace Trampaí.
        </Text>

        <Text style={styles.sectionTitle}>3. Proteção e Segurança</Text>
        <Text style={styles.text}>
          Utilizamos criptografia para proteger seus dados pessoais e informações de pagamento.
        </Text>

        <Text style={styles.sectionTitle}>4. Seus Direitos</Text>
        <Text style={styles.text}>
          Você pode solicitar a exclusão de sua conta e de todos os seus dados a qualquer momento através do nosso suporte.
        </Text>

        <Text style={styles.sectionTitle}>Contato</Text>
        <Text style={styles.text}>
          suporte@trampai.com.br
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#21284E",
    marginLeft: 8,
  },
  content: {
    padding: 20,
  },
  updateDate: {
    fontSize: 12,
    color: "#666",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#21284E",
    marginTop: 20,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    color: "#444",
    fontFamily: "Inter_400Regular",
  },
});
