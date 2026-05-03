import { Redirect } from "expo-router";

import { useAuth } from "@/context/AuthContext";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#21284E" }}>
        <ActivityIndicator color="#F69926" size="large" />
      </View>
    );
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

  if (user.role === "PROVIDER") {
    return <Redirect href="/(provider)/mural" />;
  }

  return <Redirect href="/(client)/" />;
}
