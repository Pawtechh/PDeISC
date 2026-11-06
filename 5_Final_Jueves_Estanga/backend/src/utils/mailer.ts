import nodemailer from 'nodemailer';
import { logger } from './logger';

export interface SendPasswordResetOptions {
  to: string;
  nombre: string;
  resetToken: string;
  recoveryCode: string;
}

/**
 * Servicio de envío de correos transaccionales para Surf Rental MDP.
 * Compatible con Gmail (App Password), SMTP personalizado o Sendgrid.
 */
export async function sendPasswordResetEmail(options: SendPasswordResetOptions): Promise<boolean> {
  const { to, nombre, resetToken, recoveryCode } = options;

  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.EMAIL_PASSWORD;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT) || 465;

  if (!smtpUser || !smtpPass) {
    logger.info(`[Mailer] No se configuraron credenciales SMTP/Gmail en .env (SMTP_USER / SMTP_PASS).`);
    logger.info(`[Mailer] Código de recuperación generado para ${to}: [${recoveryCode}] (Token: ${resetToken.slice(0, 15)}...)`);
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const info = await transporter.sendMail({
      from: `"Surf Rental MDP" <${smtpUser}>`,
      to,
      subject: `Código de recuperación: ${recoveryCode} — Surf Rental Mar del Plata`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #0B0F17; color: #F1F5F9; padding: 32px; border-radius: 12px; max-width: 520px; margin: 0 auto; border: 1px solid rgba(56, 189, 248, 0.25);">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #38BDF8; margin: 0; font-size: 24px;">Surf Rental MDP 🏄‍♂️</h1>
            <p style="color: #94A3B8; font-size: 13px; margin-top: 4px;">Sede Central Playa Grande, Mar del Plata</p>
          </div>
          
          <p style="font-size: 15px;">Hola <strong>${nombre}</strong>,</p>
          <p style="font-size: 14px; color: #CBD5E1; line-height: 20px;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta. Ingresá este código de 6 dígitos en la aplicación para crear tu nueva clave:
          </p>

          <div style="background-color: #131C2E; border: 1.5px dashed #F59E0B; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #94A3B8; letter-spacing: 1px; text-transform: uppercase;">Código de Verificación</p>
            <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #F59E0B;">${recoveryCode}</span>
          </div>

          <p style="font-size: 13px; color: #94A3B8; line-height: 18px;">
            Este código tiene una vigencia de 1 hora. Si vos no solicitaste este cambio, podés desestimar este mensaje de forma segura.
          </p>
          
          <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 24px 0;" />
          <p style="font-size: 11px; color: #64748B; text-align: center; margin: 0;">
            Surf Rental MDP • Sistema Homologado bajo Normativas Náuticas y Ley 25.506
          </p>
        </div>
      `,
    });

    logger.info(`[Mailer] Correo de recuperación enviado con éxito a ${to} (ID: ${info.messageId})`);
    return true;
  } catch (error) {
    logger.error(`[Mailer] Error al enviar email de recuperación a ${to}:`, error);
    return false;
  }
}
