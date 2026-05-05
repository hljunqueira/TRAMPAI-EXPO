import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState, useMemo } from "react";
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

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useCreateJob, useListCategories, useListJobs } from "@workspace/api-client-react";

export default function NovoServico() {
  const colors = useColors();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const { data: categoriesData, isLoading: loadingCats } = useListCategories();
  const { mutateAsync: createJob, isPending: loading } = useCreateJob();
  const { data: jobs, refetch: refetchJobs } = useListJobs();

  const [title, setTitle] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState(user?.city || "");
  const [neighborhood, setNeighborhood] = useState(user?.neighborhood || "");
  const [images, setImages] = useState<string[]>([]);
  
  const [showCategories, setShowCategories] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  const selectedCategoryName = useMemo(() => {
    return categoriesData?.find(c => c.id === selectedCategoryId)?.name || "";
  }, [categoriesData, selectedCategoryId]);

  const myOpenServices = useMemo(() => {
    return jobs?.filter(s => s.clientId === user?.id && s.status === "open") || [];
  }, [jobs, user?.id]);

  async function fetchAddressByCep(val: string) {
    const cleanCep = val.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (data.erro) {
        setError("CEP não encontrado");
      } else {
        setAddress(`${data.logradouro}, ${data.bairro}`);
        setCity(data.localidade);
        setNeighborhood(data.bairro);
        setError("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCep(false);
    }
  }

  async function pickImage() {
    if (images.length >= 3) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
      Haptics.selectionAsync();
    }
  }

  async function handleSubmit() {
    setError("");
    if (!title.trim()) return setError("Informe o título do serviço");
    if (!selectedCategoryId) return setError("Selecione a categoria");
    if (!description.trim() || description.length < 20)
      return setError("Descreva o serviço com pelo menos 20 caracteres");
    if (!city.trim()) return setError("Informe a cidade");
    
    if (myOpenServices.length >= 3)
      return setError("Você já tem 3 serviços abertos. Feche um antes de postar outro.");

    try {
      const fullLocation = address ? `${address}, ${city} - CEP: ${cep}` : city;

      await createJob({
        data: {
          title: title.trim(),
          description: description.trim(),
          categoryId: selectedCategoryId,
          budget: 0, 
          location: fullLocation,
        }
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
      refetchJobs();
    } catch (err: any) {
      console.error(err);
      setError("Erro ao postar serviço. Tente novamente.");
    }
  }

  if (success) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.successContainer, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 60) }]}>
          <View style={[styles.successIcon, { backgroundColor: colors.secondary + "15" }]}>
            <MaterialCommunityIcons name="check-circle" size={64} color={colors.secondary} />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Serviço postado!
          </Text>
          <Text style={[styles.successDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Prestadores da sua região serão notificados. Você receberá contato pelo WhatsApp em breve.
          </Text>
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
            onPress={() => router.replace("/(client)/meus-servicos")}
            activeOpacity={0.85}
          >
            <Text style={[styles.doneBtnText, { fontFamily: "Inter_600SemiBold", color: "#FFF" }]}>
              Ver meus serviços
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 20 : 10), borderBottomWidth: 1, borderBottomColor: colors.border + "30" }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerLogo, { fontFamily: "Inter_800ExtraBold", color: colors.primary }]}>Trampaí</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <MaterialCommunityIcons name="bell-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroSection}>
            <Text style={[styles.title, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Postar Serviço</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Descreva o que você precisa e encontre o trampo ideal.
            </Text>
          </View>

          <View style={[styles.formCard, { backgroundColor: "#FFF", borderRadius: 20 }]}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Título do Serviço</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border }]}
                placeholder="Ex: Preciso de Eletricista para fiação"
                placeholderTextColor={colors.mutedForeground}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Categoria</Text>
              <TouchableOpacity
                style={[styles.selector, { borderColor: colors.border }]}
                onPress={() => setShowCategories(!showCategories)}
              >
                <Text style={[styles.selectorText, { color: selectedCategoryId ? colors.foreground : colors.mutedForeground }]}>
                  {loadingCats ? "Carregando..." : (selectedCategoryName || "Selecione uma categoria")}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>

              {showCategories && categoriesData && (
                <View style={[styles.dropdown, { borderColor: colors.border }]}>
                  {categoriesData.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedCategoryId(cat.id);
                        setShowCategories(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, { color: selectedCategoryId === cat.id ? colors.accent : colors.foreground }]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Descrição Detalhada</Text>
              <TextInput
                style={[styles.textarea, { borderColor: colors.border }]}
                placeholder="Detalhe o máximo possível o que precisa ser feito, materiais necessários, etc."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* Location Grid */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 0.4 }]}>
                <Text style={[styles.label, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>CEP</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border }]}
                  placeholder="00000-000"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  value={cep}
                  onChangeText={(val) => {
                    setCep(val);
                    if (val.replace(/\D/g, "").length === 8) fetchAddressByCep(val);
                  }}
                  maxLength={9}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 0.6 }]}>
                <Text style={[styles.label, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Endereço</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: "#f9f9f9" }]}
                  placeholder="Preenchido automaticamente"
                  placeholderTextColor={colors.mutedForeground}
                  editable={false}
                  value={address}
                />
              </View>
            </View>

            {/* Image Upload Bento Box */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Fotos do Local/Problema (Até 3)</Text>
              <View style={styles.bentoGrid}>
                {/* Main Box */}
                <TouchableOpacity 
                  style={[styles.mainUpload, { borderColor: colors.border, borderStyle: "dashed" }]}
                  onPress={pickImage}
                >
                  {images[0] ? (
                    <View style={styles.imageWrapper}>
                      <Text style={styles.imageCount}>1/3</Text>
                    </View>
                  ) : (
                    <>
                      <MaterialIcons name="add-a-photo" size={32} color={colors.mutedForeground} />
                      <Text style={[styles.uploadText, { color: colors.mutedForeground }]}>Adicionar foto principal</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Secondary Boxes */}
                <View style={styles.secondaryUploads}>
                  <TouchableOpacity style={[styles.subUpload, { borderColor: colors.border, borderStyle: "dashed" }]} onPress={pickImage}>
                    {images[1] ? <MaterialIcons name="check" size={20} color={colors.secondary} /> : <MaterialIcons name="add" size={20} color={colors.mutedForeground} />}
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.subUpload, { borderColor: colors.border, borderStyle: "dashed" }]} onPress={pickImage}>
                    {images[2] ? <MaterialIcons name="check" size={20} color={colors.secondary} /> : <MaterialIcons name="add" size={20} color={colors.mutedForeground} />}
                  </TouchableOpacity>
                </View>
              </View>
              {images.length > 0 && (
                 <Text style={[styles.charCount, { color: colors.secondary, marginTop: 4 }]}>{images.length} fotos selecionadas</Text>
              )}
            </View>

            {/* Submit Button */}
            <View style={{ marginTop: 24 }}>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: "#e8c08a" }]} // tertiary-fixed-dim color from HTML
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <>
                    <Text style={[styles.submitBtnText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Publicar Serviço</Text>
                    <MaterialCommunityIcons name="publish" size={18} color={colors.primary} />
                  </>
                )}
              </TouchableOpacity>
              <Text style={[styles.termsText, { color: colors.mutedForeground }]}>
                Ao publicar, você concorda com nossos termos de segurança.
              </Text>
            </View>

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}
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
    backgroundColor: "#fff",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerLogo: {
    fontSize: 22,
    letterSpacing: -1,
  },
  content: {
    padding: 20,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
  },
  formCard: {
    padding: 24,
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
  selector: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorText: {
    fontSize: 16,
  },
  dropdown: {
    marginTop: 4,
    borderWidth: 1.5,
    borderRadius: 12,
    backgroundColor: "#FFF",
    overflow: "hidden",
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  dropdownItemText: {
    fontSize: 15,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  bentoGrid: {
    flexDirection: "row",
    height: 120,
    gap: 12,
  },
  mainUpload: {
    flex: 2,
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafafa",
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  imageCount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#666",
  },
  uploadText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  secondaryUploads: {
    flex: 1,
    gap: 12,
  },
  subUpload: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafafa",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 100,
    gap: 8,
    shadowColor: "#e8c08a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    fontSize: 18,
    fontWeight: "700",
  },
  termsText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
    textAlign: "center",
    marginTop: 16,
  },
  charCount: {
    fontSize: 11,
    textAlign: "right",
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 20,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: 26,
    textAlign: "center",
  },
  successDesc: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  doneBtn: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    marginTop: 8,
  },
  doneBtnText: {
    fontSize: 16,
  },
});
