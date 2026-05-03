import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const { user, isLoading, activeMode } = useAuth();
  const [welcomeSeen, setWelcomeSeen] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("@trampai/welcomeSeen").then((v) => {
      setWelcomeSeen(v === "true");
    });
  }, []);

  if (welcomeSeen === null || isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#21284E",
        }}
      >
        <ActivityIndicator color="#F69926" size="large" />
      </View>
    );
  }

  if (!welcomeSeen) {
    return <Redirect href="/welcome" />;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (!user.onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  if (user.role === "ADMIN") {
    return <Redirect href="/(admin)/" />;
  }

  const isDual =
    user.roles?.includes("CLIENT") && user.roles?.includes("PROVIDER");

  if (isDual) {
    return activeMode === "PROVIDER" ? (
      <Redirect href="/(provider)/mural" />
    ) : (
      <Redirect href="/(client)/" />
    );
  }

  if (user.role === "PROVIDER") {
    return <Redirect href="/(provider)/mural" />;
  }

  return <Redirect href="/(client)/" />;
}
