export type UserRole = "CLIENT" | "PROVIDER" | "ADMIN";
export type ServiceStatus = "OPEN" | "LOCKED" | "CLOSED" | "EXPIRED";
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
  phone: string;
  role: UserRole;
  roles?: ("CLIENT" | "PROVIDER")[];
  creditBalance: number;
  city: string;
  state: string;
  neighborhood: string;
  cep: string;
  onboardingComplete: boolean;
  acceptedTerms: boolean;
  referralCode: string;
  welcomeBonusGrantedAt: string;
  isBanned: boolean;
  verificationStatus?: VerificationStatus;
  referredById?: string;
  bio?: string;
  categories?: string[];
}

export interface Service {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  title: string;
  description: string;
  category: string;
  city: string;
  state: string;
  neighborhood: string;
  status: ServiceStatus;
  createdAt: string;
  expiresAt: string;
  lockedUntil?: string;
  unlockedByProviders: string[];
}

export interface LeadUnlock {
  id: string;
  serviceId: string;
  serviceTitle: string;
  serviceCategory: string;
  providerId: string;
  clientName: string;
  clientPhone: string;
  city: string;
  neighborhood: string;
  type: UnlockType;
  creditsSpent: number;
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
  highlight?: boolean;
}
