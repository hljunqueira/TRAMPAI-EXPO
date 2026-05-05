export type UserRole = "client" | "provider" | "admin";
export type ServiceStatus = "open" | "in_progress" | "completed" | "cancelled";
export type UnlockType = "NORMAL" | "EXCLUSIVE";
export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type TransactionType =
  | "PURCHASE"
  | "UNLOCK_SPEND"
  | "WELCOME_BONUS"
  | "REFUND_ANTIVACUO"
  | "ADMIN_GRANT"
  | "REFERRAL_BONUS";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  roles?: UserRole[];
  isProvider?: boolean;
  isVerifiedProvider?: boolean;
  creditBalance: number;
  city?: string;
  state?: string;
  neighborhood?: string;
  cep?: string;
  address?: string;
  number?: string;
  complement?: string;
  onboardingComplete?: boolean;
  onboardingCompletedAt?: string;
  acceptedTerms?: boolean;
  referralCode?: string;
  welcomeBonusGrantedAt?: string;
  isBanned?: boolean;
  verificationStatus?: VerificationStatus;
  referredById?: string;
  avatarUrl?: string;
  bio?: string;
  categories?: string[];
  providerBio?: string;
  providerCategories?: string[];
  rating?: string;
  reviewCount?: number;
}

export interface Service {
  id: string;
  clientId: string;
  title: string;
  description: string;
  budget: string;
  status: ServiceStatus;
  location: string;
  createdAt: string;
  category: {
    id: string;
    name: string;
    icon?: string;
  };
  unlockedByProviders: {
    id: string;
    providerId: string;
    type: UnlockType;
    createdAt: string;
  }[];
}

export interface LeadUnlock {
  id: string;
  jobId: string;
  serviceId: string; // Alias para compatibilidade
  jobTitle: string;
  jobCategory: string;
  providerId: string;
  clientName: string;
  clientPhone: string;
  city: string;
  neighborhood: string;
  type: UnlockType;
  cost: number;
  creditsSpent: number; // Alias para compatibilidade
  whatsappLink: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  credits: number;
  amountCents: number;
  description: string;
  createdAt: string;
}

export interface CreditPackage {
  id: string;
  label: string;
  credits: number;
  priceCents: number;
  bonusCredits?: number;
  highlight?: boolean;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface UserCreate {
  email: string;
  name: string;
  password: string;
  role: "client" | "provider";
}
