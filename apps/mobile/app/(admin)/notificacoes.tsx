import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

export default function NotificacoesAdmin() {
  const colors = useColors();
  const { api } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<"ALL" | "CLIENTS" | "PROVIDERS">("ALL");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert("Aviso", "Preencha o título e a mensagem.");
      return;
    }

    Alert.alert(
      "Confirmar Envio",
      `Deseja enviar esta notificação para ${
        target === "ALL" ? "TODOS" : target === "CLIENTS" ? "CLIENTES" : "PRESTADORES"
      }?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Enviar",
          onPress: async () => {
            setSending(true);
            try {
              await api.post("/admin/notifications/send", {
                title,
                message,
                target,
              });
              Alert.alert("Sucesso", "Notificações enviadas para a fila de processamento.");
              setTitle("");
              setMessage("");
            } catch (error) {
              Alert.alert("Erro", "Falha ao enviar notificações.");
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Push Center</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Envie mensagens em massa para seus usuários</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.foreground }]}>Público Alvo</Text>
          <View style={styles.targetRow}>
            {(["ALL", "CLIENTS", "PROVIDERS"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.targetBtn,
                  { backgroundColor: target === t ? colors.primary : colors.muted + "20" },
                ]}
                onPress={() => setTarget(t)}
              >
                <Text style={{ color: target === t ? "#fff" : colors.foreground, fontSize: 12, fontWeight: "bold" }}>
                  {t === "ALL" ? "TODOS" : t === "CLIENTS" ? "CLIENTES" : "PROS"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>Título da Notificação</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: Nova promoção de créditos!"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>Mensagem</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, height: 100 }]}
              multiline
              value={message}
              onChangeText={setMessage}
              placeholder="Descreva o conteúdo da notificação..."
              placeholderTextColor={colors.mutedForeground}
            />
          </View>

          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: colors.primary }]}
            onPress={handleSend}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="send" size={20} color="#fff" />
                <Text style={styles.sendBtnText}>DISPARAR NOTIFICAÇÃO</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.infoBox, { backgroundColor: colors.primary + "10" }]}>
          <MaterialCommunityIcons name="information-outline" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.primary }]}>
            As notificações serão enviadas apenas para usuários que possuem tokens válidos registrados no sistema.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 20 },
  header: { marginBottom: 10 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 4 },
  card: { padding: 20, borderRadius: 24, borderWidth: 1, gap: 20 },
  label: { fontSize: 14, fontWeight: "700", marginBottom: 8 },
  targetRow: { flexDirection: "row", gap: 8 },
  targetBtn: { flex: 1, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  inputGroup: { gap: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  sendBtn: {
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  sendBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  infoBox: { padding: 16, borderRadius: 16, flexDirection: "row", gap: 12, alignItems: "center" },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18, fontFamily: "Inter_500Medium" },
});
