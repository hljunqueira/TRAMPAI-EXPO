import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, useColorScheme, View } from "react-native";

import { useColors } from "@/hooks/useColors";

export default function AdminLayout() {
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
        tabBarLabelStyle: { fontFamily: "Inter_500Medium", fontSize: 11 },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={95} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? "view-dashboard" : "view-dashboard-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="usuarios"
        options={{
          title: "Usuários",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? "account-group" : "account-group-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pacotes"
        options={{
          title: "Pacotes",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={(focused ? "package-variant" : "package-variant") as any} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="configuracoes"
        options={{
          title: "Ajustes",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? "cog" : "cog-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? "account" : "account-outline"} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
