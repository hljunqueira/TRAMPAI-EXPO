import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import * as SecureStore from "expo-secure-store";
import { useAuth, API_BASE_URL } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { SUGGESTED_CATEGORIES } from "@/constants/categories";
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
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [description, setDescription] = useState("");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [city, setCity] = useState(user?.city || "");
  const [neighborhood, setNeighborhood] = useState(user?.neighborhood || "");
  const [state, setState] = useState("");
  const [images, setImages] = useState<{uri: string, base64?: string | null}[]>([]);
  
  const [loadingCep, setLoadingCep] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Mescla categorias do banco com fallback de categorias fixas
  const allCategories = useMemo(() => {
    const apiCats = categoriesData || [];
    if (apiCats.length > 0) return apiCats;
    // Fallback: montar lista a partir das categorias fixas
    return SUGGESTED_CATEGORIES.map((name, i) => ({ id: `local-${i}`, name }));
  }, [categoriesData]);

  const selectedCategoryName = useMemo(() => {
    if (showCustomInput) return customCategory || "";
    return allCategories.find(c => c.id === selectedCategoryId)?.name || "";
  }, [allCategories, selectedCategoryId, showCustomInput, customCategory]);

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
        setStreet(data.logradouro);
        setCity(data.localidade);
        setNeighborhood(data.bairro);
        setState(data.uf);
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
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setImages([...images, { uri: asset.uri, base64: asset.base64 }]);
      Haptics.selectionAsync();
    }
  }

  async function handleSubmit() {
    setError("");
    if (!title.trim()) return setError("Informe o título do serviço");
    if (!selectedCategoryId && !customCategory.trim()) return setError("Selecione ou informe uma categoria");
    if (!description.trim() || description.length < 20)
      return setError("Descreva o serviço com pelo menos 20 caracteres");
    if (!city.trim()) return setError("Informe a cidade");
    
    if (myOpenServices.length >= 3)
      return setError("Você já tem 3 serviços abertos. Feche um antes de postar outro.");

    let categoryIdToUse = selectedCategoryId;

    // Se o cliente digitou uma categoria personalizada, criar via API
    if (showCustomInput && customCategory.trim()) {
      try {
        const token = await SecureStore.getItemAsync("trampai_auth_token");
        const catRes = await fetch(`${API_BASE_URL}/api/categories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ name: customCategory.trim() }),
        });
        if (catRes.ok) {
          const newCat = await catRes.json();
          categoryIdToUse = newCat.id;
        } else {
          return setError("Não foi possível criar a categoria. Tente selecionar uma da lista.");
        }
      } catch {
        return setError("Erro ao criar categoria personalizada.");
      }
    }

    try {
      const fullLocation = street ? `${street}, ${number} - ${neighborhood}, ${city}/${state} - CEP: ${cep}` : city;

      // 1. Upload das imagens
      const uploadedUrls: string[] = [];
      const token = await SecureStore.getItemAsync("trampai_auth_token");

      for (const img of images) {
        if (img.base64) {
          try {
            const uploadRes = await fetch(`${API_BASE_URL}/api/upload`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({ imageBase64: img.base64 }),
            });
            if (uploadRes.ok) {
              const data = await uploadRes.json();
              uploadedUrls.push(data.url);
            }
          } catch (uploadErr) {
            console.error("Erro ao subir imagem:", uploadErr);
          }
        }
      }

      await createJob({
        data: {
          title: title.trim(),
          description: description.trim(),
          categoryId: categoryIdToUse,
          budget: 0, 
          location: fullLocation,
          images: uploadedUrls,
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
          <LinearGradient
            colors={[colors.secondary + "20", colors.secondary + "05"]}
            style={styles.successIcon}
          >
            <MaterialCommunityIcons name="check-decagram" size={64} color={colors.secondary} />
          </LinearGradient>
          <Text style={[styles.successTitle, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>
            Tudo Pronto! 🚀
          </Text>
          <Text style={[styles.successDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Seu serviço foi publicado. Agora é só aguardar as propostas chegarem no seu WhatsApp!
          </Text>
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: colors.primary, borderRadius: 20 }]}
            onPress={() => router.replace("/(client)/meus-servicos")}
            activeOpacity={0.85}
          >
            <Text style={[styles.doneBtnText, { fontFamily: "Inter_700Bold", color: "#FFF" }]}>
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
            <Text style={[styles.title, { color: colors.primary, fontFamily: "Inter_800ExtraBold" }]}>Novo Serviço</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Preencha os detalhes abaixo para publicar.</Text>
          </View>

          <View style={[styles.formCard, { backgroundColor: "#FFF", borderRadius: 24 }]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>O que você precisa?</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.primary + "10", backgroundColor: colors.primary + "03" }]}
                placeholder="Ex: Consertar chuveiro queimado"
                placeholderTextColor={colors.mutedForeground}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Categoria</Text>
              <View style={styles.visualCategories}>
                {[
                  { id: '48ae9829-6c1b-4c67-90b9-6be01248b96b', name: 'Limpeza', icon: 'broom' },
                  { id: 'b1532dcc-37c9-491e-8a9a-1d71eac5f3b4', name: 'Elétrica', icon: 'flash' },
                  { id: '28474ab0-370a-4c13-8d6c-081b145153ef', name: 'Reforma', icon: 'hammer-wrench' },
                  { id: '7b3d1a97-b2b1-4691-bead-c5a4db13f884', name: 'Pintura', icon: 'format-paint' },
                  { id: 'feee29b6-e531-445a-bc05-314753dcfba7', name: 'Mudança', icon: 'truck-delivery' },
                  { id: '60e81207-78b2-4ab7-95ea-eaa14fa6b883', name: 'Encanador', icon: 'water-pump' },
                  { id: 'other', name: 'Outros', icon: 'dots-horizontal' },
                ].map((cat) => (
                  <TouchableOpacity 
                    key={cat.id}
                    style={[
                      styles.catOption, 
                      { 
                        backgroundColor: (selectedCategoryId === cat.id || (cat.id === 'other' && showCustomInput)) ? colors.primary : colors.primary + "05",
                        borderColor: (selectedCategoryId === cat.id || (cat.id === 'other' && showCustomInput)) ? colors.primary : "transparent"
                      }
                    ]}
                    onPress={() => {
                      if (cat.id === 'other') {
                        setShowCustomInput(true);
                        setSelectedCategoryId("");
                      } else {
                        setShowCustomInput(false);
                        setSelectedCategoryId(cat.id);
                        setCustomCategory("");
                      }
                    }}
                  >
                    <MaterialCommunityIcons 
                      name={cat.icon as any} 
                      size={20} 
                      color={(selectedCategoryId === cat.id || (cat.id === 'other' && showCustomInput)) ? "#FFF" : colors.primary} 
                    />
                    <Text style={[
                      styles.catOptionText, 
                      { color: (selectedCategoryId === cat.id || (cat.id === 'other' && showCustomInput)) ? "#FFF" : colors.primary, fontFamily: "Inter_600SemiBold" }
                    ]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {showCustomInput && (
                <TextInput
                  style={[styles.input, { borderColor: colors.accent, marginTop: 12, backgroundColor: colors.accent + "05" }]}
                  placeholder="Qual o tipo de serviço?"
                  value={customCategory}
                  onChangeText={setCustomCategory}
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Onde será o serviço?</Text>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={[styles.input, { borderColor: colors.primary + "10", backgroundColor: colors.primary + "03" }]}
                    placeholder="CEP"
                    keyboardType="numeric"
                    value={cep}
                    onChangeText={(val) => {
                      setCep(val);
                      if (val.replace(/\D/g, "").length === 8) fetchAddressByCep(val);
                    }}
                    maxLength={9}
                  />
                </View>
                {loadingCep && <ActivityIndicator color={colors.primary} style={{ marginLeft: 10 }} />}
              </View>
              
              <View style={[styles.row, { marginTop: 12, gap: 12 }]}>
                <TextInput
                  style={[styles.input, { flex: 2, borderColor: colors.primary + "10", backgroundColor: "#f9f9f9" }]}
                  placeholder="Rua / Avenida"
                  value={street}
                  onChangeText={setStreet}
                />
                <TextInput
                  style={[styles.input, { flex: 1, borderColor: colors.primary + "10", backgroundColor: "#f9f9f9" }]}
                  placeholder="Nº"
                  keyboardType="numeric"
                  value={number}
                  onChangeText={setNumber}
                />
              </View>

              <View style={[styles.row, { marginTop: 12, gap: 12 }]}>
                <TextInput
                  style={[styles.input, { flex: 1, borderColor: colors.primary + "10", backgroundColor: "#f9f9f9" }]}
                  placeholder="Bairro"
                  value={neighborhood}
                  onChangeText={setNeighborhood}
                />
                <TextInput
                  style={[styles.input, { flex: 1, borderColor: colors.primary + "10", backgroundColor: "#f9f9f9" }]}
                  placeholder="Cidade"
                  value={city}
                  onChangeText={setCity}
                />
              </View>

              <View style={[styles.row, { marginTop: 12 }]}>
                <TextInput
                  style={[styles.input, { flex: 1, borderColor: colors.primary + "10", backgroundColor: "#f9f9f9" }]}
                  placeholder="Estado (Ex: SP)"
                  value={state}
                  onChangeText={setState}
                  maxLength={2}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Descrição Detalhada</Text>
              <TextInput
                style={[styles.textarea, { borderColor: colors.primary + "10", backgroundColor: colors.primary + "03" }]}
                placeholder="Explique o que precisa ser feito..."
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>Fotos (Opcional)</Text>
              <View style={styles.bentoGrid}>
                  <TouchableOpacity style={[styles.mainUpload, { borderColor: colors.primary + "20" }]} onPress={pickImage}>
                  {images[0] ? (
                    <Image source={{ uri: images[0].uri }} style={styles.uploadedImg} />
                  ) : (
                    <View style={{ alignItems: 'center' }}>
                      <MaterialCommunityIcons name="camera-plus" size={32} color={colors.primary + "40"} />
                      <Text style={{ fontSize: 10, color: colors.primary + "40", marginTop: 4 }}>Principal</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <View style={styles.secondaryUploads}>
                  <TouchableOpacity style={[styles.subUpload, { borderColor: colors.primary + "20" }]} onPress={pickImage}>
                    {images[1] ? <Image source={{ uri: images[1].uri }} style={styles.uploadedImg} /> : <MaterialCommunityIcons name="plus" size={20} color={colors.primary + "40"} />}
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.subUpload, { borderColor: colors.primary + "20" }]} onPress={pickImage}>
                    {images[2] ? <Image source={{ uri: images[2].uri }} style={styles.uploadedImg} /> : <MaterialCommunityIcons name="plus" size={20} color={colors.primary + "40"} />}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, { backgroundColor: colors.secondary, marginTop: 12 }]} 
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : (
                <>
                  <Text style={[styles.submitBtnText, { color: "#FFF", fontFamily: "Inter_700Bold" }]}>Publicar Serviço Agora</Text>
                  <MaterialCommunityIcons name="rocket-launch" size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
  title: { fontSize: 24, marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: "center", marginBottom: 16 },
  stepIndicator: { flexDirection: 'row', width: '100%', marginBottom: 10 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stepNumber: { fontSize: 14, fontWeight: '700' },
  stepLine: { flex: 1, height: 2, marginHorizontal: 8 },
  visualCategories: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catOption: { flexBasis: '30%', padding: 12, borderRadius: 16, alignItems: 'center', gap: 6, borderWidth: 1.5 },
  catOptionText: { fontSize: 10, textAlign: 'center' },
  stepActions: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 100, gap: 8 },
  nextBtnText: { fontSize: 16 },
  backBtn: { paddingHorizontal: 20 },
  backBtnText: { fontSize: 14 },
  uploadedImg: { width: '100%', height: '100%', borderRadius: 10 },
  formCard: {
    padding: 24,
    shadowColor: "#0b1339",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 15, marginBottom: 10 },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  textarea: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: "top",
  },
  row: { flexDirection: "row", alignItems: "center" },
  bentoGrid: { flexDirection: "row", height: 140, gap: 12 },
  mainUpload: { flex: 2, borderWidth: 2, borderStyle: 'dashed', borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa' },
  secondaryUploads: { flex: 1, gap: 12 },
  subUpload: { flex: 1, borderWidth: 2, borderStyle: 'dashed', borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa' },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 100, gap: 10 },
  submitBtnText: { fontSize: 18 },
  errorText: { color: "#ef4444", fontSize: 13, textAlign: "center", marginTop: 16, fontFamily: "Inter_600SemiBold" },
  successContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 24 },
  successIcon: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 28, textAlign: "center" },
  successDesc: { fontSize: 16, textAlign: "center", lineHeight: 24 },
  doneBtn: { width: '100%', alignItems: 'center', paddingVertical: 18, marginTop: 12 },
  doneBtnText: { fontSize: 18 },
});
