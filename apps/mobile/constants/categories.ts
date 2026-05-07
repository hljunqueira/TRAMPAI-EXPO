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
  { id: "basico", name: "Básico", credits: 30, priceCents: 2999 },
  {
    id: "profissional",
    name: "Profissional",
    credits: 50,
    priceCents: 4999,
    isHighlighted: true,
  },
  { id: "prime", name: "Prime", credits: 100, priceCents: 9999 },
];

export const MIN_CUSTOM_CREDITS = 10;
