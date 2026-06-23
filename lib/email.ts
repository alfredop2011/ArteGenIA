/**
 * Email transactional con Resend (Fase Z.23).
 *
 * 6 emails implementados:
 *   1. Welcome       — tras signup confirmado
 *   2. LowCredits    — cron diario detecta balance < 20% del grant
 *   3. UpgradePro    — tras checkout.session.completed de Stripe
 *   4. PaymentFailed — tras invoice.payment_failed (P1.2)
 *   5. TrialEnding   — tras trial_will_end (3 días antes del primer cargo)
 *   6. Cancel        — tras customer.subscription.deleted
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
                    <td style="padding-right: 10px;">
                      <img src="${APP_URL}/brand/exports/icon-180.png" alt="ArteGenIA" width="32" height="32" style="display: block; border: 0;"/>
                    </td>
                    <td style="font-weight: 800; font-size: 18px; color: #ffffff; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                      Arte<span style="background: linear-gradient(90deg, #FF1EA8, #FF8A00); -webkit-background-clip: text; background-clip: text; color: #FF1EA8;">GenIA</span>
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
/**
 * P1.2 — Cobro fallido (tarjeta caducada, fondos insuficientes, etc).
 * Stripe reintenta automáticamente 3-4 veces durante ~3 semanas. Mientras,
 * mandamos un único email al primer fallo invitando al user a actualizar
 * la tarjeta vía portal antes de que la suscripción se cancele.
 *
 * Si no actuamos, Stripe acaba en subscription.deleted → free silencioso,
 * = churn involuntario.
 */
export async function sendPaymentFailedEmail(
  to: string,
  opts?: { nextAttemptDate?: Date | null },
): Promise<void> {
  const portalUrl = `${APP_URL}/pricing`;
  const dateStr = opts?.nextAttemptDate
    ? new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long" }).format(opts.nextAttemptDate)
    : null;
  await send({
    to,
    subject: "Tu pago de ArteGenIA no se ha podido procesar",
    html: template({
      heading: `No pudimos cobrar tu suscripción`,
      preheader: "Actualiza tu método de pago antes de que perdamos la suscripción.",
      body: `
        <p>Hola,</p>
        <p>Hemos intentado cobrar tu suscripción de ArteGenIA pero la tarjeta ha sido rechazada (puede ser por caducidad, límite, o que el banco la haya bloqueado).</p>
        ${dateStr ? `<p style="margin-top: 16px;">Volveremos a intentarlo el <b>${dateStr}</b>. Si para entonces no podemos cobrar, tu plan pasará automáticamente a Free.</p>` : `<p style="margin-top: 16px;">Volveremos a intentarlo en los próximos días. Si no podemos cobrar, tu plan pasará automáticamente a Free.</p>`}
        <p style="margin-top: 16px;">Para evitarlo, actualiza tu método de pago desde Gestionar suscripción en el portal:</p>
      `,
      ctaText: "Actualizar método de pago",
      ctaHref: portalUrl,
    }),
  });
}

/**
 * Aviso de fin de prueba (Stripe dispara trial_will_end ~3 días antes).
 * Reduce chargebacks por cargo sorpresa al final del trial: el user sabe
 * cuándo se le cobra y puede cancelar a tiempo sin pasar por atención
 * al cliente.
 */
export async function sendTrialEndingEmail(
  to: string,
  opts: { trialEndDate: Date; planLabel?: string },
): Promise<void> {
  const portalUrl = `${APP_URL}/pricing`;
  const dateStr = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
  }).format(opts.trialEndDate);
  const planLabel = opts.planLabel ?? "Pro";
  await send({
    to,
    subject: `Tu prueba de ArteGenIA termina el ${dateStr}`,
    html: template({
      heading: `Tu prueba ${planLabel} termina pronto`,
      preheader: `El ${dateStr} cobraremos automáticamente. Puedes cancelar antes si lo prefieres.`,
      body: `
        <p>Hola,</p>
        <p>Solo un aviso amistoso: el <b>${dateStr}</b> termina tu prueba gratuita y se hará el primer cargo de tu plan <b>${planLabel}</b>.</p>
        <p style="margin-top: 16px;">Si todo va bien, no tienes que hacer nada — seguirás teniendo todas las features Pro sin interrupción.</p>
        <p style="margin-top: 16px;">Si prefieres no continuar, puedes cancelar desde Gestionar suscripción en cualquier momento antes de esa fecha. No te cobraremos.</p>
      `,
      ctaText: "Gestionar suscripción",
      ctaHref: portalUrl,
    }),
  });
}

// ─── 7. COLLABORATOR PHOTO RECEIVED ─────────────────────────────────────
// Se envía al owner cuando un colaborador completa el upload de una foto
// solicitada desde el editor (botón "Solicitar foto"). El email incluye
// CTA directo al proyecto para que el owner abra y vea el resultado.
export async function sendCollaboratorPhotoReceivedEmail(
  to: string,
  ownerName: string | null,
  collaboratorName: string,
  projectName: string,
  projectId: string,
  autoApplied: boolean,
): Promise<void> {
  const displayName = ownerName?.split(" ")[0] || "creador";
  const ctaText = autoApplied ? "Ver el flyer actualizado →" : "Abrir colaboradores →";
  const ctaHref = autoApplied
    ? `${APP_URL}/editor/${projectId}`
    : `${APP_URL}/mis-recursos?tab=colaboradores`;
  const bodyApplied = `
    <p>Hola ${displayName},</p>
    <p><b>${collaboratorName}</b> acaba de subir su foto para el flyer <b>${projectName}</b>.</p>
    <p style="margin-top: 16px;">Ya la hemos colocado automáticamente en el sitio que la pediste. Solo tienes que abrir el editor y ajustar lo que necesites antes de exportar.</p>
  `;
  const bodyOnlySaved = `
    <p>Hola ${displayName},</p>
    <p><b>${collaboratorName}</b> acaba de subir su foto para el flyer <b>${projectName}</b>.</p>
    <p style="margin-top: 16px;">La foto está guardada en tu sección de Colaboradores. Ábrela y arrástrala al flyer cuando quieras.</p>
  `;
  await send({
    to,
    subject: `${collaboratorName} ha subido su foto`,
    html: template({
      heading: `Foto recibida de ${collaboratorName}`,
      preheader: `Lista para tu flyer ${projectName}.`,
      body: autoApplied ? bodyApplied : bodyOnlySaved,
      ctaText,
      ctaHref,
    }),
  });
}

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
