import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  CREDIT_PACKAGES,
  SERVICE_EXPIRATION_DAYS,
  UNLOCK_COSTS,
  WELCOME_BONUS_CREDITS,
} from "@/constants/categories";
import type {
  LeadUnlock,
  Service,
  Transaction,
  UnlockType,
  User,
} from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  activeMode: "CLIENT" | "PROVIDER";
  switchActiveMode: (mode: "CLIENT" | "PROVIDER") => void;
  services: Service[];
  leads: LeadUnlock[];
  transactions: Transaction[];
  allUsers: User[];
  login: (userData: Pick<User, "name" | "email">) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: (data: Partial<User>) => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  createService: (
    data: Pick<
      Service,
      "title" | "description" | "category" | "city" | "state" | "neighborhood"
    >
  ) => Promise<void>;
  closeService: (serviceId: string) => Promise<void>;
  unlockService: (
    serviceId: string,
    type: UnlockType
  ) => Promise<{ whatsappLink: string } | { error: string }>;
  buyCredits: (packageId: string, customAmount?: number) => Promise<void>;
  banUser: (userId: string, reason: string) => Promise<void>;
  approveVerification: (userId: string) => Promise<void>;
  rejectVerification: (userId: string, reason: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function genId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function genReferralCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function makeDemoServices(): Service[] {
  const now = new Date();
  const expiry = new Date(
    now.getTime() + SERVICE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000
  );
  const base: Omit<Service, "id" | "createdAt" | "expiresAt"> = {
    clientId: "demo",
    clientName: "Maria Oliveira",
    clientPhone: "6499887766",
    state: "GO",
    status: "OPEN",
    unlockedByProviders: [],
  };
  return [
    {
      ...base,
      id: genId(),
      title: "Preciso de pintor para quarto e sala",
      description:
        "Apartamento com 2 quartos e sala. Paredes já lixadas. Preciso de mão de obra + tinta. Urgente!",
      category: "Pintor",
      city: "Goiânia",
      neighborhood: "Setor Bueno",
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      expiresAt: expiry.toISOString(),
    },
    {
      ...base,
      id: genId(),
      clientName: "João Santos",
      clientPhone: "6491122334",
      title: "Encanamento com vazamento no banheiro",
      description:
        "Torneira pingando e sifão entupido no banheiro social. Precisa resolver hoje.",
      category: "Encanador",
      city: "Aparecida de Goiânia",
      neighborhood: "Jardim Tiradentes",
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      expiresAt: expiry.toISOString(),
    },
    {
      ...base,
      id: genId(),
      clientName: "Ana Lima",
      clientPhone: "6488776655",
      title: "Instalação de ar-condicionado split",
      description:
        "Ar de 12.000 BTUs já comprado. Preciso de instalação com suporte e canaleta.",
      category: "Refrigeração/Ar-condicionado",
      city: "Trindade",
      neighborhood: "Centro",
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      expiresAt: expiry.toISOString(),
    },
    {
      ...base,
      id: genId(),
      clientName: "Carlos Souza",
      clientPhone: "6499001122",
      title: "Diarista para casa de 3 cômodos",
      description:
        "Casa de 3 cômodos + quintal pequeno. Toda semana, preferencialmente às terças.",
      category: "Diarista",
      city: "Goiânia",
      neighborhood: "Setor Oeste",
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      expiresAt: expiry.toISOString(),
    },
  ];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeMode, setActiveMode] = useState<"CLIENT" | "PROVIDER">("CLIENT");
  const [services, setServices] = useState<Service[]>([]);
  const [leads, setLeads] = useState<LeadUnlock[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (user) {
      const primaryMode = user.role === "PROVIDER" ? "PROVIDER" : "CLIENT";
      setActiveMode(primaryMode);
    }
  }, [user?.id]);

  function switchActiveMode(mode: "CLIENT" | "PROVIDER") {
    setActiveMode(mode);
  }

  async function loadAll() {
    try {
      const [uJ, sJ, lJ, tJ, auJ] = await Promise.all([
        AsyncStorage.getItem("@trampai/user"),
        AsyncStorage.getItem("@trampai/services"),
        AsyncStorage.getItem("@trampai/leads"),
        AsyncStorage.getItem("@trampai/transactions"),
        AsyncStorage.getItem("@trampai/allusers"),
      ]);
      if (uJ) setUser(JSON.parse(uJ));

      let loadedServices: Service[] = sJ ? JSON.parse(sJ) : [];
      if (loadedServices.length === 0) {
        loadedServices = makeDemoServices();
        await AsyncStorage.setItem(
          "@trampai/services",
          JSON.stringify(loadedServices)
        );
      }
      setServices(loadedServices);

      if (lJ) setLeads(JSON.parse(lJ));
      if (tJ) setTransactions(JSON.parse(tJ));
      if (auJ) setAllUsers(JSON.parse(auJ));
    } catch (e) {
      console.error("Error loading data:", e);
    } finally {
      setIsLoading(false);
    }
  }

  async function persistUser(u: User) {
    setUser(u);
    await AsyncStorage.setItem("@trampai/user", JSON.stringify(u));
    setAllUsers((prev) => {
      const filtered = prev.filter((x) => x.id !== u.id);
      const updated = [...filtered, u];
      AsyncStorage.setItem("@trampai/allusers", JSON.stringify(updated));
      return updated;
    });
  }

  async function persistServices(s: Service[]) {
    setServices(s);
    await AsyncStorage.setItem("@trampai/services", JSON.stringify(s));
  }

  async function persistLeads(l: LeadUnlock[]) {
    setLeads(l);
    await AsyncStorage.setItem("@trampai/leads", JSON.stringify(l));
  }

  async function persistTransactions(t: Transaction[]) {
    setTransactions(t);
    await AsyncStorage.setItem("@trampai/transactions", JSON.stringify(t));
  }

  async function login(userData: Pick<User, "name" | "email">) {
    const existing = allUsers.find((u) => u.email === userData.email);
    if (existing) {
      await persistUser(existing);
      return;
    }
    const newUser: User = {
      id: genId(),
      name: userData.name,
      email: userData.email,
      phone: "",
      role: "CLIENT",
      roles: ["CLIENT"],
      creditBalance: WELCOME_BONUS_CREDITS,
      city: "",
      state: "GO",
      neighborhood: "",
      cep: "",
      onboardingComplete: false,
      acceptedTerms: false,
      referralCode: genReferralCode(),
      welcomeBonusGrantedAt: new Date().toISOString(),
      isBanned: false,
    };
    const welcomeTx: Transaction = {
      id: genId(),
      userId: newUser.id,
      type: "WELCOME_BONUS",
      credits: WELCOME_BONUS_CREDITS,
      amountCents: 0,
      description: "Bônus de boas-vindas",
      createdAt: new Date().toISOString(),
    };
    await persistTransactions([...transactions, welcomeTx]);
    await persistUser(newUser);
  }

  async function logout() {
    setUser(null);
    setActiveMode("CLIENT");
    await AsyncStorage.removeItem("@trampai/user");
  }

  async function completeOnboarding(data: Partial<User>) {
    if (!user) return;
    const updated: User = { ...user, ...data, onboardingComplete: true };
    await persistUser(updated);
  }

  async function updateUser(data: Partial<User>) {
    if (!user) return;
    await persistUser({ ...user, ...data });
  }

  async function createService(
    data: Pick<
      Service,
      "title" | "description" | "category" | "city" | "state" | "neighborhood"
    >
  ) {
    if (!user) return;
    const now = new Date();
    const newService: Service = {
      id: genId(),
      clientId: user.id,
      clientName: user.name,
      clientPhone: user.phone,
      ...data,
      status: "OPEN",
      createdAt: now.toISOString(),
      expiresAt: new Date(
        now.getTime() + SERVICE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000
      ).toISOString(),
      unlockedByProviders: [],
    };
    await persistServices([...services, newService]);
  }

  async function closeService(serviceId: string) {
    const updated = services.map((s) =>
      s.id === serviceId ? { ...s, status: "CLOSED" as const } : s
    );
    await persistServices(updated);
  }

  async function unlockService(
    serviceId: string,
    type: UnlockType
  ): Promise<{ whatsappLink: string } | { error: string }> {
    if (!user) return { error: "Usuário não autenticado" };

    const service = services.find((s) => s.id === serviceId);
    if (!service) return { error: "Serviço não encontrado" };
    if (service.status !== "OPEN") return { error: "Serviço indisponível" };
    if (service.unlockedByProviders.includes(user.id))
      return { error: "Você já desbloqueou este serviço" };

    const cost = UNLOCK_COSTS[type];
    if (user.creditBalance < cost)
      return { error: `Créditos insuficientes. Necessário: ${cost}` };

    const updatedUser = { ...user, creditBalance: user.creditBalance - cost };
    await persistUser(updatedUser);

    const updatedServices = services.map((s) => {
      if (s.id !== serviceId) return s;
      const up = { ...s, unlockedByProviders: [...s.unlockedByProviders, user.id] };
      if (type === "EXCLUSIVE") {
        return {
          ...up,
          status: "LOCKED" as const,
          lockedUntil: new Date(
            Date.now() + 24 * 60 * 60 * 1000
          ).toISOString(),
        };
      }
      return up;
    });
    await persistServices(updatedServices);

    const newLead: LeadUnlock = {
      id: genId(),
      serviceId,
      serviceTitle: service.title,
      serviceCategory: service.category,
      providerId: user.id,
      clientName: service.clientName,
      clientPhone: service.clientPhone,
      city: service.city,
      neighborhood: service.neighborhood,
      type,
      creditsSpent: cost,
      createdAt: new Date().toISOString(),
    };
    await persistLeads([...leads, newLead]);

    const tx: Transaction = {
      id: genId(),
      userId: user.id,
      type: "UNLOCK_SPEND",
      credits: -cost,
      amountCents: 0,
      description: `Desbloqueio ${type === "EXCLUSIVE" ? "exclusivo" : "normal"}: ${service.title}`,
      createdAt: new Date().toISOString(),
    };
    await persistTransactions([...transactions, tx]);

    const phone = service.clientPhone.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Olá! Vi seu pedido de serviço no Trampaí (${service.category}: "${service.title}") e tenho interesse. Podemos conversar?`
    );
    return { whatsappLink: `https://wa.me/55${phone}?text=${msg}` };
  }

  async function buyCredits(packageId: string, customAmount?: number) {
    if (!user) return;
    let credits = 0;
    let amountCents = 0;

    if (customAmount && customAmount >= 10) {
      credits = customAmount;
      amountCents = customAmount * 100;
    } else {
      const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
      if (!pkg) return;
      credits = pkg.credits;
      amountCents = pkg.priceCents;
    }

    await persistUser({ ...user, creditBalance: user.creditBalance + credits });

    const tx: Transaction = {
      id: genId(),
      userId: user.id,
      type: "PURCHASE",
      credits,
      amountCents,
      description: `Compra de ${credits} créditos via PIX`,
      createdAt: new Date().toISOString(),
    };
    await persistTransactions([...transactions, tx]);
  }

  async function banUser(userId: string, reason: string) {
    const updated = allUsers.map((u) =>
      u.id === userId ? { ...u, isBanned: true, banReason: reason } : u
    );
    setAllUsers(updated);
    await AsyncStorage.setItem("@trampai/allusers", JSON.stringify(updated));
  }

  async function approveVerification(userId: string) {
    const updated = allUsers.map((u) =>
      u.id === userId ? { ...u, verificationStatus: "APPROVED" as const } : u
    );
    setAllUsers(updated);
    await AsyncStorage.setItem("@trampai/allusers", JSON.stringify(updated));
    if (user?.id === userId) {
      await persistUser({ ...user, verificationStatus: "APPROVED" });
    }
  }

  async function rejectVerification(userId: string, _reason: string) {
    const updated = allUsers.map((u) =>
      u.id === userId ? { ...u, verificationStatus: "REJECTED" as const } : u
    );
    setAllUsers(updated);
    await AsyncStorage.setItem("@trampai/allusers", JSON.stringify(updated));
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
        login,
        logout,
        completeOnboarding,
        updateUser,
        createService,
        closeService,
        unlockService,
        buyCredits,
        banUser,
        approveVerification,
        rejectVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
