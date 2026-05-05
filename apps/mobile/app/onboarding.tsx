import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
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
import * as ImagePicker from "expo-image-picker";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { CATEGORIES } from "@/constants/categories";

const TOTAL_STEPS = 6;

type ProfileGoal = "CLIENT" | "PROVIDER" | "BOTH";

export default function OnboardingScreen() {
  const colors = useColors();
  const { user, completeOnboarding } = useAuth();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<ProfileGoal>("CLIENT");
  
  // Dados Comuns
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [state, setState] = useState("");
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  
  // Dados Prestador
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [docPhoto, setDocPhoto] = useState<string | null>(null);
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isProvider = goal === "PROVIDER" || goal === "BOTH";

  function formatPhone(text: string) {
    const cleaned = text.replace(/\D/g, "").slice(0, 11);
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }

  function formatCep(text: string) {
    const cleaned = text.replace(/\D/g, "").slice(0, 8);
    if (cleaned.length <= 5) return cleaned;
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }

  async function handleCepChange(text: string) {
    const formatted = formatCep(text);
    setCep(formatted);

    const cleaned = formatted.replace(/\D/g, "");
    if (cleaned.length === 8) {
      setIsFetchingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setCity(data.localidade);
          setNeighborhood(data.bairro);
          setAddress(data.logradouro);
          setState(data.uf);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          
          // Se o CEP for único para a cidade, os campos bairro e logradouro virão vazios
          // O usuário precisará preencher manualmente, o que o ViaCEP já sinaliza.
        } else {
          setError("CEP não encontrado");
        }
      } catch (e) {
        console.error("Erro ao buscar CEP:", e);
      } finally {
        setIsFetchingCep(false);
      }
    }
  }

  async function pickImage(type: 'doc' | 'selfie') {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      if (type === 'doc') setDocPhoto(result.assets[0].base64);
      else setSelfiePhoto(result.assets[0].base64);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  function nextStep() {
    setError("");
    
    if (step === 1) { // Perfil
      if (!name.trim()) return setError("Informe seu nome");
    }
    
    if (step === 2) { // Localização
      if (cep.replace(/\D/g, "").length < 8) return setError("Informe um CEP válido");
      if (!city.trim()) return setError("Informe sua cidade");
      if (!neighborhood.trim()) return setError("Informe o bairro");
      if (!address.trim()) return setError("Informe o endereço");
      if (!number.trim()) return setError("Informe o número");
      if (!phone.replace(/\D/g, "") || phone.replace(/\D/g, "").length < 10)
        return setError("Informe um WhatsApp válido");
    }

    // Passos de Prestador
    if (isProvider) {
      if (step === 4 && selectedCategories.length === 0) return setError("Selecione pelo menos uma categoria");
      if (step === 5 && bio.length < 20) return setError("Sua bio deve ter pelo menos 20 caracteres");
    } else {
      // Se for só cliente, pula os passos de prestador
      if (step === 3) {
        return handleFinish();
      }
    }

    if (step < TOTAL_STEPS) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep((s) => s + 1);
    } else {
      handleFinish();
    }
  }

  async function handleFinish() {
    setLoading(true);
    try {
      await completeOnboarding({
        name: name.trim(),
        phone: phone.replace(/\D/g, ""),
        city: city.trim(),
        neighborhood: neighborhood.trim(),
        state: state.trim(),
        cep: cep.replace(/\D/g, ""),
        address: address.trim(),
        number: number.trim(),
        complement: complement.trim(),
        isProvider,
        role: isProvider ? "provider" : "client",
        onboardingCompletedAt: new Date().toISOString(),
        providerBio: isProvider ? bio : undefined,
        providerCategories: isProvider ? selectedCategories : undefined,
      });

      // Se enviou fotos, chamar endpoint de documentos
      if (isProvider && (docPhoto || selfiePhoto)) {
        const token = await (require("expo-secure-store").getItemAsync("trampai_auth_token"));
        await fetch("https://api.trampai.com.br/api/users/me/documents", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ documentBase64: docPhoto, selfieBase64: selfiePhoto })
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/");
    } catch (e) {
      console.error(e);
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const progress = step / (isProvider ? TOTAL_STEPS : 3);

  return (
    <LinearGradient
      colors={["#21284E", "#1a2040", "#0f1530"]}
      style={[
        styles.container,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
      <View style={styles.progressBarWrapper}>
        <View style={[styles.progressTrack, { backgroundColor: "#FFFFFF20" }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
                backgroundColor: "#F69926",
              },
            ]}
          />
        </View>
        <Text style={[styles.stepCounter, { color: "#FFFFFF90", fontFamily: "Inter_500Medium" }]}>
          Passo {step} de {isProvider ? TOTAL_STEPS : 3}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centerBlock}>
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={[styles.stepTitle, { color: "#FFFFFF", fontFamily: "Inter_700Bold" }]}>Como quer ser chamado?</Text>
              <Text style={[styles.stepSub, { color: "#FFFFFF90", fontFamily: "Inter_400Regular" }]}>Use seu nome real para gerar confiança</Text>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="Seu nome completo"
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={[styles.stepTitle, { color: "#FFFFFF", fontFamily: "Inter_700Bold" }]}>Onde você está?</Text>
              <Text style={[styles.stepSub, { color: "#FFFFFF90", fontFamily: "Inter_400Regular" }]}>Informe seu CEP para facilitar o preenchimento</Text>

              <View style={styles.inputGroup}>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    style={styles.input}
                    placeholder="CEP"
                    placeholderTextColor="#999"
                    value={cep}
                    onChangeText={handleCepChange}
                    keyboardType="numeric"
                  />
                  {isFetchingCep && (
                    <ActivityIndicator 
                      style={{ position: 'absolute', right: 16, top: 18 }} 
                      color="#F69926" 
                    />
                  )}
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TextInput 
                    style={[styles.input, { flex: 2 }]} 
                    placeholder="Cidade" 
                    placeholderTextColor="#999" 
                    value={city} 
                    onChangeText={setCity} 
                  />
                  <TextInput 
                    style={[styles.input, { flex: 1 }]} 
                    placeholder="UF" 
                    placeholderTextColor="#999" 
                    value={state} 
                    onChangeText={setState} 
                    maxLength={2}
                    autoCapitalize="characters"
                  />
                </View>

                <TextInput 
                  style={styles.input} 
                  placeholder="Bairro" 
                  placeholderTextColor="#999" 
                  value={neighborhood} 
                  onChangeText={setNeighborhood} 
                />
                
                <TextInput 
                  style={styles.input} 
                  placeholder="Endereço (Rua/Av)" 
                  placeholderTextColor="#999" 
                  value={address} 
                  onChangeText={setAddress} 
                />

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TextInput 
                    style={[styles.input, { flex: 1 }]} 
                    placeholder="Número" 
                    placeholderTextColor="#999" 
                    value={number} 
                    onChangeText={setNumber} 
                    keyboardType="numeric"
                  />
                  <TextInput 
                    style={[styles.input, { flex: 2 }]} 
                    placeholder="Complemento" 
                    placeholderTextColor="#999" 
                    value={complement} 
                    onChangeText={setComplement} 
                  />
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="WhatsApp"
                  placeholderTextColor="#999"
                  value={phone}
                  onChangeText={(t) => setPhone(formatPhone(t))}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={[styles.stepTitle, { color: "#FFFFFF", fontFamily: "Inter_700Bold" }]}>Qual seu objetivo?</Text>
              <View style={styles.goalOptions}>
                {[
                  { id: "CLIENT", label: "Contratar", icon: "account-search-outline", desc: "Quero encontrar profissionais" },
                  { id: "PROVIDER", label: "Trabalhar", icon: "briefcase-outline", desc: "Quero oferecer meus serviços" },
                  { id: "BOTH", label: "Os Dois!", icon: "account-switch-outline", desc: "Quero contratar e trabalhar" },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.goalCard, goal === opt.id && styles.goalCardActive]}
                    onPress={() => setGoal(opt.id as ProfileGoal)}
                  >
                    <MaterialCommunityIcons name={opt.icon as any} size={32} color={goal === opt.id ? "#FFF" : "#F69926"} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.goalLabel, goal === opt.id && { color: "#FFF" }]}>{opt.label}</Text>
                      <Text style={[styles.goalDesc, goal === opt.id && { color: "#FFF9" }]}>{opt.desc}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 4 && isProvider && (
            <View style={styles.stepContainer}>
              <Text style={[styles.stepTitle, { color: "#FFFFFF", fontFamily: "Inter_700Bold" }]}>O que você faz?</Text>
              <Text style={[styles.stepSub, { color: "#FFFFFF90", fontFamily: "Inter_400Regular" }]}>Selecione suas especialidades</Text>
              <View style={styles.chipContainer}>
                {CATEGORIES.map((cat: { id: string; name: string }) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.chip, selectedCategories.includes(cat.id) && styles.chipActive]}
                    onPress={() => {
                      setSelectedCategories(prev => 
                        prev.includes(cat.id) ? prev.filter(i => i !== cat.id) : [...prev, cat.id]
                      );
                    }}
                  >
                    <Text style={[styles.chipText, selectedCategories.includes(cat.id) && styles.chipTextActive]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 5 && isProvider && (
            <View style={styles.stepContainer}>
              <Text style={[styles.stepTitle, { color: "#FFFFFF", fontFamily: "Inter_700Bold" }]}>Sua Bio</Text>
              <Text style={[styles.stepSub, { color: "#FFFFFF90", fontFamily: "Inter_400Regular" }]}>Conte um pouco sobre sua experiência e como você trabalha.</Text>
              <TextInput
                style={[styles.input, { height: 120, textAlignVertical: "top" }]}
                placeholder="Ex: Sou eletricista há 10 anos, especializado em reformas residenciais e automação..."
                placeholderTextColor="#999"
                multiline
                value={bio}
                onChangeText={setBio}
              />
            </View>
          )}

          {step === 6 && isProvider && (
            <View style={styles.stepContainer}>
              <Text style={[styles.stepTitle, { color: "#FFFFFF", fontFamily: "Inter_700Bold" }]}>Verificação</Text>
              <Text style={[styles.stepSub, { color: "#FFFFFF90", fontFamily: "Inter_400Regular" }]}>Segurança é prioridade. Envie seus documentos para análise.</Text>
              
              <View style={styles.uploadRow}>
                <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage('doc')}>
                  {docPhoto ? <MaterialCommunityIcons name="check-circle" size={40} color="#22c55e" /> : <MaterialCommunityIcons name="card-account-details-outline" size={40} color="#F69926" />}
                  <Text style={styles.uploadLabel}>Foto do Documento (Frente)</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage('selfie')}>
                  {selfiePhoto ? <MaterialCommunityIcons name="check-circle" size={40} color="#22c55e" /> : <MaterialCommunityIcons name="camera-account" size={40} color="#F69926" />}
                  <Text style={styles.uploadLabel}>Selfie com Documento</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity style={styles.backBtn} onPress={() => { setStep((s) => s - 1); setError(""); }}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.nextBtn} onPress={nextStep} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Text style={styles.nextBtnText}>{ (isProvider ? step === TOTAL_STEPS : step === 3) ? "FINALIZAR" : "PRÓXIMO" }</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressBarWrapper: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, gap: 12, marginBottom: 20 },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  stepCounter: { fontSize: 12 },
  content: { flexGrow: 1, padding: 24 },
  centerBlock: { flex: 1, justifyContent: "center" },
  stepContainer: { gap: 24 },
  stepTitle: { fontSize: 26, textAlign: "center" },
  stepSub: { fontSize: 15, textAlign: "center", color: "#FFFFFF90", lineHeight: 22 },
  inputGroup: { gap: 12 },
  input: { backgroundColor: "#FFFFFF", borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16, fontSize: 16, color: "#21284E", fontWeight: "500" },
  goalOptions: { gap: 12 },
  goalCard: { flexDirection: "row", alignItems: "center", padding: 20, backgroundColor: "#FFFFFF10", borderRadius: 20, gap: 16, borderWidth: 1, borderColor: "transparent" },
  goalCardActive: { backgroundColor: "#F69926", borderColor: "#F69926" },
  goalLabel: { fontSize: 18, color: "#FFF", fontWeight: "bold" },
  goalDesc: { fontSize: 13, color: "#FFF8" },
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" },
  chip: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#FFFFFF10", borderRadius: 100, borderWidth: 1, borderColor: "#FFFFFF20" },
  chipActive: { backgroundColor: "#F69926", borderColor: "#F69926" },
  chipText: { color: "#FFF9", fontSize: 14 },
  chipTextActive: { color: "#FFF", fontWeight: "bold" },
  uploadRow: { flexDirection: "row", gap: 16 },
  uploadBox: { flex: 1, height: 140, backgroundColor: "#FFFFFF10", borderRadius: 20, alignItems: "center", justifyContent: "center", gap: 12, borderStyle: "dashed", borderWidth: 2, borderColor: "#FFFFFF30" },
  uploadLabel: { color: "#FFF", fontSize: 11, textAlign: "center", paddingHorizontal: 8 },
  error: { color: "#FF4D4D", textAlign: "center", marginTop: 16, fontSize: 14, fontWeight: "600" },
  footer: { flexDirection: "row", paddingHorizontal: 24, gap: 16, marginTop: 20 },
  backBtn: { width: 56, height: 56, borderRadius: 18, backgroundColor: "#FFFFFF15", alignItems: "center", justifyContent: "center" },
  nextBtn: { flex: 1, height: 56, backgroundColor: "#F69926", borderRadius: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  nextBtnText: { color: "#FFF", fontSize: 15, fontWeight: "900", letterSpacing: 1 },
});