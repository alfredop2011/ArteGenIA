"use client";

import { useLocale } from "@/hooks/useLocale";
import LegalTranslationPending from "@/components/layout/LegalTranslationPending";

// metadata se movio a layout.tsx del grupo legal porque esta es Client Component.
// Si quieres SEO per-locale, se puede meter generateMetadata en un Server wrapper.

const LAST_UPDATED = "12 de junio de 2026";
const CONTACT_EMAIL = "hola@artegenia.com";

/**
 * Política de Privacidad — adaptada a Reglamento (UE) 2016/679 (GDPR)
 * y LOPDGDD española. Servicio comercial con planes de pago gestionados
 * vía Stripe Payments Europe Ltd. Cuando el titular se constituya como
 * autónomo o sociedad, actualizar el bloque "Responsable del tratamiento"
 * con datos fiscales (CIF/NIF, domicilio fiscal, registro mercantil).
 *
 * i18n: el texto legal completo solo existe en ES (es la version oficial
 * juridicamente vinculante). Para otros idiomas mostramos un banner con
 * link al ES — solucion honesta para MVP en lugar de traducciones legales
 * orientativas que podrian inducir a error.
 */
export default function PrivacidadPage() {
  const { locale } = useLocale();

  // Locales != es → mostrar el banner "translation pending" + texto completo
  // en ES debajo (asi cumplen legalmente todos los usuarios sea cual sea su idioma).
  if (locale !== "es") {
    return (
      <article className="mx-auto max-w-3xl px-6 py-12">
        <LegalTranslationPending docType="privacy" />
        <PrivacyContentES />
      </article>
    );
  }

  return <PrivacyContentES />;
}

function PrivacyContentES() {
  return (
    <article id="es-version" className="mx-auto max-w-3xl px-6 py-12 prose prose-invert prose-sm
      prose-headings:text-white prose-headings:font-black prose-headings:tracking-tight
      prose-p:text-gray-300 prose-li:text-gray-300 prose-strong:text-white prose-a:text-purple-400">
      <div className="not-prose mb-8">
        <span className="text-[10px] font-bold tracking-widest text-purple-400 uppercase">Legal</span>
        <h1 className="text-3xl sm:text-4xl font-black text-white mt-1">Política de Privacidad</h1>
        <p className="text-xs text-gray-500 mt-2">Última actualización: {LAST_UPDATED}</p>
      </div>

      <h2>1. Responsable del tratamiento</h2>
      <p>
        El responsable del tratamiento de los datos personales recogidos a través
        de ArteGenIA es:
      </p>
      <ul>
        <li><strong>Titular:</strong> Persona física (servicio personal en fase beta)</li>
        <li><strong>Email de contacto:</strong> <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></li>
        <li><strong>Sitio web:</strong> artegenia.vercel.app</li>
      </ul>
      <p className="text-xs text-gray-500">
        En cuanto el servicio adopte forma jurídica (autónomo o sociedad), se actualizarán los datos fiscales obligatorios (NIF/CIF, domicilio fiscal, registro mercantil).
      </p>

      <h2>2. Qué datos recogemos</h2>
      <p>Para que el servicio funcione, recogemos los siguientes datos:</p>
      <ul>
        <li><strong>Datos de cuenta:</strong> email y nombre (si te registras con Google también recibimos tu foto de perfil pública).</li>
        <li><strong>Contenido creado:</strong> diseños/proyectos que guardas, fotos que subes para usar en tus flyers.</li>
        <li><strong>Datos técnicos:</strong> dirección IP, navegador, sistema operativo, fecha y hora de acceso (logs estándar de servidor).</li>
        <li><strong>Datos de uso:</strong> registro anónimo del número de operaciones de IA realizadas (para gestionar cuotas, no se almacena el contenido).</li>
        <li><strong>Datos de facturación (solo planes de pago):</strong> nombre fiscal o razón social, dirección de facturación, NIF/CIF si se proporciona, identificador interno de cliente Stripe (<code>customer_id</code>), plan contratado, fechas de inicio/renovación, estado de la suscripción. <strong>Nunca recibimos ni almacenamos números de tarjeta</strong> — todos los datos de tarjeta los gestiona directamente Stripe Payments Europe Ltd. (ver sección 4).</li>
      </ul>

      <h2>3. Finalidad y base legal</h2>
      <table className="not-prose w-full text-xs border-collapse my-4">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-2 text-white">Finalidad</th>
            <th className="text-left py-2 text-white">Base legal (GDPR Art. 6)</th>
          </tr>
        </thead>
        <tbody className="text-gray-300">
          <tr className="border-b border-white/5">
            <td className="py-2 pr-3">Crear y mantener tu cuenta</td>
            <td className="py-2">Ejecución del contrato (6.1.b)</td>
          </tr>
          <tr className="border-b border-white/5">
            <td className="py-2 pr-3">Guardar tus diseños en la nube</td>
            <td className="py-2">Ejecución del contrato (6.1.b)</td>
          </tr>
          <tr className="border-b border-white/5">
            <td className="py-2 pr-3">Procesar imágenes con IA (recortar, generar fondos)</td>
            <td className="py-2">Ejecución del contrato (6.1.b)</td>
          </tr>
          <tr className="border-b border-white/5">
            <td className="py-2 pr-3">Aplicar cuotas según plan</td>
            <td className="py-2">Interés legítimo (6.1.f)</td>
          </tr>
          <tr className="border-b border-white/5">
            <td className="py-2 pr-3">Cobrar planes de pago y emitir factura</td>
            <td className="py-2">Ejecución del contrato (6.1.b) y obligación legal (6.1.c) en lo fiscal</td>
          </tr>
          <tr className="border-b border-white/5">
            <td className="py-2 pr-3">Conservar facturación con fines contables/fiscales</td>
            <td className="py-2">Obligación legal (6.1.c) — Art. 30 Código de Comercio (6 años)</td>
          </tr>
          <tr>
            <td className="py-2 pr-3">Seguridad y prevención de abuso</td>
            <td className="py-2">Interés legítimo (6.1.f)</td>
          </tr>
        </tbody>
      </table>

      <h2>4. Proveedores que tratan tus datos (encargados)</h2>
      <p>
        Para prestar el servicio usamos proveedores tecnológicos. Cada uno trata
        únicamente los datos necesarios para su función y cumple GDPR:
      </p>
      <ul>
        <li><strong>Supabase</strong> (autenticación, base de datos): cuenta, contenido, sesiones. Servidores en EU.</li>
        <li><strong>Vercel</strong> (hosting): logs técnicos, contenido renderizado. Servidores en EU/US.</li>
        <li><strong>Google</strong> (OAuth opcional): solo si decides iniciar sesión con Google.</li>
        <li><strong>Cloudflare R2</strong> (almacenamiento de imágenes): fotos que subes y miniaturas de tus diseños.</li>
        <li><strong>Fal.ai</strong> (proveedor de IA): cuando usas funciones de IA (recortar persona, generar fondo), enviamos la imagen al modelo. Fal.ai no usa tu imagen para entrenar modelos (política contractual).</li>
        <li><strong>remove.bg</strong> (eliminación de fondos): solo cuando usas la función específica.</li>
        <li><strong>Stripe Payments Europe Ltd.</strong> (procesador de pagos): solo si contratas un plan de pago. Stripe recibe directamente los datos de tu tarjeta (nosotros nunca los vemos), y trata tu email, importe, plan e información fiscal opcional para emitir el cargo y la factura. Stripe es responsable independiente del tratamiento de los datos de tarjeta (PCI-DSS Level 1). Su política: <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">stripe.com/privacy</a>.</li>
      </ul>

      <h2>5. Transferencias internacionales</h2>
      <p>
        Algunos proveedores pueden alojar datos fuera de la UE (principalmente EE.UU.).
        Todos cuentan con cláusulas contractuales tipo de la Comisión Europea (SCCs)
        o están adheridos al EU-US Data Privacy Framework.
      </p>

      <h2>6. Plazo de conservación</h2>
      <ul>
        <li><strong>Cuenta y contenido:</strong> mientras tu cuenta esté activa. Si la eliminas, borramos todos tus datos en 30 días.</li>
        <li><strong>Logs técnicos:</strong> 30 días.</li>
        <li><strong>Registros de uso de IA:</strong> 12 meses (para cumplir cuotas mensuales y auditoría de coste).</li>
        <li><strong>Datos de facturación y facturas:</strong> 6 años desde la emisión de la factura, conforme al Art. 30 del Código de Comercio y Art. 19 de la Ley General Tributaria. Tras ese plazo se eliminan o anonimizan.</li>
      </ul>

      <h2>7. Cookies y almacenamiento local</h2>
      <p>
        ArteGenIA usa exclusivamente <strong>cookies y almacenamiento local
        estrictamente necesarios</strong> para el funcionamiento del servicio
        (Art. 22.2 LSSI — exención de consentimiento previo):
      </p>
      <ul>
        <li><strong>Cookies de sesión Supabase</strong> (httpOnly): mantienen tu sesión iniciada y guardan el verifier PKCE para OAuth.</li>
        <li><strong>localStorage del navegador</strong>: preferencia de idioma e indicadores de onboarding ya vistos (no se envían al servidor).</li>
      </ul>
      <p>
        <strong>No usamos cookies de marketing, publicidad ni analytics de
        terceros</strong>. Si en el futuro las incorporamos, te pediremos
        consentimiento explícito mediante banner antes de activarlas.
      </p>
      <p>
        Las páginas de pago alojadas por Stripe (fuera de nuestro dominio)
        usan sus propias cookies de sesión y antifraude. Consulta su política
        en <a href="https://stripe.com/cookie-settings" target="_blank" rel="noopener noreferrer">stripe.com/cookie-settings</a>.
      </p>

      <h2>8. Tus derechos</h2>
      <p>Como usuario tienes derecho a:</p>
      <ul>
        <li><strong>Acceso:</strong> saber qué datos tenemos sobre ti.</li>
        <li><strong>Rectificación:</strong> corregir datos incorrectos.</li>
        <li><strong>Supresión (derecho al olvido):</strong> eliminar tu cuenta y datos.</li>
        <li><strong>Oposición:</strong> oponerte a cierto tratamiento.</li>
        <li><strong>Portabilidad:</strong> recibir tus datos en formato estándar.</li>
        <li><strong>Limitación:</strong> restringir el tratamiento en ciertos casos.</li>
      </ul>
      <p>
        Para ejercer cualquiera de estos derechos, escríbenos a{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Respondemos en
        un plazo máximo de 30 días.
      </p>
      <p>
        Si crees que no atendemos tu solicitud, puedes reclamar ante la{" "}
        <a href="https://www.aepd.es/" target="_blank" rel="noopener noreferrer">Agencia Española de Protección de Datos (AEPD)</a>.
      </p>

      <h2>9. Menores de edad</h2>
      <p>
        El servicio no está dirigido a menores de 14 años. Si eres menor, necesitas
        consentimiento de tus padres o tutores antes de registrarte.
      </p>

      <h2>10. Cambios en esta política</h2>
      <p>
        Podemos actualizar esta política cuando añadamos funciones nuevas o cambien
        proveedores. Te avisaremos por email con al menos 15 días de antelación
        si los cambios son significativos.
      </p>

      <h2>11. Contacto</h2>
      <p>
        ¿Dudas sobre tu privacidad? Escríbenos a{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <div className="not-prose mt-12 pt-6 border-t border-white/[0.06] text-xs text-gray-600">
        <p>
          Documento legal vigente para ArteGenIA. Cualquier discrepancia
          entre este documento y versiones traducidas a otros idiomas se
          resuelve a favor del texto en español.
        </p>
      </div>
    </article>
  );
}
