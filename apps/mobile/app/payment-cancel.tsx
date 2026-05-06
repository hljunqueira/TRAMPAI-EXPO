import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function PaymentCancelScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name="close-circle-outline" size={80} color="#ef4444" />
      </View>
      <Text style={styles.title}>Pagamento Cancelado</Text>
      <Text style={styles.subtitle}>
        Não se preocupe, nenhuma cobrança foi realizada. Se precisar de ajuda, entre em contato com nosso suporte.
      </Text>

      <TouchableOpacity 
        style={styles.btn} 
        onPress={() => router.replace("/carteira")}
      >
        <Text style={styles.btnText}>Tentar Novamente</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: "#FFF" },
  iconCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: "#ef444415", alignItems: "center", justifyContent: "center", marginBottom: 32 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#1a1a1a", marginBottom: 12, textAlign: "center" },
  subtitle: { fontSize: 16, fontFamily: "Inter_400Regular", color: "#666", textAlign: "center", lineHeight: 24, marginBottom: 40 },
  btn: { backgroundColor: "#21284E", paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, width: "100%", alignItems: "center" },
  btnText: { color: "#FFF", fontSize: 16, fontFamily: "Inter_700Bold" }
});
