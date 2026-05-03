import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SUGGESTED_CATEGORIES } from "@/constants/categories";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function NovoServico() {
  const colors = useColors();
  const { user, createService, services } = useAuth();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState(user?.city ?? "");
  const [neighborhood, setNeighborhood] = useState(user?.neighborhood ?? "");
  const [showCategories, setShowCategories] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const activeCategory = category === "Outros" ? customCategory : category;

  const myOpenServices = services.filter(
    (s) => s.clientId === user?.id && s.status === "OPEN"
  );

  async function handleSubmit() {
    setError("");
    if (!title.trim()) return setError("Informe o título do serviço");
    if (!activeCategory.trim()) return setError("Selecione ou informe a categoria");
    if (!description.trim() || description.length < 20)
      return setError("Descreva o serviço com pelo menos 20 caracteres");
    if (!city.trim()) return setError("Informe a cidade");
    if (myOpenServices.length >= 3)
      return setError("Você já tem 3 serviços abertos. Feche um antes de postar outro.");

    setLoading(true);
    try {
      await createService({
        title: title.trim(),
        description: description.trim(),
        category: activeCategory.trim(),
        city: city.trim(),
        state: user?.state ?? "",
        neighborhood: neighborhood.trim(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
    } catch {
      setError("Erro ao postar serviço. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.successContainer, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 60) }]}>
          <View style={[styles.successIcon, { backgroundColor: "#22c55e15" }]}>
            <MaterialCommunityIcons name="check-circle" size={64} color="#22c55e" />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Serviço postado!
          </Text>
          <Text style={[styles.successDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Prestadores da sua região serão notificados. Você receberá contato pelo WhatsApp.
          </Text>
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: colors.accent, borderRadius: colors.radius }]}
            onPress={() => router.replace("/(client)/meus-servicos")}
            activeOpacity={0.85}
          >
            <Text style={[styles.doneBtnText, { fontFamily: "Inter_600SemiBold" }]}>
              Ver meus serviços
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.navy,
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: "Inter_700Bold" }]}>
          Novo Serviço
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 100 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {myOpenServices.length >= 3 && (
          <View style={[styles.warningBox, { backgroundColor: "#f59e0b15", borderColor: "#f59e0b40", borderRadius: colors.radius }]}>
            <MaterialCommunityIcons name="alert-outline" size={18} color="#f59e0b" />
            <Text style={[styles.warningText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
              Você já tem 3 serviços abertos. Feche um antes de postar outro.
            </Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
            Título *
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, borderRadius: colors.radius, fontFamily: "Inter_400Regular" }]}
            placeholder="Ex: Preciso de eletricista para instalação"
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
            Categoria *
          </Text>
          <TouchableOpacity
            style={[styles.categorySelector, { backgroundColor: colors.card, borderColor: category ? colors.accent : colors.border, borderRadius: colors.radius }]}
            onPress={() => setShowCategories(!showCategories)}
          >
            <Text style={[styles.categorySelectorText, { color: category ? colors.foreground : colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {category || "Selecionar categoria"}
            </Text>
            <MaterialCommunityIcons
              name={showCategories ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>

          {showCategories && (
            <View style={[styles.categoryList, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              {SUGGESTED_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setCategory(cat);
                    setShowCategories(false);
                    Haptics.selectionAsync();
                  }}
                >
                  <Text style={[styles.categoryItemText, { color: category === cat ? colors.accent : colors.foreground, fontFamily: category === cat ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                    {cat}
                  </Text>
                  {category === cat && (
                    <MaterialCommunityIcons name="check" size={16} color={colors.accent} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {category === "Outros" && (
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, borderRadius: colors.radius, fontFamily: "Inter_400Regular", marginTop: 8 }]}
              placeholder="Qual categoria?"
              placeholderTextColor={colors.mutedForeground}
              value={customCategory}
              onChangeText={setCustomCategory}
            />
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
            Descrição *
          </Text>
          <TextInput
            style={[styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, borderRadius: colors.radius, fontFamily: "Inter_400Regular" }]}
            placeholder="Descreva o que precisa ser feito, tamanho do ambiente, urgência, etc."
            placeholderTextColor={colors.mutedForeground}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={[styles.charCount, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {description.length}/500
          </Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
              Cidade *
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, borderRadius: colors.radius, fontFamily: "Inter_400Regular" }]}
              placeholder="Sua cidade"
              placeholderTextColor={colors.mutedForeground}
              value={city}
              onChangeText={setCity}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
              Bairro
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, borderRadius: colors.radius, fontFamily: "Inter_400Regular" }]}
              placeholder="Setor Bueno"
              placeholderTextColor={colors.mutedForeground}
              value={neighborhood}
              onChangeText={setNeighborhood}
            />
          </View>
        </View>

        {error ? (
          <Text style={[styles.errorText, { fontFamily: "Inter_400Regular" }]}>{error}</Text>
        ) : null}

        <TouchableOpacity
          style={[
            styles.submitBtn,
            {
              backgroundColor: myOpenServices.length >= 3 ? colors.mutedForeground : colors.accent,
              borderRadius: colors.radius,
            },
          ]}
          onPress={handleSubmit}
          disabled={loading || myOpenServices.length >= 3}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="send-outline" size={18} color="#fff" />
              <Text style={[styles.submitBtnText, { fontFamily: "Inter_600SemiBold" }]}>
                Postar Serviço
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={[styles.infoBox, { backgroundColor: colors.cyan + "15", borderRadius: colors.radius }]}>
          <MaterialCommunityIcons name="shield-check-outline" size={18} color={colors.cyan} />
          <Text style={[styles.infoText, { color: colors.navy, fontFamily: "Inter_400Regular" }]}>
            Seu telefone só é revelado para prestadores verificados que pagaram para ver seu contato.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 18 },
  content: { padding: 16, gap: 20 },
  warningBox: { flexDirection: "row", padding: 14, gap: 10, borderWidth: 1 },
  warningText: { flex: 1, fontSize: 13, lineHeight: 18 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13 },
  input: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  textarea: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, minHeight: 100 },
  charCount: { fontSize: 11, textAlign: "right" },
  row: { flexDirection: "row", gap: 12 },
  categorySelector: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categorySelectorText: { fontSize: 15 },
  categoryList: {
    borderWidth: 1,
    marginTop: 4,
    maxHeight: 220,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  categoryItemText: { fontSize: 14 },
  errorText: { color: "#ef4444", fontSize: 13 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, gap: 8 },
  submitBtnText: { color: "#fff", fontSize: 16 },
  infoBox: { flexDirection: "row", padding: 14, gap: 10 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  successContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 20 },
  successIcon: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 24 },
  successDesc: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  doneBtn: { paddingHorizontal: 32, paddingVertical: 14, marginTop: 8 },
  doneBtnText: { color: "#fff", fontSize: 16 },
});
