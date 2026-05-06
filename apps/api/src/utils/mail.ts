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
export async function sendPasswordResetEmail(email: string, newPassword: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: "Trampaí <suporte@resend.dev>",
      to: [email],
      subject: "Sua nova senha do Trampaí",
      html: `
        <h1>Sua senha foi resetada</h1>
        <p>Um administrador resetou sua senha. Use a senha temporária abaixo para acessar sua conta:</p>
        <div style="background: #f4f4f4; padding: 16px; font-size: 24px; font-family: monospace; text-align: center; border-radius: 8px;">
          ${newPassword}
        </div>
        <p>Recomendamos que você altere sua senha assim que fizer o login.</p>
      `,
    });

    if (error) {
      console.error("Erro ao enviar e-mail de reset:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Erro inesperado no envio de e-mail de reset:", err);
    return { success: false, error: err };
  }
}
