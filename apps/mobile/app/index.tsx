import { Redirect } from "expo-router";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { user, isLoading, activeMode } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#21284E" }}>
        <ActivityIndicator size="large" color="#F69926" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/welcome" />;
  }

  // Redireciona para onboarding se o perfil estiver incompleto (Admin pula essa etapa)
  const userRole = user.role?.toLowerCase();
  if (userRole !== "admin" && (!user.phone || !user.city)) {
    return <Redirect href="/onboarding" />;
  }

  // Se for admin e estiver no modo ADMIN, vai para o painel
  if (userRole === "admin" && activeMode === "ADMIN") {
    return <Redirect href="/(admin)" />;
  }

  // Redireciona baseado no modo ativo (para permitir troca de visão)
  if (activeMode === "PROVIDER" || (userRole === "provider" && !activeMode)) {
    return <Redirect href="/(provider)/mural" />;
  }

  if (activeMode === "CLIENT" || (userRole === "client" && !activeMode)) {
    return <Redirect href="/(client)" />;
  }

  // Fallback para admin se nada acima capturar
  if (userRole === "admin") {
    return <Redirect href="/(admin)" />;
  }

  return <Redirect href="/(client)" />;
}
