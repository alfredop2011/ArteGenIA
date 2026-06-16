/**
 * Email transactional con Resend (Fase Z.23).
 *
 * 4 emails implementados:
 *   1. Welcome    — tras signup confirmado
 *   2. LowCredits — cron diario detecta balance < 20% del grant
 *   3. UpgradePro — tras checkout.session.completed de Stripe
 *   4. Cancel     — tras customer.subscription.deleted
 *
 * Templates HTML inline (no React Email) — son simples y compatibles con
 * todos los clientes (Gmail, Outlook, Apple Mail). Para emails complejos
 * en el futuro, considerar @react-email/components.
 *
 * Env vars requeridas:
 *   RESEND_API_KEY     - API key de Resend
 *   RESEND_FROM_EMAIL  - "ArteGenIA <hola@artegenia.com>" (dominio verificado)
 *
 * Si las env vars no están configuradas, las funciones son NO-OP con warning
 * en logs (no rompen producción). Útil para dev local.
 */

import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL ?? "ArteGenIA <hola@artegenia.com>";

const resend = apiKey ? new Resend(apiKey) : null;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://artegenia.com";

/** Wrapper safe: si Resend no configurado, log y continúa sin fallar */
async function send(opts: { to: string; subject: string; html: string }): Promise<void> {
  if (!resend) {
    console.info(`[email] sin RESEND_API_KEY — skip "${opts.subject}" para ${opts.to}`);
    return;
  }
  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    if (error) {
      console.error("[email] Resend error:", error);
    }
  } catch (e) {
    console.error("[email] fallo enviar:", e);
  }
}

// ─── PLANTILLA BASE ────────────────────────────────────────────────────
function template(opts: {
  heading: string;
  body: string;
  ctaText?: string;
  ctaHref?: string;
  preheader?: string;
}): string {
  const cta = opts.ctaText && opts.ctaHref ? `
    <table border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
      <tr>
        <td style="border-radius: 14px; background: linear-gradient(135deg, #a855f7, #c026d3); padding: 0;">
          <a href="${opts.ctaHref}" style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 14px;">
            ${opts.ctaText}
          </a>
        </td>
      </tr>
    </table>` : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>${opts.heading}</title>
</head>
<body style="margin: 0; padding: 0; background: #0a0a14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e5e5e8;">
  ${opts.preheader ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${opts.preheader}</div>` : ""}
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #0a0a14;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background: #14121f; border-radius: 20px; border: 1px solid rgba(255,255,255,0.06);">
          <tr>
            <td style="padding: 32px 32px 8px 32px;">
              <a href="${APP_URL}" style="text-decoration: none; color: inherit;">
                <table border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background: linear-gradient(135deg, #facc15, #f59e0b); border-radius: 8px; padding: 6px 10px; color: #000; font-weight: 900; font-size: 12px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                      AG
                    </td>
                    <td style="padding-left: 8px; font-weight: 700; font-size: 15px; color: #ffffff;">
                      Arte<span style="color: #facc15;">Gen</span>IA
                    </td>
                  </tr>
                </table>
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px 0 32px;">
              <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 900; color: #ffffff; line-height: 1.3;">
                ${opts.heading}
              </h1>
              <div style="font-size: 14px; line-height: 1.7; color: #d4d4d8;">
                ${opts.body}
              </div>
              ${cta}
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px 32px 32px; border-top: 1px solid rgba(255,255,255,0.06); margin-top: 24px;">
              <p style="margin: 0; font-size: 11px; color: #6b6b75; line-height: 1.6;">
                Has recibido este email porque tienes cuenta en ArteGenIA.<br>
                <a href="${APP_URL}" style="color: #a855f7; text-decoration: none;">Visitar la app</a> ·
                <a href="${APP_URL}/privacidad" style="color: #a855f7; text-decoration: none;">Política de privacidad</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── 1. WELCOME ────────────────────────────────────────────────────────
export async function sendWelcomeEmail(to: string, name?: string | null): Promise<void> {
  const displayName = name?.split(" ")[0] || "creador";
  await send({
    to,
    subject: "¡Bienvenido a ArteGenIA! 🎨",
    html: template({
      heading: `Bienvenido, ${displayName}`,
      preheader: "Tienes 10 créditos gratis cada mes — empieza creando tu primer flyer.",
      body: `
        <p>Acabas de unirte a la app más rápida para crear flyers de eventos. Aquí tienes <b>10 créditos gratis al mes</b> para empezar.</p>
        <p style="margin-top: 16px;"><b>Tus primeras opciones:</b></p>
        <ul style="padding-left: 20px; margin: 8px 0;">
          <li style="margin-bottom: 6px;">✂️ <b>Quitar fondo</b> a una foto (1 crédito · 5 fotos gratis al mes)</li>
          <li style="margin-bottom: 6px;">📐 <b>Crear un flyer</b> desde plantilla en 2 minutos</li>
          <li style="margin-bottom: 6px;">🖼 <b>Generar un fondo con IA</b> describiendo lo que necesitas</li>
        </ul>
        <p style="margin-top: 16px;">Si tienes dudas, contesta a este email y respondemos en menos de 24h.</p>
      `,
      ctaText: "Crear mi primer flyer →",
      ctaHref: `${APP_URL}/templates`,
    }),
  });
}

// ─── 2. LOW CREDITS ────────────────────────────────────────────────────
export async function sendLowCreditsEmail(to: string, balance: number, monthlyGrant: number, daysUntilReset: number): Promise<void> {
  const pct = Math.round((balance / monthlyGrant) * 100);
  await send({
    to,
    subject: `Te quedan ${balance} créditos`,
    html: template({
      heading: `Te quedan ${balance} créditos`,
      preheader: `${pct}% de tu mensualidad. Reset en ${daysUntilReset} días.`,
      body: `
        <p>Estás usando ArteGenIA — qué bien. Has consumido <b>${pct === 100 ? "todos" : `el ${100 - pct}%`}</b> de tus créditos del mes.</p>
        <p style="margin-top: 16px;"><b>2 opciones:</b></p>
        <ul style="padding-left: 20px; margin: 8px 0;">
          <li style="margin-bottom: 8px;"><b>Esperar al día 1</b> del próximo mes (${daysUntilReset} días) — recibirás 10 créditos nuevos automáticamente.</li>
          <li style="margin-bottom: 8px;"><b>Subir a Pro</b> — 100 créditos/mes, 9,99€. Cancela cuando quieras.</li>
        </ul>
      `,
      ctaText: "Ver planes →",
      ctaHref: `${APP_URL}/pricing`,
    }),
  });
}

// ─── 3. UPGRADE PRO ────────────────────────────────────────────────────
export async function sendUpgradeProEmail(to: string, plan: "pro" | "enterprise", interval: "monthly" | "yearly"): Promise<void> {
  const planLabel = plan === "enterprise" ? "Enterprise" : "Pro";
  const credits = plan === "enterprise" ? 350 : 100;
  const billing = interval === "yearly" ? "anual" : "mensual";
  await send({
    to,
    subject: `Pago confirmado — Plan ${planLabel} activo`,
    html: template({
      heading: `¡Pago confirmado!`,
      preheader: `Plan ${planLabel} ${billing} activo. Tienes ${credits} créditos cada mes.`,
      body: `
        <p>Tu suscripción <b>${planLabel} ${billing}</b> está activa. A partir de ahora:</p>
        <ul style="padding-left: 20px; margin: 8px 0;">
          <li style="margin-bottom: 6px;"><b>${credits} créditos</b> cada mes (reset día 1)</li>
          <li style="margin-bottom: 6px;">Sin marca de agua en descargas</li>
          <li style="margin-bottom: 6px;">Capas Mágicas IA${plan === "enterprise" ? " (ilimitado)" : " (incluido)"}</li>
          <li style="margin-bottom: 6px;">Soporte prioritario</li>
        </ul>
        <p style="margin-top: 16px;">Puedes gestionar tu suscripción (cambiar plan, cancelar, descargar facturas) desde <b>Configuración → Suscripción</b>.</p>
      `,
      ctaText: "Empezar a crear →",
      ctaHref: `${APP_URL}/templates`,
    }),
  });
}

// ─── 4. CANCEL SURVEY ──────────────────────────────────────────────────
export async function sendCancelSurveyEmail(to: string): Promise<void> {
  await send({
    to,
    subject: "Lamentamos verte ir — ¿nos cuentas por qué?",
    html: template({
      heading: `Gracias por probar ArteGenIA`,
      preheader: "Tu plan Pro se cancelará al final del periodo. ¿Qué podríamos mejorar?",
      body: `
        <p>Tu suscripción Pro se cancelará al final del periodo de facturación actual. Hasta entonces sigues teniendo acceso a todo.</p>
        <p style="margin-top: 16px;">Si tienes 30 segundos, nos ayudaría MUCHO saber por qué cancelas. Responde a este email con una de estas:</p>
        <ul style="padding-left: 20px; margin: 8px 0;">
          <li style="margin-bottom: 6px;"><b>Precio</b> — no me sale a cuenta</li>
          <li style="margin-bottom: 6px;"><b>Funcionalidad</b> — falta algo concreto</li>
          <li style="margin-bottom: 6px;"><b>Calidad</b> — la IA no es lo suficientemente buena</li>
          <li style="margin-bottom: 6px;"><b>Ya no lo necesito</b> — proyecto terminado</li>
          <li style="margin-bottom: 6px;"><b>Otra</b> — cuéntanos brevemente</li>
        </ul>
        <p style="margin-top: 16px;">Cualquier respuesta nos ayuda a mejorar el producto para tu próximo proyecto. Gracias por el feedback.</p>
      `,
    }),
  });
}
