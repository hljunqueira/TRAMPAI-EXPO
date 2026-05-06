/**
 * Limpa descrições de serviços removendo padrões de telefone e e-mail
 * para evitar que usuários burlem o sistema de créditos.
 */
export function sanitizeDescription(text: string): string {
  if (!text) return "";

  // Regex para telefones brasileiros (variados formatos)
  // Ex: (11) 99999-9999, 11999999999, 99999-9999, etc.
  const phoneRegex = /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[-\s]?\d{4}/g;

  // Regex para e-mails
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  // Regex para palavras suspeitas de "driblar" o sistema
  const keywordsRegex = /\b(whatsapp|whats|zap|contato|me chama|celular|telefone|fone)\b/gi;

  let sanitized = text;

  // Substituímos por [CONTATO REMOVIDO] para educar o usuário
  sanitized = sanitized.replace(phoneRegex, "[TELEFONE REMOVIDO]");
  sanitized = sanitized.replace(emailRegex, "[E-MAIL REMOVIDO]");

  return sanitized;
}
