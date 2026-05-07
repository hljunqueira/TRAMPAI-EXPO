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
        <a href="${process.env.APP_URL}/api/auth/verify?token=${token}">Verificar Conta</a>
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

export async function sendForgotPasswordEmail(email: string, token: string) {
  try {
    const resetUrl = `${process.env.APP_URL}/api/auth/reset-password?token=${token}`;

    const { data, error } = await resend.emails.send({
      from: "Trampaí <seguranca@resend.dev>",
      to: [email],
      subject: "Recuperação de Senha - Trampaí",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #0b1339; text-align: center;">Recuperação de Senha</h2>
          <p>Olá,</p>
          <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Trampaí</strong>.</p>
          <p>Clique no botão abaixo para escolher uma nova senha:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #e8c08a; color: #0b1339; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Redefinir Minha Senha</a>
          </div>
          <p style="font-size: 12px; color: #666;">Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
          <p style="font-size: 12px; color: #666;">${resetUrl}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999;">Se você não solicitou a alteração de senha, pode ignorar este e-mail com segurança. Sua senha atual permanecerá a mesma.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Erro ao enviar e-mail de esqueci senha:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Erro inesperado no envio de e-mail de esqueci senha:", err);
    return { success: false, error: err };
  }
}
