import React from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TermsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="close" size={24} color="#21284E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Termos de Uso</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.updateDate}>Última atualização: 03 de Maio de 2026</Text>
        
        <Text style={styles.sectionTitle}>1. Aceitação dos Termos</Text>
        <Text style={styles.text}>
          Ao utilizar o Trampaí, você concorda em cumprir estes termos. O Trampaí é uma plataforma que conecta clientes e prestadores de serviços locais.
        </Text>

        <Text style={styles.sectionTitle}>2. Cadastro e Segurança</Text>
        <Text style={styles.text}>
          Você é responsável por manter a confidencialidade de sua conta. Informações falsas poderão resultar na suspensão do acesso.
        </Text>

        <Text style={styles.sectionTitle}>3. Pagamentos e Créditos</Text>
        <Text style={styles.text}>
          O Trampaí utiliza um sistema de créditos para prestadores acessarem leads. Os pagamentos pelos serviços são negociados diretamente entre as partes.
        </Text>

        <Text style={styles.sectionTitle}>4. Contato e Suporte</Text>
        <Text style={styles.text}>
          Para dúvidas ou suporte, entre em contato:
          {"\n"}• E-mail: suporte@trampai.com.br
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
