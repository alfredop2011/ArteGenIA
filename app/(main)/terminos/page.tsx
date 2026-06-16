"use client";

import { useLocale } from "@/hooks/useLocale";
import LegalTranslationPending from "@/components/layout/LegalTranslationPending";

const LAST_UPDATED = "12 de junio de 2026";
const CONTACT_EMAIL = "hola@artegenia.com";

/**
 * Términos y Condiciones — servicio comercial con planes de pago.
 * Cumple: LSSI (Art. 27.4 renovación auto), RDL 1/2007 (Art. 103.m exención
 * derecho de desistimiento para contenido digital ejecutado), TRLGDCU.
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
        El servicio se ofrece en tres planes:
      </p>
      <ul>
        <li><strong>Free (0€):</strong> editor completo, 50+ plantillas, exportar PNG/JPG, multi-formato, 1 generación IA al día, marca de agua &quot;Hecho con ArteGenIA&quot; en las descargas.</li>
        <li><strong>Pro (9,99€/mes):</strong> todo lo de Free + sin marca de agua, IA ilimitada (asistente + remix + quitar fondo), exportar PDF imprenta y SVG vectorial, fuentes propias, soporte prioritario, uso comercial sin restricciones.</li>
        <li><strong>Enterprise (34,99€/mes):</strong> todo lo de Pro + múltiples usuarios en equipo, Brand Kit (logo + paleta de marca), plantillas exclusivas por industria, account manager dedicado, soporte por WhatsApp, facturación a empresa con IVA.</li>
      </ul>
      <p>
        Las funciones específicas pueden añadirse, modificarse o retirarse
        según se indica en la sección 9. Los precios pueden actualizarse con
        15 días de aviso a usuarios activos (los cambios solo aplican al
        siguiente ciclo de facturación).
      </p>

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
        Cada plan tiene cuotas distintas en operaciones de IA (asistente
        conversacional, generación de fondos, eliminación de fondos, remix):
      </p>
      <ul>
        <li><strong>Free:</strong> 1 generación IA al día (se reinicia a las 00:00 UTC).</li>
        <li><strong>Pro y Enterprise:</strong> uso ilimitado dentro de límites razonables. Detectamos automáticamente patrones de abuso (más de 500 generaciones/día sostenidas) y podemos limitar temporalmente para proteger la disponibilidad del servicio. En estos casos te avisaremos por email antes de aplicar cualquier restricción.</li>
      </ul>
      <p>
        Las cuotas y límites pueden ajustarse para mantener la sostenibilidad
        del servicio. Si se reducen cuotas en un plan de pago, se avisará con
        15 días de antelación.
      </p>

      <h2>7. Servicio &quot;tal cual&quot; — sin garantías</h2>
      <p>
        ArteGenIA se ofrece &quot;tal cual&quot; (AS-IS). En la medida que
        permita la ley aplicable, no garantizamos:
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
        Nuestra responsabilidad económica máxima frente a usuarios de pago se
        limita a las cantidades efectivamente pagadas por el usuario en los
        seis (6) meses anteriores al hecho generador. Para usuarios del plan
        Free, se limita a cero euros. En todo caso, no excluimos la
        responsabilidad por dolo o por daños a la salud causados por nuestra
        negligencia, conforme exige la legislación española.
      </p>

      <h2>9. Precios, planes y facturación</h2>
      <p>
        Los precios vigentes están publicados en{" "}
        <a href="/pricing">/pricing</a>. Todos los precios se muestran en euros (€)
        e incluyen el IVA aplicable cuando legalmente corresponde.
      </p>
      <ul>
        <li><strong>Métodos de pago:</strong> tarjeta de crédito/débito a través de Stripe Payments Europe Ltd. ArteGenIA no almacena ni procesa números de tarjeta — todos los datos de pago los gestiona Stripe (PCI-DSS Level 1).</li>
        <li><strong>Periodicidad:</strong> los planes de pago se facturan mensualmente por adelantado. En el futuro podremos ofrecer facturación anual con descuento.</li>
        <li><strong>Facturas:</strong> Stripe emite recibo automático tras cada cobro. Las facturas con datos fiscales completos están disponibles en el Portal de cliente de Stripe (accesible desde <a href="/pricing">/pricing</a>).</li>
        <li><strong>Impagos:</strong> si una renovación falla (tarjeta caducada, fondos insuficientes), Stripe reintenta el cobro durante 21 días. Si pasados 21 días no se ha cobrado, la suscripción se cancela y el plan vuelve a Free.</li>
      </ul>

      <h2>10. Renovación automática (LSSI Art. 27.4)</h2>
      <p>
        Los planes de pago se <strong>renuevan automáticamente</strong> al
        finalizar cada período de facturación (mensual o anual, según el plan
        contratado) por el mismo importe y duración, salvo que canceles antes
        de la fecha de renovación.
      </p>
      <p>
        Stripe te enviará un email de notificación antes de cada renovación
        si así lo configuras en tu perfil de cliente. Recomendamos verificar
        el método de pago periódicamente en el Portal de cliente.
      </p>

      <h2>11. Cancelación de suscripción</h2>
      <p>
        Puedes cancelar tu suscripción <strong>en cualquier momento sin
        permanencia ni penalización</strong> desde el Portal de cliente de
        Stripe, accesible desde <a href="/pricing">/pricing</a> con el botón
        &quot;Gestionar suscripción&quot;.
      </p>
      <ul>
        <li>La cancelación es efectiva al final del período de facturación ya pagado. Mantienes acceso a las funciones del plan hasta esa fecha.</li>
        <li>No se prorratean reembolsos por períodos parciales (ver sección 13).</li>
        <li>Al final del período tu cuenta pasa automáticamente al plan Free. Tus diseños y datos se conservan según la <a href="/privacidad">Política de Privacidad</a>.</li>
        <li>Si necesitas cerrar también la cuenta de usuario, escríbenos a{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> o cancela
          tu cuenta desde la configuración.</li>
      </ul>

      <h2>12. Derecho de desistimiento (consumidores)</h2>
      <p>
        Como regla general, los consumidores disponen de 14 días naturales
        para desistir de un contrato a distancia (Art. 102 TRLGDCU).
      </p>
      <p>
        <strong>Excepción aplicable:</strong> conforme al Art. 103.m del Real
        Decreto Legislativo 1/2007 (TRLGDCU), el derecho de desistimiento{" "}
        <strong>no se aplica a contenidos digitales que se ejecutan al inicio
        de la prestación con consentimiento previo y expreso del consumidor</strong>.
      </p>
      <p>
        Al iniciar tu suscripción y empezar a usar las funciones premium
        (generaciones de IA, exportación PDF/SVG, etc.) reconoces que:
      </p>
      <ul>
        <li>La prestación digital del servicio comienza inmediatamente tras el pago.</li>
        <li>Consientes expresamente el inicio inmediato del servicio.</li>
        <li>Eres consciente de que pierdes el derecho de desistimiento una vez iniciada la prestación.</li>
      </ul>
      <p>
        Esto no afecta a tu derecho a <strong>cancelar la renovación
        automática en cualquier momento</strong> (sección 11) ni a tus
        derechos como consumidor por defectos del servicio.
      </p>

      <h2>13. Reembolsos</h2>
      <p>
        Por la naturaleza digital del servicio, <strong>no se realizan
        reembolsos por períodos parciales</strong> ni por funciones no
        utilizadas. Mantienes acceso al servicio hasta el final del período
        ya pagado.
      </p>
      <p>
        <strong>Excepciones</strong> en las que valoramos reembolso (total o
        parcial) caso por caso:
      </p>
      <ul>
        <li>Fallos técnicos atribuibles a ArteGenIA que impidan usar las funciones premium durante un porcentaje significativo del período facturado.</li>
        <li>Cobro duplicado o erróneo por error técnico.</li>
        <li>Imposibilidad de cancelar tu suscripción por fallo de nuestra plataforma (en cuyo caso reembolsamos los períodos posteriores a tu solicitud de cancelación).</li>
      </ul>
      <p>
        Para solicitar un reembolso, escríbenos a{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> detallando el
        motivo. Respondemos en un plazo máximo de 14 días naturales.
      </p>

      <h2>14. Modificaciones del servicio</h2>
      <p>
        Podemos añadir, modificar o eliminar funciones en cualquier momento.
        Si los cambios afectan sustancialmente tus derechos como usuario de
        pago, te avisaremos por email con 15 días de antelación y podrás
        cancelar sin penalización antes de que entren en vigor.
      </p>

      <h2>15. Cancelación de cuenta por nosotros</h2>
      <p>
        Nos reservamos el derecho de suspender o cerrar tu cuenta sin previo
        aviso si incumples el uso aceptable (sección 4), abusas de funciones
        ilimitadas de forma manifiesta, o usas el servicio para actividades
        ilegales. En estos casos no procede reembolso del período en curso.
      </p>
      <p>
        Puedes cerrar tu propia cuenta en cualquier momento desde la
        configuración o escribiéndonos a{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Tras el cierre,
        eliminamos tus datos según el plazo indicado en la{" "}
        <a href="/privacidad">Política de Privacidad</a>.
      </p>

      <h2>16. Cambios en estos términos</h2>
      <p>
        Podemos actualizar estos términos. La fecha de &quot;última
        actualización&quot; al inicio refleja la versión vigente. Cambios
        sustanciales se notificarán por email con 15 días de antelación.
      </p>

      <h2>17. Ley aplicable y jurisdicción</h2>
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

      <h2>18. Contacto</h2>
      <p>
        ¿Dudas sobre estos términos? Escríbenos a{" "}
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
