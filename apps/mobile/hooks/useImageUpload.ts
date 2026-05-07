import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';

interface UploadOptions {
  aspect?: [number, number];
  quality?: number;
  allowsEditing?: boolean;
}

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const { api } = useAuth();

  /**
   * Realiza o upload de uma string base64 para o servidor
   */
  const uploadImage = async (base64: string, ext = 'jpg') => {
    setUploading(true);
    try {
      const response = await api.post('/upload', {
        imageBase64: base64,
        ext,
      });
      
      // O api-client-react costuma retornar { data } ou o objeto direto dependendo da implementação
      // No AuthContext está como Promise<any>, vamos assumir que retorna o body
      return response.data.url;
    } catch (error: any) {
      console.error('[useImageUpload] Erro no upload:', error);
      Alert.alert('Erro', 'Não foi possível enviar a imagem para o servidor.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  /**
   * Abre a galeria para selecionar uma imagem
   */
  const pickImage = async (options: UploadOptions = {}) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão Negada', 'Precisamos de acesso à sua galeria para selecionar fotos.');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [1, 1],
        quality: options.quality ?? 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        return await uploadImage(result.assets[0].base64);
      }
      return null;
    } catch (error) {
      console.error('[useImageUpload] Erro ao selecionar imagem:', error);
      return null;
    }
  };

  /**
   * Abre a câmera para tirar uma foto
   */
  const takePhoto = async (options: UploadOptions = {}) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão Negada', 'Precisamos de acesso à sua câmera para tirar fotos.');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [1, 1],
        quality: options.quality ?? 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        return await uploadImage(result.assets[0].base64);
      }
      return null;
    } catch (error) {
      console.error('[useImageUpload] Erro ao tirar foto:', error);
      return null;
    }
  };

  return {
    uploading,
    pickImage,
    takePhoto,
    uploadImage,
  };
}
