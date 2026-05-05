import * as SecureStore from "expo-secure-store";
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
  CREDIT_PACKAGES,
  SERVICE_EXPIRATION_DAYS,
  UNLOCK_COSTS,
  WELCOME_BONUS_CREDITS,
} from "@/constants/categories";
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
  user: User | null;
  isLoading: boolean;
  activeMode: "CLIENT" | "PROVIDER" | "ADMIN";
  switchActiveMode: (mode: "CLIENT" | "PROVIDER" | "ADMIN") => void;
  services: Service[];
  leads: LeadUnlock[];
  transactions: Transaction[];
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
  createService: (
    data: any
  ) => Promise<void>;
  unlockService: (
    serviceId: string,
    type: UnlockType
  ) => Promise<{ whatsappLink: string } | { error: string }>;
  googleLogin: () => Promise<void>;
  completeOnboarding: (data: Partial<User> & { 
    referredById?: string;
    isProvider?: boolean;
    providerBio?: string;
    providerCategories?: string[];
    city?: string;
    neighborhood?: string;
    phone?: string;
  }) => Promise<void>;
  buyCredits: (packageId?: string, customCredits?: number) => Promise<void>;
  unbanUser: (userId: string) => Promise<void>;
  getUserLocation: () => Promise<Location.LocationObject | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// const API_BASE_URL = "https://ready-boxes-march.loca.lt/api";
export const API_BASE_URL = "https://api.trampai.com.br";
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
  const [leads, setLeads] = useState<LeadUnlock[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [adminStats, setAdminStats] = useState<any | null>(null);
  const [adminRecentJobs, setAdminRecentJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const DUMMY_USERS: User[] = [
    { id: "1", name: "Henrique Admin", email: "henrique@trampai.com.br", role: "admin", creditBalance: 999, verificationStatus: "APPROVED", city: "São Paulo", neighborhood: "Centro" },
    { id: "2", name: "João Silva (Teste)", email: "joao@teste.com", role: "provider", creditBalance: 85, city: "São Paulo", neighborhood: "Pinheiros", verificationStatus: "APPROVED", providerBio: "Eletricista residencial com 10 anos de experiência.", rating: "4.8", reviewCount: 24, phone: "(11) 98888-7777" },
    { id: "3", name: "Maria Oliveira (Teste)", email: "maria@teste.com", role: "client", creditBalance: 150, city: "Curitiba", neighborhood: "Batel", verificationStatus: "APPROVED", phone: "(41) 97777-6666" },
    { id: "4", name: "Carlos Souza (Teste)", email: "carlos@trampo.com", role: "provider", creditBalance: 42, city: "Belo Horizonte", neighborhood: "Savassi", verificationStatus: "APPROVED", providerBio: "Pintor e pedreiro especializado em acabamentos.", rating: "4.5", reviewCount: 12, phone: "(31) 96666-5555" },
    { id: "5", name: "Ana Santos (Teste)", email: "ana@exemplo.com", role: "client", creditBalance: 300, city: "Rio de Janeiro", neighborhood: "Copacabana", verificationStatus: "APPROVED", phone: "(21) 95555-4444" },
    { id: "6", name: "Marcos Lima (Teste)", email: "marcos@teste.com", role: "provider", creditBalance: 120, city: "Porto Alegre", neighborhood: "Moinhos", verificationStatus: "APPROVED", providerBio: "Encanador certificado e experiente.", phone: "(51) 94444-3333" },
  ];

  const DUMMY_STATS = {
    users: { total: 1250, providers: 450, clients: 800, pending: 12 },
    jobs: { total: 3420, open: 45, completed: 3375 },
    revenue: { totalCents: 1542000 },
    leads: { total: 8900 }
  };

  const DUMMY_JOBS = [
    { id: "j1", title: "Instalação Elétrica Residencial", location: "São Paulo, SP", status: "open", category: { name: "Eletricista" }, createdAt: new Date().toISOString() },
    { id: "j2", title: "Pintura de Apartamento 2 qtos", location: "Rio de Janeiro, RJ", status: "open", category: { name: "Pintor" }, createdAt: new Date().toISOString() },
    { id: "j3", title: "Troca de Torneiras e Sifão", location: "Curitiba, PR", status: "open", category: { name: "Encanador" }, createdAt: new Date().toISOString() },
  ];

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  useEffect(() => {
    // Inicializar API Client
    setBaseUrl(API_BASE_URL);
    setAuthTokenGetter(async () => {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    });

    loadSession();

    // Configurar Google Sign-in (com proteção para Expo Go)
    try {
      if (GoogleSignin) {
        GoogleSignin.configure({
          webClientId: "753521058893-1ph7c8notd0gcal67a68giurq4l34lvn.apps.googleusercontent.com",
          offlineAccess: true,
        });
      }
    } catch (e) {
      console.warn("Google Sign-in não disponível neste ambiente (provavelmente Expo Go)");
    }
  }, []);

  async function loadSession() {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userData = await SecureStore.getItemAsync(USER_KEY);
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        const role = parsedUser.role?.toLowerCase();
        if (role === "admin") {
          setActiveMode("ADMIN");
        } else {
          setActiveMode(role === "provider" ? "PROVIDER" : "CLIENT");
        }
        fetchMyData(); // Buscar dados do usuário logado
      }
    } catch (e) {
      console.error("Erro ao carregar sessão:", e);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchAdminData() {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) return;

      // Buscar Stats
      const statsRes = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setAdminStats(stats);
      }

      // Buscar Usuários
      const usersRes = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const users = await usersRes.json();
        setAllUsers(users);
      }

      // Buscar Jobs Recentes
      const jobsRes = await fetch(`${API_BASE_URL}/api/admin/jobs/recent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (jobsRes.ok) {
        const jobs = await jobsRes.json();
        setAdminRecentJobs(jobs);
      }
    } catch (e) {
      console.error("Erro ao buscar dados de admin:", e);
      // Usar dados fictícios se a API falhar (ambiente de teste/dev)
      if (allUsers.length === 0) setAllUsers(DUMMY_USERS);
      if (!adminStats) setAdminStats(DUMMY_STATS);
      if (adminRecentJobs.length === 0) setAdminRecentJobs(DUMMY_JOBS);
    }
  }

  async function fetchMyData() {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) return;

      // Buscar Meus Serviços (Cliente)
      const jobsRes = await fetch(`${API_BASE_URL}/api/jobs/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (jobsRes.ok) {
        const data = await jobsRes.json();
        setServices(data);
      }

      // Buscar Meus Leads (Prestador)
      const leadsRes = await fetch(`${API_BASE_URL}/api/leads/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (leadsRes.ok) {
        const data = await leadsRes.json();
        setLeads(data);
      }

      // Buscar Minhas Transações
      const transRes = await fetch(`${API_BASE_URL}/api/transactions/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (transRes.ok) {
        const data = await transRes.json();
        setTransactions(data);
      }
    } catch (e) {
      console.error("Erro ao buscar dados do usuário:", e);
    }
  }

  async function fetchJobById(id: string) {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/api/jobs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) return await res.json();
      return null;
    } catch (e) {
      console.error("Erro ao buscar job:", e);
      return null;
    }
  }

  async function banUser(userId: string, reason: string) {
    try {
      // Atualização local imediata para feedback visual
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, isBanned: true } : u));
      
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/ban`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ reason })
      });
      if (res.ok) fetchAdminData();
    } catch (e) {
      console.error("Erro ao banir usuário:", e);
    }
  }

  async function unbanUser(userId: string) {
    try {
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, isBanned: false } : u));
      
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/unban`, {
        method: "PATCH",
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      });
      if (res.ok) fetchAdminData();
    } catch (e) {
      console.error("Erro ao desbanir usuário:", e);
    }
  }

  async function approveVerification(userId: string) {
    try {
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, verificationStatus: "APPROVED" } : u));
      
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/verify`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status: "APPROVED" })
      });
      if (res.ok) fetchAdminData();
    } catch (e) {
      console.error("Erro ao aprovar usuário:", e);
    }
  }

  async function rejectVerification(userId: string, reason: string) {
    try {
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, verificationStatus: "REJECTED" } : u));
      
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/verify`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status: "REJECTED", reason })
      });
      if (res.ok) fetchAdminData();
    } catch (e) {
      console.error("Erro ao rejeitar usuário:", e);
    }
  }

  async function getUserLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão negada", "Precisamos de acesso à localização para esta funcionalidade.");
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return location;
    } catch (e) {
      console.error("Erro ao obter localização:", e);
      return null;
    }
  }

  useEffect(() => {
    if (user?.role === "admin") {
      fetchAdminData();
    }
  }, [user]);

  function switchActiveMode(mode: "CLIENT" | "PROVIDER" | "ADMIN") {
    setActiveMode(mode);
  }

  async function login(data: LoginBody) {
    try {
      const response = await loginMutation.mutateAsync({ data });
      if (response.token && response.user) {
        await SecureStore.setItemAsync(TOKEN_KEY, response.token);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.user));
        setUser(response.user as User);
        const role = response.user.role?.toLowerCase();
        if (role === "admin") {
          setActiveMode("ADMIN");
        } else {
          setActiveMode(role === "provider" ? "PROVIDER" : "CLIENT");
        }
        fetchMyData();
      }
    } catch (error: any) {
      if (error.status === 403) {
        throw new Error("E-mail não verificado. Verifique sua caixa de entrada ou entre em contato com o suporte.");
      }
      throw new Error(error.data?.error || error.message || "Erro ao realizar login");
    }
  }

  async function register(data: UserCreate) {
    try {
      await registerMutation.mutateAsync({ data });
      // Após registrar, o usuário precisa verificar o e-mail (dependendo da lógica da API)
      // Mas para facilitar, vamos pedir para ele logar após o registro ou logar automaticamente se a API retornar token
    } catch (error: any) {
      throw new Error(error.data?.error || "Erro ao realizar cadastro");
    }
  }

  async function logout() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setUser(null);
    setActiveMode("CLIENT");
  }

  // TODO: Integrar estas funções com a API real nas próximas fases
  async function createService(data: any) {
    console.log("Criação de serviço ainda não integrada com API");
  }

  const unlockMutation = useUnlockJob();

  async function unlockService(
    serviceId: string,
    type: "NORMAL" | "PLUS" | "EXCLUSIVE"
  ): Promise<any> {
    try {
      const result = await unlockMutation.mutateAsync({
        id: serviceId,
        data: { type: type as any }
      });
      
      // Atualiza os dados do usuário para refletir o novo saldo
      fetchMyData();
      
      return result;
    } catch (error: any) {
      console.error(error);
      return { error: error.data?.error || "Erro ao desbloquear lead" };
    }
  }

  const updateMeMutation = useUpdateMe();

  async function completeOnboarding(data: any) {
    try {
      const updatedUser = await updateMeMutation.mutateAsync({ data });
      if (updatedUser) {
        setUser(updatedUser as User);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
        
        // Define o modo ativo imediatamente após onboarding
        const role = updatedUser.role?.toLowerCase();
        if (role !== "admin") {
          setActiveMode(role === "provider" ? "PROVIDER" : "CLIENT");
        }
      }
    } catch (error: any) {
      console.error("Erro ao completar onboarding:", error);
      throw new Error(error.data?.error || "Erro ao salvar perfil");
    }
  }

  async function googleLogin() {
    try {
      // Verifica se o módulo está disponível (Proteção para Expo Go)
      if (!GoogleSignin || !GoogleSignin.hasPlayServices) {
        throw new Error("Login com Google requer um Development Build (APK) e não funciona no Expo Go.");
      }
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (!idToken) throw new Error("Erro ao obter token do Google");

      // Enviar para nossa API
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro na autenticação com Google");
      }

      if (result.token && result.user) {
        await SecureStore.setItemAsync(TOKEN_KEY, result.token);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(result.user));
        setUser(result.user as User);
        setActiveMode(result.user.role === "provider" ? "PROVIDER" : "CLIENT");
      }
    } catch (error: any) {
      console.error("Google Login Error:", error);
      throw error;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        activeMode,
        switchActiveMode,
        services,
        leads,
        transactions,
        allUsers,
        adminStats,
        login,
        register,
        logout,
        googleLogin,
        createService,
        unlockService,
        completeOnboarding,
        buyCredits: async (packageId?: string, customCredits?: number) => {
          // Mock para o fluxo sem Stripe por enquanto
          // Em produção, isso iniciaria o fluxo de pagamento
          try {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            const res = await fetch(`${API_BASE_URL}/api/packages/buy`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({ packageId, customCredits })
            });
            
            if (!res.ok) throw new Error("Erro ao processar compra");
            
            // Recarregar dados do usuário para ver o novo saldo
            const userDataRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
              headers: { "Authorization": `Bearer ${token}` }
            });
            if (userDataRes.ok) {
              const updatedUser = await userDataRes.json();
              setUser(updatedUser);
              await SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
            }
          } catch (e) {
            console.error(e);
            throw e;
          }
        },
        fetchAdminData,
        fetchMyData,
        fetchJobById,
        banUser,
        approveVerification,
        rejectVerification,
        unbanUser,
        adminRecentJobs,
        getUserLocation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
