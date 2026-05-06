import { db, notifications, users } from "@workspace/db";
import { eq } from "drizzle-orm";

/**
 * Envia notificações push via Expo API
 */

export async function sendPushNotifications(tokens: string[], title: string, body: string, data?: any) {
  if (tokens.length === 0) return { success: true, sent: 0 };

  const messages = tokens.map(token => ({
    to: token,
    sound: "default",
    title,
    body,
    data,
  }));

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    return { success: true, sent: tokens.length, result };
  } catch (error) {
    console.error("Erro ao enviar notificações push:", error);
    return { success: false, error };
  }
}

/**
 * Cria uma notificação no banco e tenta enviar push se o usuário tiver tokens
 */
export async function createNotification(userId: string, title: string, body: string, type: string, data?: any) {
  try {
    // 1. Salvar no banco
    const [notif] = await db.insert(notifications).values({
      userId,
      title,
      body,
      type,
    }).returning();

    // 2. Buscar tokens do usuário
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (user?.pushToken) {
      // Se tiver múltiplos tokens (ex: array), ou apenas um
      const tokens = Array.isArray(user.pushToken) ? user.pushToken : [user.pushToken];
      await sendPushNotifications(tokens, title, body, { ...data, notificationId: notif.id });
    }

    return notif;
  } catch (error) {
    console.error("Erro ao criar notificação:", error);
    return null;
  }
}
