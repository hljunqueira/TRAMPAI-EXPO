import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const storage = {
  getItem: async (key: string) => {
    if (Platform.OS === "web") {
      return localStorage.getItem(key);
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.error("SecureStore error:", e);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.error("SecureStore error:", e);
    }
  },
  deleteItem: async (key: string) => {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.error("SecureStore error:", e);
    }
  },
};
