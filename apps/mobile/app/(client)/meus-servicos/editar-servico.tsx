import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useState, useLayoutEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  Image,
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

import { useAuth, API_BASE_URL } from "@/context/AuthContext";
import { useColors } from "../../../hooks/useColors";

export default function EditarServico() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const { fetchJobById, fetchMyData } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      tabBarStyle: { display: "none" },
    });
  }, [navigation]);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [images, setImages] = useState<{uri: string, base64?: string | null, isNew?: boolean}[]>([]);
  
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [loadingCep, setLoadingCep] = useState(false);

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
      if (data.images && Array.isArray(data.images)) {
        setImages(data.images.map((url: string) => ({ uri: url, isNew: false })));
      }
      if (data.location) {
        setLocation(data.location);
        // Tenta extrair partes do endereço se estiver no formato padrão
        // "Rua, Num - Bairro, Cidade/UF - CEP: 00000-000"
        try {
          const cepMatch = data.location.match(/CEP: (\d{5}-?\d{3})/);
          if (cepMatch) setCep(cepMatch[1]);
        } catch(e) {}
      }
    }
    setLoading(false);
  }

  async function fetchAddressByCep(val: string) {
    const cleanCep = val.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (!data.erro) {
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

  async function pickImage(index?: number) {
    const maxImages = 4;
    if (typeof index !== 'number' && images.length >= maxImages) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const newImage = { uri: asset.uri, base64: asset.base64, isNew: true };
      
      if (typeof index === 'number' && index < images.length) {
        const newImages = [...images];
        newImages[index] = newImage;
        setImages(newImages);
      } else {
        setImages([...images, newImage]);
      }
      Haptics.selectionAsync();
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_: any, i: number) => i !== index));
  };

  async function handleSave() {
    if (!title || !description || !location) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }
    
    setSaving(true);
    setError("");
    try {
      const token = await SecureStore.getItemAsync("trampai_auth_token");
      
      // 1. Upload das novas imagens
      const uploadedUrls: string[] = images.filter(img => !img.isNew).map(img => img.uri);
      
      for (const img of images) {
        if (img.isNew && img.base64) {
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

      const fullLocation = street ? `${street}, ${number} - ${neighborhood}, ${city}/${state} - CEP: ${cep}` : location;

      const res = await fetch(`${API_BASE_URL}/api/jobs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          location: fullLocation,
          categoryId,
          images: uploadedUrls
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
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { flex: 1, borderColor: colors.border }]}
                  placeholder="CEP"
                  keyboardType="numeric"
                  value={cep}
                  onChangeText={(val) => {
                    setCep(val);
                    if (val.replace(/\D/g, "").length === 8) fetchAddressByCep(val);
                  }}
                  maxLength={9}
                />
                {loadingCep && <ActivityIndicator color={colors.primary} style={{ marginLeft: 10 }} />}
              </View>

              <View style={[styles.row, { marginTop: 12, gap: 12 }]}>
                <TextInput
                  style={[styles.input, { flex: 2, borderColor: colors.border, backgroundColor: "#f9f9f9" }]}
                  placeholder="Rua / Avenida"
                  value={street}
                  onChangeText={setStreet}
                />
                <TextInput
                  style={[styles.input, { flex: 1, borderColor: colors.border, backgroundColor: "#f9f9f9" }]}
                  placeholder="Nº"
                  keyboardType="numeric"
                  value={number}
                  onChangeText={setNumber}
                />
              </View>

              <View style={[styles.row, { marginTop: 12, gap: 12 }]}>
                <TextInput
                  style={[styles.input, { flex: 1, borderColor: colors.border, backgroundColor: "#f9f9f9" }]}
                  placeholder="Bairro"
                  value={neighborhood}
                  onChangeText={setNeighborhood}
                />
                <TextInput
                  style={[styles.input, { flex: 1, borderColor: colors.border, backgroundColor: "#f9f9f9" }]}
                  placeholder="Cidade"
                  value={city}
                  onChangeText={setCity}
                />
              </View>

              <View style={[styles.row, { marginTop: 12 }]}>
                <TextInput
                  style={[styles.input, { flex: 1, borderColor: colors.border, backgroundColor: "#f9f9f9" }]}
                  placeholder="Estado (Ex: SP)"
                  value={state}
                  onChangeText={setState}
                  maxLength={2}
                  autoCapitalize="characters"
                />
              </View>
              
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Localização Atual: {location}</Text>
              </View>
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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={{ fontSize: 11, color: description.length < 20 ? "#ef4444" : colors.secondary, fontFamily: "Inter_600SemiBold" }}>
                  Mínimo 20 caracteres
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_500Medium" }}>
                  {description.length} caracteres
                </Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.navy, fontFamily: "Inter_700Bold" }]}>Fotos do Serviço (Máx 4)</Text>
              <View style={styles.bentoGrid}>
                <TouchableOpacity 
                  style={[styles.mainUpload, { borderColor: colors.navy + "20" }]} 
                  onPress={() => pickImage(0)}
                >
                  {images[0] ? (
                    <View style={{ flex: 1, width: '100%' }}>
                      <Image source={{ uri: images[0].uri }} style={styles.uploadedImg} />
                      <TouchableOpacity style={styles.removeBadge} onPress={() => removeImage(0)}>
                        <MaterialCommunityIcons name="close-circle" size={24} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={{ alignItems: 'center' }}>
                      <MaterialCommunityIcons name="camera-plus" size={32} color={colors.navy + "40"} />
                      <Text style={{ fontSize: 10, color: colors.navy + "40", marginTop: 4 }}>Adicionar Foto</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.secondaryUploads}>
                  {[1, 2, 3].map((idx) => (
                    <TouchableOpacity 
                      key={idx}
                      style={[styles.subUpload, { borderColor: colors.navy + "20" }]} 
                      onPress={() => pickImage(idx)}
                    >
                      {images[idx] ? (
                        <View style={{ flex: 1, width: '100%' }}>
                          <Image source={{ uri: images[idx].uri }} style={styles.uploadedImg} />
                          <TouchableOpacity style={styles.removeBadge} onPress={() => removeImage(idx)}>
                            <MaterialCommunityIcons name="close-circle" size={20} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <MaterialCommunityIcons name="plus" size={20} color={colors.navy + "40"} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
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
  row: { flexDirection: "row", alignItems: "center" },
  bentoGrid: { flexDirection: "row", height: 180, gap: 12 },
  mainUpload: { flex: 1.5, borderWidth: 2, borderStyle: 'dashed', borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa' },
  secondaryUploads: { flex: 1, gap: 8 },
  subUpload: { flex: 1, borderWidth: 2, borderStyle: 'dashed', borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa' },
  uploadedImg: { width: '100%', height: '100%', borderRadius: 10 },
  removeBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: '#fff', borderRadius: 12 },
});
