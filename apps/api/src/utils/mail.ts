import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, token: string) {
  try {
    const verifyUrl = `${process.env.APP_URL}/api/auth/verify?token=${token}`;
    const { data, error } = await resend.emails.send({
      from: "Trampaí <onboarding@resend.dev>",
      to: [email],
      subject: "Ative sua conta no Trampaí",
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #333; background-color: #f9f9f9;">
          <div style="background-color: #fff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;">
            <h1 style="color: #21284E; margin-bottom: 24px; font-size: 28px;">Bem-vindo ao Trampaí!</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 32px;">
              Estamos muito felizes em ter você conosco! Para começar a usar a plataforma e encontrar as melhores oportunidades, confirme seu e-mail clicando no botão abaixo:
            </p>
            <a href="${verifyUrl}" style="background-color: #F69926; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 14px rgba(246, 153, 38, 0.4);">
              Ativar Minha Conta
            </a>
            <p style="font-size: 14px; color: #999; margin-top: 40px;">
              Se o botão não funcionar, copie e cole este link no seu navegador:<br>
              <span style="color: #5EB4B8;">${verifyUrl}</span>
            </p>
          </div>
          <p style="text-align: center; font-size: 12px; color: #aaa; margin-top: 24px;">
            © ${new Date().getFullYear()} Trampaí. Todos os direitos reservados.
          </p>
        </div>
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
      from: "Trampaí <onboarding@resend.dev>",
      to: [email],
      subject: "Recuperação de Senha - Trampaí",
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #333; background-color: #f9f9f9;">
          <div style="background-color: #fff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;">
            <h2 style="color: #21284E; margin-bottom: 24px; font-size: 24px;">Recuperação de Senha</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 32px;">
              Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Trampaí</strong>. Se foi você, clique no botão abaixo:
            </p>
            <a href="${resetUrl}" style="background-color: #F69926; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 14px rgba(246, 153, 38, 0.4);">
              Redefinir Senha
            </a>
            <p style="font-size: 14px; color: #999; margin-top: 40px;">
              Se você não solicitou isso, pode ignorar este e-mail com segurança. Sua senha não será alterada até que você clique no botão acima.
            </p>
          </div>
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
