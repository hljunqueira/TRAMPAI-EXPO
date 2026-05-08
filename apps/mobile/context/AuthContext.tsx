import { storage } from "@/lib/storage";
import { Platform } from "react-native";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Alert } from "react-native";
import * as Location from "expo-location";

import {
  setAuthTokenGetter,
  setBaseUrl,
  useLogin,
  useRegister,
  useUnlockJob,
  useUpdateMe,
} from "@workspace/api-client-react";


import {
  User,
  Service,
  LeadUnlock,
  Transaction,
  UnlockType,
  LoginBody,
  UserCreate,
} from "@/types";

// Importação dinâmica será feita dentro das funções para evitar crash no Expo Go
let GoogleSignin: any = null;
try {
  GoogleSignin = require("@react-native-google-signin/google-signin").GoogleSignin;
} catch (e) {
  // Silencioso para o Expo Go
}

interface AuthContextType {
  appConfig: Record<string, string> | null;
  user: User | null;
  isLoading: boolean;
  activeMode: "CLIENT" | "PROVIDER" | "ADMIN";
  switchActiveMode: (mode: "CLIENT" | "PROVIDER" | "ADMIN") => void;
  services: Service[];
  leads: LeadUnlock[];
  transactions: Transaction[];
  reviews: any[];
  allUsers: User[];
  adminStats: any | null;
  adminRecentJobs: any[];
  login: (data: LoginBody) => Promise<void>;
  register: (data: UserCreate) => Promise<void>;
  logout: () => Promise<void>;
  fetchAdminData: () => Promise<void>;
  fetchMyData: () => Promise<void>;
  fetchJobById: (id: string) => Promise<any>;
  banUser: (userId: string, reason: string) => Promise<void>;
  approveVerification: (userId: string) => Promise<void>;
  rejectVerification: (userId: string, reason: string) => Promise<void>;
  createService: (data: any) => Promise<void>;
  unlockService: (serviceId: string, type: UnlockType) => Promise<{ whatsappLink: string } | { error: string }>;
  googleLogin: () => Promise<void>;
  completeOnboarding: (data: any) => Promise<void>;
  buyCredits: (packageId?: string, customCredits?: number) => Promise<void>;
  unbanUser: (userId: string) => Promise<void>;
  getUserLocation: () => Promise<Location.LocationObject | null>;
  updateJobStatus: (jobId: string, status: string) => Promise<boolean>;
  deleteJob: (jobId: string) => Promise<boolean>;
  api: {
    get: (url: string) => Promise<any>;
    post: (url: string, data: any) => Promise<any>;
    patch: (url: string, data: any) => Promise<any>;
    delete: (url: string) => Promise<any>;
  };
}

const AuthContext = createContext<AuthContextType | null>(null);

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://api.trampai.com.br";
const TOKEN_KEY = "trampai_auth_token";
const USER_KEY = "trampai_user_data";

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeMode, setActiveMode] = useState<"CLIENT" | "PROVIDER" | "ADMIN">("CLIENT");
  const [services, setServices] = useState<Service[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any | null>(null);
  const [adminRecentJobs, setAdminRecentJobs] = useState<any[]>([]);
  const [appConfig, setAppConfig] = useState<Record<string, string> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const unlockMutation = useUnlockJob();
  const updateMeMutation = useUpdateMe();

  async function loadAppConfig() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/config`);
      if (res.ok) {
        setAppConfig(await res.json());
      }
    } catch (e) {
      console.error("Erro ao carregar appConfig:", e);
    }
  }

  useEffect(() => {
    setBaseUrl(API_BASE_URL);
    setAuthTokenGetter(async () => {
      return await storage.getItem(TOKEN_KEY);
    });
    loadSession();
    loadAppConfig();
  }, []);

  async function loadSession() {
    try {
      const token = await storage.getItem(TOKEN_KEY);
      const userData = await storage.getItem(USER_KEY);
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        const role = parsedUser.role?.toLowerCase();
        setActiveMode(role === "admin" ? "ADMIN" : role === "provider" ? "PROVIDER" : "CLIENT");
        fetchMyData();
        if (role === "admin") fetchAdminData();
      }
    } catch (e) {
      console.error("Erro ao carregar sessão:", e);
    } finally {
      setIsLoading(false);
    }
  }

  const handleApiError = async (res: Response) => {
    let errorMessage = "Ocorreu um erro inesperado. Tente novamente.";
    
    if (res.status === 502 || res.status === 503) {
      errorMessage = "O servidor está em manutenção rápida. Voltamos em instantes! 🛠️";
    } else if (res.status === 401) {
      errorMessage = "Sua sessão expirou. Por favor, faça login novamente.";
      logout();
    } else if (res.status === 404) {
      errorMessage = "O recurso solicitado não foi encontrado.";
    } else if (res.status === 500) {
      errorMessage = "Erro interno no servidor. Nossa equipe já foi notificada.";
    } else {
      try {
        const data = await res.json();
        errorMessage = data.error || data.message || errorMessage;
      } catch (e) {
        // Se não for JSON, tenta pegar o texto
        try {
          const text = await res.text();
          if (text) errorMessage = text;
        } catch (e2) {}
      }
    }

    Alert.alert("Ops!", errorMessage);
    throw new Error(errorMessage);
  };

  const api = {
    get: async (url: string) => {
      const token = await storage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/api${url}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return handleApiError(res);
      return { data: await res.json(), ok: true };
    },
    post: async (url: string, data: any) => {
      const token = await storage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/api${url}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) return handleApiError(res);
      return { data: await res.json(), ok: true };
    },
    patch: async (url: string, data: any) => {
      const token = await storage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/api${url}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) return handleApiError(res);
      return { data: await res.json(), ok: true };
    },
    delete: async (url: string) => {
      const token = await storage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/api${url}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return handleApiError(res);
      return { data: await res.json(), ok: true };
    },
  };

  async function fetchAdminData() {
    try {
      const token = await storage.getItem(TOKEN_KEY);
      if (!token) return;

      const [statsRes, usersRes, jobsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/admin/jobs/recent`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (statsRes.ok) setAdminStats(await statsRes.json());
      if (usersRes.ok) setAllUsers(await usersRes.json());
      if (jobsRes.ok) setAdminRecentJobs(await jobsRes.json());
      
      if (!statsRes.ok) return handleApiError(statsRes);
    } catch (e) {
      console.error("Erro ao buscar dados de admin:", e);
    }
  }

  async function fetchMyData() {
    try {
      const token = await storage.getItem(TOKEN_KEY);
      if (!token) return;

      const [jobsRes, leadsRes, transRes, userRes, revRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/jobs/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/leads/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/transactions/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/reviews/me`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (jobsRes.ok) setServices(await jobsRes.json());
      if (leadsRes.ok) setLeads(await leadsRes.json());
      if (transRes.ok) setTransactions(await transRes.json());
      if (revRes.ok) setReviews(await revRes.json());
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
        await storage.setItem(USER_KEY, JSON.stringify(userData));
      }

      if (!userRes.ok && userRes.status !== 401) {
        return handleApiError(userRes);
      }
    } catch (e) {
      console.error("Erro ao buscar dados do usuário:", e);
    }
  }

  async function fetchJobById(id: string) {
    try {
      const token = await storage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/api/jobs/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      return res.ok ? await res.json() : null;
    } catch (e) {
      return null;
    }
  }

  async function banUser(userId: string, reason: string) {
    try {
      const token = await storage.getItem(TOKEN_KEY);
      await fetch(`${API_BASE_URL}/api/admin/users/${userId}/ban`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason }),
      });
      fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  }

  async function unbanUser(userId: string) {
    try {
      const token = await storage.getItem(TOKEN_KEY);
      await fetch(`${API_BASE_URL}/api/admin/users/${userId}/unban`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  }

  async function approveVerification(userId: string) {
    try {
      const token = await storage.getItem(TOKEN_KEY);
      await fetch(`${API_BASE_URL}/api/admin/users/${userId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "APPROVED" }),
      });
      fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  }

  async function rejectVerification(userId: string, reason: string) {
    try {
      const token = await storage.getItem(TOKEN_KEY);
      await fetch(`${API_BASE_URL}/api/admin/users/${userId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "REJECTED", reason }),
      });
      fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  }

  async function login(data: LoginBody) {
    const response = await loginMutation.mutateAsync({ data });
    if (response.token && response.user) {
      await storage.setItem(TOKEN_KEY, response.token);
      await storage.setItem(USER_KEY, JSON.stringify(response.user));
      setUser(response.user as User);
      const role = response.user.role?.toLowerCase();
      setActiveMode(role === "admin" ? "ADMIN" : role === "provider" ? "PROVIDER" : "CLIENT");
      fetchMyData();
      if (role === "admin") fetchAdminData();
    }
  }

  async function register(data: UserCreate) {
    await registerMutation.mutateAsync({ data });
  }

  async function logout() {
    await storage.deleteItem(TOKEN_KEY);
    await storage.deleteItem(USER_KEY);
    setUser(null);
    setActiveMode("CLIENT");
  }

  async function unlockService(serviceId: string, type: UnlockType): Promise<any> {
    const result = await unlockMutation.mutateAsync({ id: serviceId, data: { type: type as any } });
    fetchMyData();
    return result;
  }

  async function completeOnboarding(data: any) {
    const updatedUser = await updateMeMutation.mutateAsync({ data });
    if (updatedUser) {
      setUser(updatedUser as User);
      await storage.setItem(USER_KEY, JSON.stringify(updatedUser));
    }
  }

  async function googleLogin() {
    if (!GoogleSignin) return;
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const idToken = userInfo.data?.idToken;
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    const result = await response.json();
    if (result.token && result.user) {
      await storage.setItem(TOKEN_KEY, result.token);
      await storage.setItem(USER_KEY, JSON.stringify(result.user));
      setUser(result.user as User);
      setActiveMode(result.user.role === "provider" ? "PROVIDER" : "CLIENT");
    }
  }

  async function updateJobStatus(jobId: string, status: string) {
    const token = await storage.getItem(TOKEN_KEY);
    const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchMyData();
    return res.ok;
  }

  async function deleteJob(jobId: string) {
    const token = await storage.getItem(TOKEN_KEY);
    const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) fetchMyData();
    return res.ok;
  }

  async function getUserLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return null;
    return await Location.getCurrentPositionAsync({});
  }

  return (
    <AuthContext.Provider
      value={{
        appConfig,
        user,
        isLoading,
        activeMode,
        switchActiveMode: (mode) => setActiveMode(mode),
        services,
        leads,
        transactions,
        reviews,
        allUsers,
        adminStats,
        adminRecentJobs,
        login,
        register,
        logout,
        fetchAdminData,
        fetchMyData,
        fetchJobById,
        banUser,
        unbanUser,
        approveVerification,
        rejectVerification,
        createService: async () => {},
        unlockService,
        googleLogin,
        completeOnboarding,
        buyCredits: async () => {},
        getUserLocation,
        updateJobStatus,
        deleteJob,
        api,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
