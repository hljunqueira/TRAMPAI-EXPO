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
