import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, token: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: "Trampaí <onboarding@resend.dev>", // Usar o domínio padrão do Resend para testes
      to: [email],
      subject: "Verifique sua conta no Trampaí",
      html: `
        <h1>Bem-vindo ao Trampaí!</h1>
        <p>Clique no link abaixo para verificar sua conta:</p>
        <a href="${process.env.APP_URL}/verify?token=${token}">Verificar Conta</a>
        <p>Se você não solicitou este e-mail, pode ignorá-lo.</p>
      `,
    });

    if (error) {
      console.error("Erro ao enviar e-mail:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Erro inesperado no envio de e-mail:", err);
    return { success: false, error: err };
  }
}
