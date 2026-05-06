import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";


interface Category {
  id: string;
  name: string;
  icon: string;
}

export default function CategoriasAdmin() {
  const colors = useColors();
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("tag-outline");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get("/categories");
      setCategories(response.data);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar as categorias.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSubmitting(true);

    try {
      if (editingCategory) {
        await api.patch(`/admin/categories/${editingCategory.id}`, { name, icon });
        Alert.alert("Sucesso", "Categoria atualizada.");
      } else {
        await api.post("/categories", { name, icon });
        Alert.alert("Sucesso", "Categoria criada.");
      }
      setModalVisible(false);
      fetchCategories();
    } catch (error) {
      Alert.alert("Erro", "Erro ao salvar categoria.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (category: Category) => {
    Alert.alert(
      "Confirmar Exclusão",
      `Deseja realmente excluir a categoria "${category.name}"? Isso pode afetar serviços existentes.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/admin/categories/${category.id}`);
              fetchCategories();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir. Verifique se há serviços vinculados.");
            }
          },
        },
      ]
    );
  };

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setIcon(category.icon);
    } else {
      setEditingCategory(null);
      setName("");
      setIcon("tag-outline");
    }
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Categorias</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => openModal()}
        >
          <MaterialCommunityIcons name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardMain}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + "15" }]}>
                <MaterialCommunityIcons name={item.icon as any} size={24} color={colors.primary} />
              </View>
              <Text style={[styles.categoryName, { color: colors.foreground }]}>{item.name}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => openModal(item)} style={styles.actionBtn}>
                <MaterialCommunityIcons name="pencil-outline" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {editingCategory ? "Editar Categoria" : "Nova Categoria"}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Nome</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Pintura, Limpeza..."
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Ícone (MaterialCommunityIcons)</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
                value={icon}
                onChangeText={setIcon}
                placeholder="Ex: brush, hammer, home..."
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.muted + "20" }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: colors.foreground }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={handleSave}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: "white", fontWeight: "bold" }}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  addButton: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  list: { padding: 20, gap: 12 },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardMain: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconContainer: { width: 48, height: 48, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  categoryName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  actions: { flexDirection: "row", gap: 8 },
  actionBtn: { padding: 8 },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32, gap: 20 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontFamily: "Inter_500Medium" },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 10 },
  modalBtn: { flex: 1, height: 50, borderRadius: 12, justifyContent: "center", alignItems: "center" },
});
