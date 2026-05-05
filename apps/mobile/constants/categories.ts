import type { CreditPackage } from "@/types";

export const SUGGESTED_CATEGORIES = [
  "Pedreiro",
  "Eletricista",
  "Encanador",
  "Diarista",
  "Pintor",
  "Jardineiro",
  "Marceneiro",
  "Chaveiro",
  "Mecânico",
  "Mudanças/Frete",
  "Refrigeração/Ar-condicionado",
  "Técnico de Informática",
  "Costureira",
  "Cuidador",
  "Outros",
] as const;

export const CATEGORIES = SUGGESTED_CATEGORIES.map((name) => ({
  id: name,
  name: name,
}));

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: "basico", label: "Básico", credits: 30, priceCents: 2999 },
  {
    id: "profissional",
    label: "Profissional",
    credits: 50,
    priceCents: 4999,
    highlight: true,
  },
  { id: "prime", label: "Prime", credits: 100, priceCents: 9999 },
];

export const UNLOCK_COSTS = {
  NORMAL: 1,
  EXCLUSIVE: 3,
} as const;

export const WELCOME_BONUS_CREDITS = 5;
export const SERVICE_EXPIRATION_DAYS = 7;
export const MIN_CUSTOM_CREDITS = 10;
export const PRICE_PER_CREDIT_CENTS = 100;
