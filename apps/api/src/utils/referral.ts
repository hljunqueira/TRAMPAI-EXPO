import crypto from "crypto";

/**
 * Gera um código de indicação único
 * Formato: TRAMPAI26-XXXX (4 caracteres alfanuméricos aleatórios)
 */
export function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Sem O, 0, I, 1 para evitar confusão
  let code = "TP";
  
  // Usamos TP + 4 chars aleatórios para ser curto e mobile-friendly
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(crypto.randomInt(0, chars.length));
  }
  
  // Adicionamos o ano para marcar a safra
  return `${code}26`;
}
