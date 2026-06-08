"use client";

import { useLocale } from "@/hooks/useLocale";
import LegalTranslationPending from "@/components/layout/LegalTranslationPending";

const LAST_UPDATED = "8 de junio de 2026";
const CONTACT_EMAIL = "cuentas@peligroficial.com";

/**
 * Política de Cookies — solo cookies técnicas (Supabase auth + sesión).
 * Si en el futuro añades analytics (PostHog, GA4) o tracking de marketing,
 * actualizar la tabla y añadir banner de consentimiento (Directiva ePrivacy).
 *
 * i18n: texto oficial solo en ES. Otros idiomas → banner + texto ES debajo.
 */
export default function CookiesPage() {
  const { locale } = useLocale();
  if (locale !== "es") {
    return (
      <article className="mx-auto max-w-3xl px-6 py-12">
        <LegalTranslationPending docType="cookies" />
        <CookiesContentES />
      </article>
    );
  }
  return <CookiesContentES />;
}

function CookiesContentES() {
  return (
    <article id="es-version" className="mx-auto max-w-3xl px-6 py-12 prose prose-invert prose-sm
      prose-headings:text-white prose-headings:font-black prose-headings:tracking-tight
      prose-p:text-gray-300 prose-li:text-gray-300 prose-strong:text-white prose-a:text-purple-400">
      <div className="not-prose mb-8">
        <span className="text-[10px] font-bold tracking-widest text-purple-400 uppercase">Legal</span>
        <h1 className="text-3xl sm:text-4xl font-black text-white mt-1">Política de Cookies</h1>
        <p className="text-xs text-gray-500 mt-2">Última actualización: {LAST_UPDATED}</p>
      </div>

      <div className="not-prose mb-8 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs">
        ✓ ArteGenIA <strong>solo usa cookies estrictamente necesarias</strong> para que el servicio funcione. NO usamos cookies de analítica, publicidad ni perfilado.
      </div>

      <h2>1. ¿Qué es una cookie?</h2>
      <p>
        Una cookie es un pequeño archivo de texto que un sitio web guarda en
        tu navegador. Sirven para que el sitio recuerde información sobre tu
        visita (por ejemplo, que has iniciado sesión).
      </p>

      <h2>2. Cookies que usamos</h2>
      <p>
        Todas las cookies que usamos son <strong>cookies técnicas estrictamente
        necesarias</strong>. Sin ellas, el servicio no puede funcionar (no
        podrías iniciar sesión ni mantener tu sesión activa).
      </p>

      <table className="not-prose w-full text-xs border-collapse my-4">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-2 text-white">Nombre</th>
            <th className="text-left py-2 text-white">Proveedor</th>
            <th className="text-left py-2 text-white">Finalidad</th>
            <th className="text-left py-2 text-white">Duración</th>
          </tr>
        </thead>
        <tbody className="text-gray-300">
          <tr className="border-b border-white/5">
            <td className="py-2 pr-3 font-mono text-[10px]">sb-access-token</td>
            <td className="py-2 pr-3">Supabase</td>
            <td className="py-2 pr-3">Token de sesión autenticada</td>
            <td className="py-2">1 hora</td>
          </tr>
          <tr className="border-b border-white/5">
            <td className="py-2 pr-3 font-mono text-[10px]">sb-refresh-token</td>
            <td className="py-2 pr-3">Supabase</td>
            <td className="py-2 pr-3">Renovar sesión automáticamente</td>
            <td className="py-2">30 días</td>
          </tr>
          <tr>
            <td className="py-2 pr-3 font-mono text-[10px]">sb-auth-token</td>
            <td className="py-2 pr-3">Supabase</td>
            <td className="py-2 pr-3">Estado de autenticación cliente</td>
            <td className="py-2">Sesión</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Cookies que NO usamos</h2>
      <p>
        Por transparencia, queremos dejar claro lo que <strong>no</strong> hacemos:
      </p>
      <ul>
        <li>❌ <strong>Sin cookies de analítica</strong> (Google Analytics, PostHog, Mixpanel)</li>
        <li>❌ <strong>Sin cookies publicitarias</strong> (Facebook Pixel, Google Ads, etc.)</li>
        <li>❌ <strong>Sin trackers de terceros</strong> que sigan tu navegación fuera del sitio</li>
        <li>❌ <strong>Sin venta de datos</strong> a terceros</li>
      </ul>
      <p className="text-xs text-gray-500">
        Si en el futuro añadimos analítica para entender cómo se usa el servicio,
        actualizaremos esta política y mostraremos un banner de consentimiento
        antes de activar esas cookies.
      </p>

      <h2>4. Base legal</h2>
      <p>
        Las cookies estrictamente necesarias están exentas del requisito de
        consentimiento previo según el artículo 22.2 de la Ley 34/2002 (LSSI)
        y las directrices de la Agencia Española de Protección de Datos
        (Guía sobre el uso de cookies, 2023).
      </p>
      <p>
        Aún así, te informamos de su existencia para cumplir con el principio
        de transparencia.
      </p>

      <h2>5. Cómo gestionar las cookies</h2>
      <p>
        Puedes bloquear o eliminar las cookies desde la configuración de tu
        navegador en cualquier momento. <strong>Importante:</strong> si
        bloqueas las cookies técnicas, no podrás iniciar sesión ni usar el
        servicio.
      </p>
      <ul>
        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
        <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
        <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
        <li><a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
      </ul>

      <h2>6. Cambios en esta política</h2>
      <p>
        Si añadimos cookies de tipo distinto (analítica, marketing) o cambian
        los proveedores, actualizaremos esta política y, si corresponde,
        mostraremos un banner para recabar tu consentimiento.
      </p>

      <h2>7. Contacto</h2>
      <p>
        ¿Dudas sobre cookies? Escríbenos a{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <div className="not-prose mt-12 pt-6 border-t border-white/[0.06] text-xs text-gray-600">
        <p>
          Documento legal generado para ArteGenIA · servicio en fase BETA
        </p>
      </div>
    </article>
  );
}
