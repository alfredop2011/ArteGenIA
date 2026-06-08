"use client";

import { useLocale } from "@/hooks/useLocale";
import LegalTranslationPending from "@/components/layout/LegalTranslationPending";

// metadata se movio a layout.tsx del grupo legal porque esta es Client Component.
// Si quieres SEO per-locale, se puede meter generateMetadata en un Server wrapper.

const LAST_UPDATED = "8 de junio de 2026";
const CONTACT_EMAIL = "cuentas@peligroficial.com";

/**
 * Política de Privacidad — adaptada a Reglamento (UE) 2016/679 (GDPR)
 * y LOPDGDD española. Servicio en fase BETA gratuita, sin actividad
 * comercial. Cuando el titular se constituya como autónomo o sociedad,
 * actualizar el bloque "Responsable del tratamiento" con datos fiscales.
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

      <div className="not-prose mb-8 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
        ⚠ ArteGenIA está actualmente en <strong>fase BETA gratuita y sin actividad comercial</strong>. Estos términos cubren el uso del servicio mientras se mantiene en este estado.
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
        <li><strong>Datos de cuenta:</strong> email y nombre (si te registras con Google también recibimos tu foto de perfil pública)</li>
        <li><strong>Contenido creado:</strong> diseños/proyectos que guardas, fotos que subes para usar en tus flyers</li>
        <li><strong>Datos técnicos:</strong> dirección IP, navegador, sistema operativo, fecha y hora de acceso (logs estándar de servidor)</li>
        <li><strong>Datos de uso:</strong> registro anónimo del número de operaciones de IA realizadas (para gestionar cuotas, no se almacena el contenido)</li>
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
      </ul>

      <h2>7. Tus derechos</h2>
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

      <h2>8. Menores de edad</h2>
      <p>
        El servicio no está dirigido a menores de 14 años. Si eres menor, necesitas
        consentimiento de tus padres o tutores antes de registrarte.
      </p>

      <h2>9. Cambios en esta política</h2>
      <p>
        Podemos actualizar esta política cuando añadamos funciones nuevas o cambien
        proveedores. Te avisaremos por email con al menos 15 días de antelación
        si los cambios son significativos.
      </p>

      <h2>10. Contacto</h2>
      <p>
        ¿Dudas sobre tu privacidad? Escríbenos a{" "}
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
