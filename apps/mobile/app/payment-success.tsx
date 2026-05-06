import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "@/context/AuthContext";

export default function PaymentSuccessScreen() {
  const { refreshUser } = useAuth();

  useEffect(() => {
    // Atualizar os dados do usuário para mostrar o novo saldo
    refreshUser();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name="check-decagram" size={80} color="#22c55e" />
      </View>
      <Text style={styles.title}>Pagamento Confirmado!</Text>
      <Text style={styles.subtitle}>
        Seus créditos já foram adicionados à sua conta. Agora é só fazer o Trampaí acontecer! 🚀
      </Text>

      <TouchableOpacity 
        style={styles.btn} 
        onPress={() => router.replace("/carteira")}
      >
        <Text style={styles.btnText}>Voltar para Carteira</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: "#FFF" },
  iconCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: "#22c55e15", alignItems: "center", justifyContent: "center", marginBottom: 32 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#1a1a1a", marginBottom: 12, textAlign: "center" },
  subtitle: { fontSize: 16, fontFamily: "Inter_400Regular", color: "#666", textAlign: "center", lineHeight: 24, marginBottom: 40 },
  btn: { backgroundColor: "#F69926", paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, width: "100%", alignItems: "center" },
  btnText: { color: "#FFF", fontSize: 16, fontFamily: "Inter_700Bold" }
});
