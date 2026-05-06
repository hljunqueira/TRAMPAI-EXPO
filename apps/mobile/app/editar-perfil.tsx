import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

import { useAuth, API_BASE_URL } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";


export default function EditarPerfil() {
  const colors = useColors();
  const { user, fetchMyData } = useAuth();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [city, setCity] = useState(user?.city || "");
  const [providerBio, setProviderBio] = useState(user?.providerBio || "");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setError("");
    if (!name.trim()) return setError("O nome é obrigatório");
    
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("trampai_auth_token");
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          city: city.trim(),
          providerBio: providerBio.trim(),
        }),
      });

      if (res.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccess(true);
        fetchMyData(); // Atualiza o estado global
        setTimeout(() => {
          router.back();
        }, 1500);
      } else {
        const text = await res.text();
        let errorMsg = "Erro ao salvar perfil";
        try {
          if (text) {
            const errJson = JSON.parse(text);
            errorMsg = errJson.error || errorMsg;
          }
        } catch (e) {}
        setError(errorMsg);
      }
    } catch (err) {
      console.error(err);
      setError("Erro de conexão ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 20 : 10), borderBottomWidth: 1, borderBottomColor: colors.border + "30", backgroundColor: "#fff" }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: "Inter_800ExtraBold", color: colors.primary }]}>Editar Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]} keyboardShouldPersistTaps="handled">
          
          <View style={[styles.formCard, { backgroundColor: "#FFF" }]}>
            {success ? (
               <View style={styles.successBox}>
                 <MaterialCommunityIcons name="check-circle" size={48} color={colors.secondary} />
                 <Text style={[styles.successText, { color: colors.secondary, fontFamily: "Inter_700Bold" }]}>Perfil atualizado!</Text>
               </View>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Nome Completo</Text>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border }]}
                    value={name}
                    onChangeText={setName}
                    placeholder="Seu nome"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>WhatsApp (com DDD)</Text>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border }]}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    placeholder="(00) 00000-0000"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Cidade</Text>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border }]}
                    value={city}
                    onChangeText={setCity}
                    placeholder="Ex: São Paulo"
                  />
                </View>

                {(user?.role === "provider" || user?.isProvider) && (
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Biografia Profissional</Text>
                    <TextInput
                      style={[styles.textarea, { borderColor: colors.border }]}
                      value={providerBio}
                      onChangeText={setProviderBio}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      placeholder="Fale um pouco sobre sua experiência e serviços que oferece..."
                    />
                  </View>
                )}

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: "#e8c08a" }]}
                  onPress={handleSave}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Text style={[styles.submitBtnText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Salvar Alterações</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
  },
  content: {
    padding: 20,
  },
  formCard: {
    padding: 24,
    borderRadius: 20,
    shadowColor: "#0b1339",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#0b1339",
  },
  textarea: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 120,
    color: "#0b1339",
  },
  submitBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  submitBtnText: {
    fontSize: 16,
  },
  errorText: {
    color: "#ef4444",
    marginBottom: 16,
    textAlign: "center",
  },
  successBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 16,
  },
  successText: {
    fontSize: 20,
  }
});
