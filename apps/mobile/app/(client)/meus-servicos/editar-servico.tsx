import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
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
import * as Haptics from "expo-haptics";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function EditarServico() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const { fetchJobById, fetchMyData } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [categoryId, setCategoryId] = useState("");
  
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    const data = await fetchJobById(id as string);
    if (data) {
      setTitle(data.title || "");
      setDescription(data.description || "");
      setLocation(data.location || "");
      setCategoryId(data.categoryId || "");
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!title || !description || !location) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }
    
    setSaving(true);
    setError("");
    try {
      const token = await SecureStore.getItemAsync("TRAMPAI_TOKEN");
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000"}/api/jobs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          location,
          categoryId
        })
      });

      if (res.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await fetchMyData();
        router.back();
      } else {
        const err = await res.json();
        setError(err.error || "Erro ao salvar serviço");
      }
    } catch (e) {
      console.error(e);
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  const getSuggestions = () => {
    const suggestions = [];
    if (description.length < 50) {
      suggestions.push("Adicione mais detalhes na descrição para que os prestadores entendam melhor a sua necessidade.");
    }
    if (!location.includes(",")) {
      suggestions.push("Verifique se a localização está completa (Rua, Bairro, Cidade). Isso ajuda a encontrar prestadores próximos.");
    }
    return suggestions;
  };

  const suggestions = getSuggestions();

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 20 : 10), borderBottomWidth: 1, borderBottomColor: colors.border + "30", backgroundColor: "#fff" }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.navy} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.navy, fontFamily: "Inter_800ExtraBold" }]}>Editar Serviço</Text>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          {suggestions.length > 0 && (
            <View style={[styles.suggestionsBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
              <View style={styles.suggestionsHeader}>
                <MaterialCommunityIcons name="lightbulb-on" size={20} color={colors.primary} />
                <Text style={[styles.suggestionsTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Dicas para conseguir mais propostas:</Text>
              </View>
              {suggestions.map((s, idx) => (
                <View key={idx} style={styles.suggestionItem}>
                  <Text style={{ color: colors.primary }}>•</Text>
                  <Text style={[styles.suggestionText, { color: colors.primary }]} >{s}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={[styles.formCard, { backgroundColor: "#FFF" }]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>O que você precisa?</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border }]}
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: Consertar chuveiro queimado"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>Onde será o serviço?</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border }]}
                value={location}
                onChangeText={setLocation}
                placeholder="Endereço completo"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>Descrição Detalhada</Text>
              <TextInput
                style={[styles.textarea, { borderColor: colors.border }]}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                placeholder="Explique o que precisa ser feito..."
              />
            </View>
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity 
              style={[styles.saveBtn, { backgroundColor: colors.primary }]} 
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#FFF" /> : (
                <>
                  <MaterialCommunityIcons name="content-save" size={20} color="#FFF" />
                  <Text style={[styles.saveBtnText, { fontFamily: "Inter_700Bold" }]}>Salvar Alterações</Text>
                </>
              )}
            </TouchableOpacity>
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
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18 },
  content: { padding: 20, paddingBottom: 40 },
  suggestionsBox: { padding: 15, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  suggestionsHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  suggestionsTitle: { fontSize: 14 },
  suggestionItem: { flexDirection: "row", gap: 8, marginBottom: 5, paddingRight: 10 },
  suggestionText: { fontSize: 13, flex: 1, lineHeight: 18 },
  formCard: { padding: 20, borderRadius: 20, elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, height: 50, fontSize: 15, backgroundColor: "#f9fafb" },
  textarea: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, paddingTop: 15, paddingBottom: 15, minHeight: 100, fontSize: 15, textAlignVertical: "top", backgroundColor: "#f9fafb" },
  saveBtn: { flexDirection: "row", height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center", gap: 10, marginTop: 10 },
  saveBtnText: { color: "#FFF", fontSize: 16 },
  errorText: { color: "#ef4444", fontSize: 13, textAlign: "center", marginBottom: 15, fontFamily: "Inter_600SemiBold" },
});
