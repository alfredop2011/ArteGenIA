"use client";

import { useLocale } from "@/hooks/useLocale";
import LegalTranslationPending from "@/components/layout/LegalTranslationPending";

const LAST_UPDATED = "8 de junio de 2026";
const CONTACT_EMAIL = "cuentas@peligroficial.com";

/**
 * Términos y Condiciones — servicio en fase BETA gratuita.
 * Cuando se introduzca el plan Pro de pago, añadir secciones de:
 *  - Precios y facturación
 *  - Cancelación de suscripción
 *  - Reembolsos (Real Decreto Legislativo 1/2007, derecho de desistimiento)
 *  - Renovación automática (LSSI Art. 27)
 *
 * i18n: texto oficial solo en ES. Otros idiomas → banner + texto ES debajo.
 */
export default function TerminosPage() {
  const { locale } = useLocale();
  if (locale !== "es") {
    return (
      <article className="mx-auto max-w-3xl px-6 py-12">
        <LegalTranslationPending docType="terms" />
        <TermsContentES />
      </article>
    );
  }
  return <TermsContentES />;
}

function TermsContentES() {
  return (
    <article id="es-version" className="mx-auto max-w-3xl px-6 py-12 prose prose-invert prose-sm
      prose-headings:text-white prose-headings:font-black prose-headings:tracking-tight
      prose-p:text-gray-300 prose-li:text-gray-300 prose-strong:text-white prose-a:text-purple-400">
      <div className="not-prose mb-8">
        <span className="text-[10px] font-bold tracking-widest text-purple-400 uppercase">Legal</span>
        <h1 className="text-3xl sm:text-4xl font-black text-white mt-1">Términos y Condiciones</h1>
        <p className="text-xs text-gray-500 mt-2">Última actualización: {LAST_UPDATED}</p>
      </div>

      <div className="not-prose mb-8 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
        ⚠ ArteGenIA está en <strong>fase BETA gratuita</strong>. El servicio se ofrece &quot;tal cual&quot;, puede contener errores, y se reserva el derecho de modificar o suspender funciones sin previo aviso.
      </div>

      <h2>1. Aceptación de los términos</h2>
      <p>
        Al registrarte o usar ArteGenIA aceptas estos Términos y Condiciones y
        nuestra <a href="/privacidad">Política de Privacidad</a>. Si no estás
        de acuerdo, no uses el servicio.
      </p>

      <h2>2. Descripción del servicio</h2>
      <p>
        ArteGenIA es una herramienta web que permite crear flyers y diseños
        gráficos usando plantillas predefinidas e inteligencia artificial.
        El servicio incluye:
      </p>
      <ul>
        <li>Editor visual de plantillas</li>
        <li>Generación y procesado de imágenes con IA (recortar personas, eliminar fondos, generar fondos)</li>
        <li>Almacenamiento de tus diseños en la nube</li>
        <li>Descarga de tus diseños en formato PNG</li>
      </ul>

      <h2>3. Cuenta de usuario</h2>
      <p>Para usar el servicio necesitas crear una cuenta. Te comprometes a:</p>
      <ul>
        <li>Proporcionar información veraz al registrarte</li>
        <li>Mantener segura tu contraseña (no compartirla con terceros)</li>
        <li>Notificarnos inmediatamente cualquier uso no autorizado de tu cuenta</li>
        <li>Ser mayor de 14 años (o tener consentimiento parental)</li>
      </ul>
      <p>
        Cada usuario puede tener una sola cuenta. Nos reservamos el derecho de
        cerrar cuentas duplicadas o creadas con datos falsos.
      </p>

      <h2>4. Uso aceptable</h2>
      <p>Al usar ArteGenIA te comprometes a NO:</p>
      <ul>
        <li>Subir imágenes de personas sin su consentimiento</li>
        <li>Subir contenido ilegal, violento, pornográfico o que infrinja derechos de terceros</li>
        <li>Crear material que constituya acoso, discriminación o discurso de odio</li>
        <li>Usar el servicio para suplantar la identidad de otra persona o marca</li>
        <li>Intentar saltarte las cuotas técnicas, hacer ingeniería inversa o atacar el servicio</li>
        <li>Usar bots o scripts para crear cuentas o consumir recursos masivamente</li>
        <li>Revender el acceso al servicio sin autorización previa</li>
      </ul>
      <p>
        Nos reservamos el derecho de suspender o cerrar cuentas que incumplan
        estas reglas, sin previo aviso ni reembolso.
      </p>

      <h2>5. Propiedad intelectual</h2>

      <h3>5.1 Tu contenido</h3>
      <p>
        Eres el propietario del contenido que subes (fotos) y de los diseños
        finales que creas con ArteGenIA. Nos concedes una licencia técnica
        limitada únicamente para almacenarlos, procesarlos con IA cuando lo
        solicites, y mostrártelos en tu cuenta.
      </p>

      <h3>5.2 Nuestro contenido</h3>
      <p>
        Las plantillas predefinidas, el código del editor, el diseño de la
        interfaz, la marca ArteGenIA y los logotipos son propiedad de su
        titular. Puedes usar las plantillas como base para tus diseños,
        pero no extraerlas o redistribuirlas como recursos sueltos.
      </p>

      <h3>5.3 Contenido generado por IA</h3>
      <p>
        Las imágenes generadas o procesadas por IA están sujetas a las
        políticas de los modelos utilizados (Fal.ai). La atribución legal del
        contenido generado por IA es un área en evolución; te recomendamos no
        usar contenido IA para fines críticos sin revisión adicional.
      </p>

      <h2>6. Cuotas y limitaciones</h2>
      <p>
        El plan gratuito tiene cuotas mensuales en operaciones de IA
        (ej. recortar persona). Las cuotas se renuevan el día 1 de cada mes.
        Nos reservamos el derecho de ajustar cuotas o introducir nuevas
        para mantener la sostenibilidad del servicio.
      </p>

      <h2>7. Servicio &quot;tal cual&quot; — sin garantías</h2>
      <p>
        ArteGenIA se ofrece &quot;tal cual&quot; (AS-IS) sin garantías de ningún
        tipo durante la fase beta. No garantizamos:
      </p>
      <ul>
        <li>Que el servicio esté libre de errores o interrupciones</li>
        <li>Que las funciones de IA produzcan siempre el resultado esperado</li>
        <li>Que tus diseños se conserven indefinidamente (haz copias propias de tus diseños importantes)</li>
        <li>La compatibilidad con todos los navegadores o dispositivos</li>
      </ul>

      <h2>8. Limitación de responsabilidad</h2>
      <p>
        En la medida que permita la ley aplicable, no seremos responsables de:
      </p>
      <ul>
        <li>Daños indirectos, lucro cesante o pérdida de oportunidad</li>
        <li>Pérdida de contenido por fallos técnicos, caídas de servidor o errores del usuario</li>
        <li>El uso que terceros hagan de tus diseños una vez descargados</li>
        <li>Disputas entre usuarios y terceros (ej. derechos de imagen de personas en fotos subidas)</li>
      </ul>
      <p>
        Al ser un servicio gratuito en beta, nuestra responsabilidad económica
        máxima se limita a cero euros.
      </p>

      <h2>9. Modificaciones del servicio</h2>
      <p>
        Podemos añadir, modificar o eliminar funciones en cualquier momento.
        Si los cambios afectan sustancialmente tus derechos, te avisaremos por
        email con 15 días de antelación.
      </p>

      <h2>10. Cancelación</h2>
      <p>
        Puedes cancelar tu cuenta en cualquier momento desde la configuración
        o escribiéndonos a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        Tras la cancelación, eliminamos tus datos según el plazo indicado en la
        Política de Privacidad.
      </p>

      <h2>11. Cambios en estos términos</h2>
      <p>
        Podemos actualizar estos términos. La fecha de &quot;última
        actualización&quot; al inicio refleja la versión vigente. Cambios
        sustanciales se notificarán por email con 15 días de antelación.
      </p>

      <h2>12. Ley aplicable y jurisdicción</h2>
      <p>
        Estos términos se rigen por la legislación española. Cualquier
        controversia se someterá a los Juzgados y Tribunales del domicilio
        del titular del servicio, sin perjuicio de los derechos del consumidor
        a acudir a los tribunales de su domicilio (Art. 90.2 TRLGDCU).
      </p>
      <p>
        Plataforma europea de resolución de litigios online:{" "}
        <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a>.
      </p>

      <h2>13. Contacto</h2>
      <p>
        ¿Dudas sobre estos términos? Escríbenos a{" "}
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
