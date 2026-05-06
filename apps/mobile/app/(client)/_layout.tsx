import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, useColorScheme, View } from "react-native";

import { useColors } from "@/hooks/useColors";

export default function ClientLayout() {
  const colors = useColors();
  const isDark = useColorScheme() === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: 0,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 11,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={95}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="novo-servico"
        options={{
          title: "Postar",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="plus-circle-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="meus-servicos/index"
        options={{
          title: "Meus Serviços",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="clipboard-list-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="detalhes-proposta"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="meus-servicos/interessados"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="meus-servicos/editar-servico"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}
