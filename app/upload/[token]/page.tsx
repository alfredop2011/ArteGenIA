"use client";

import { useState, useEffect, useRef, use } from "react";
import { Camera, Check, Sparkles, ShieldCheck, Loader2, User, Tag, ArrowLeft } from "lucide-react";

/**
 * Página pública donde un colaborador rellena sus datos.
 *
 * Flujo:
 *  1. Al montar, valida el token contra /api/collaborator-invites?token=...
 *  2. Si es válido, muestra un selector inicial: ¿Persona o Marca?
 *  3. Según elija, muestra el formulario correspondiente:
 *     - Persona: nombre artístico + rol opcional + teléfono opcional + foto + consentimiento RGPD
 *     - Marca:   nombre de la marca + logo
 *  4. Al enviar, POST a /api/collaborators con FormData
 *  5. Muestra confirmación de éxito o error
 */

const CONSENT_TEXT = `Doy mi consentimiento expreso para que el organizador del evento utilice mi nombre artístico, teléfono e imagen en flyers, carteles y material promocional digital o impreso de los eventos en los que participe como colaborador. Puedo retirar mi consentimiento en cualquier momento contactando con el organizador.`;

type TokenStatus = "checking" | "valid" | "expired" | "used" | "not_found" | "error";
type Kind = "person" | "brand" | null;

export default function CollaboratorSignupPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [status, setStatus] = useState<TokenStatus>("checking");
  const [kind, setKind] = useState<Kind>(null);

  // Campos
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validar token al montar
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/collaborator-invites?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (cancelled) return;
        if (res.status === 404 || data.reason === "not_found") return setStatus("not_found");
        if (data.reason === "expired") return setStatus("expired");
        if (data.reason === "already_used") return setStatus("used");
        if (data.valid) return setStatus("valid");
        setStatus("error");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("La imagen no puede pesar más de 15MB");
      return;
    }
    setError(null);
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const resetFormFields = () => {
    setName(""); setRole(""); setPhone("");
    setPhoto(null); setPhotoPreview(null);
    setConsent(false); setError(null);
  };

  const handleBack = () => {
    resetFormFields();
    setKind(null);
  };

  const handleSubmit = async () => {
    if (!kind) return;
    if (!name.trim()) {
      return setError(kind === "brand" ? "Falta el nombre de la marca" : "Falta el nombre artístico");
    }
    if (!photo) {
      return setError(kind === "brand" ? "Falta el logo" : "Falta la foto");
    }
    if (kind === "person" && !consent) {
      return setError("Debes aceptar el consentimiento");
    }

    setSubmitting(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("token", token);
      fd.append("kind", kind);
      fd.append("artist_name", name.trim());
      fd.append("photo", photo);

      if (kind === "person") {
        if (role.trim()) fd.append("role", role.trim());
        if (phone.trim()) fd.append("phone", phone.trim());
        fd.append("consent_accepted", "true");
        fd.append("consent_text", CONSENT_TEXT);
      }

      const res = await fetch("/api/collaborators", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error desconocido");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al enviar");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Estados de token ────────────────────────────────────────────────

  if (status === "checking") {
    return (
      <CenteredPanel>
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-3" />
        <p className="text-sm text-gray-400">Comprobando enlace…</p>
      </CenteredPanel>
    );
  }

  if (status === "not_found" || status === "error") {
    return (
      <CenteredPanel>
        <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/40 flex items-center justify-center text-red-400 text-xl mb-3">!</div>
        <h2 className="text-lg font-bold text-white mb-1">Enlace no válido</h2>
        <p className="text-sm text-gray-400">Pide al organizador que te envíe un nuevo enlace.</p>
      </CenteredPanel>
    );
  }

  if (status === "expired") {
    return (
      <CenteredPanel>
        <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xl mb-3">⏱</div>
        <h2 className="text-lg font-bold text-white mb-1">Enlace caducado</h2>
        <p className="text-sm text-gray-400">Este enlace expiró. Pide uno nuevo al organizador.</p>
      </CenteredPanel>
    );
  }

  if (status === "used") {
    return (
      <CenteredPanel>
        <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3"><Check size={22} strokeWidth={2.5} /></div>
        <h2 className="text-lg font-bold text-white mb-1">Ya enviaste tus datos</h2>
        <p className="text-sm text-gray-400">Este enlace solo puede usarse una vez.</p>
      </CenteredPanel>
    );
  }

  if (done) {
    return (
      <CenteredPanel>
        <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4"><Check size={26} strokeWidth={2.5} /></div>
        <h2 className="text-xl font-bold text-white mb-2">¡Listo!</h2>
        <p className="text-sm text-gray-400 text-center max-w-sm">
          Tus datos se enviaron correctamente al organizador. Ya puedes cerrar esta página.
        </p>
      </CenteredPanel>
    );
  }

  // ─── Paso inicial: selector de tipo ──────────────────────────────────
  if (!kind) {
    return (
      <div className="min-h-screen bg-[#0a0a18] text-white py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-4">
              <Sparkles size={12} strokeWidth={2} />
              ArteGenIA
            </div>
            <h1 className="text-2xl font-black mb-2">Bienvenido</h1>
            <p className="text-sm text-gray-400">
              Antes de empezar, dinos quién eres
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => setKind("person")}
              className="group rounded-2xl p-6 text-left transition-all hover:scale-[1.02]"
              style={{
                background: "rgba(15,15,25,0.95)",
                border: "1px solid rgba(168,85,247,0.30)",
                boxShadow: "0 0 30px rgba(168,85,247,0.10)",
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0 group-hover:bg-purple-500/25 transition-colors">
                  <User size={22} strokeWidth={1.8} />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white mb-0.5">Soy una persona</h3>
                  <p className="text-xs text-gray-500">Artista, DJ, profesor, ponente…</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setKind("brand")}
              className="group rounded-2xl p-6 text-left transition-all hover:scale-[1.02]"
              style={{
                background: "rgba(15,15,25,0.95)",
                border: "1px solid rgba(217,119,6,0.30)",
                boxShadow: "0 0 30px rgba(217,119,6,0.10)",
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0 group-hover:bg-amber-500/25 transition-colors">
                  <Tag size={22} strokeWidth={1.8} />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white mb-0.5">Represento una marca</h3>
                  <p className="text-xs text-gray-500">Patrocinador, empresa colaboradora…</p>
                </div>
              </div>
            </button>
          </div>

          <p className="text-center text-[10px] text-gray-700 mt-6">
            Caduca en 7 días
          </p>
        </div>
      </div>
    );
  }

  // ─── Formulario (persona o marca) ────────────────────────────────────
  const isBrand = kind === "brand";
  const labelImage = isBrand ? "Logo" : "Foto";
  const labelName = isBrand ? "Nombre de la marca" : "Nombre artístico";
  const placeholderName = isBrand ? "Ej: Brand Records" : "Ej: DJ Sofía";
  const headerTitle = isBrand ? "Registra tu marca" : "Comparte tus datos";
  const headerSubtitle = isBrand
    ? "Tu marca aparecerá como colaboradora en los flyers"
    : "Te van a incluir en flyers de eventos. Rellena estos datos una sola vez.";

  return (
    <div className="min-h-screen bg-[#0a0a18] text-white py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-4">
            <Sparkles size={12} strokeWidth={2} />
            ArteGenIA
          </div>
          <h1 className="text-2xl font-black mb-2">{headerTitle}</h1>
          <p className="text-sm text-gray-400">{headerSubtitle}</p>
        </div>

        {/* Botón Atrás */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={14} strokeWidth={2} />
          Cambiar tipo
        </button>

        {/* Card formulario */}
        <div
          className="rounded-3xl p-6 space-y-5"
          style={{
            background: "rgba(15,15,25,0.95)",
            border: isBrand
              ? "1px solid rgba(217,119,6,0.30)"
              : "1px solid rgba(168,85,247,0.30)",
            boxShadow: isBrand
              ? "0 0 60px rgba(217,119,6,0.15)"
              : "0 0 60px rgba(168,85,247,0.15)",
          }}
        >
          {/* Imagen (foto / logo) */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2">
              {labelImage} <span className="text-red-400">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-square max-h-48 rounded-2xl border-2 border-dashed border-white/15 hover:border-purple-500/50 hover:bg-white/[0.02] transition-all flex flex-col items-center justify-center gap-2 overflow-hidden relative"
            >
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <>
                  <Camera size={28} strokeWidth={1.5} className="text-gray-500" />
                  <p className="text-xs text-gray-500">Toca para añadir {isBrand ? "logo" : "foto"}</p>
                  <p className="text-[10px] text-gray-700">JPG, PNG · Máx 15MB</p>
                </>
              )}
            </button>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2">
              {labelName} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={placeholderName}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/40 transition-colors"
            />
          </div>

          {/* Campos solo persona */}
          {!isBrand && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">
                  Rol <span className="text-gray-600 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder="Ej: DJ, Profesor, Speaker"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/40 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">
                  Teléfono <span className="text-gray-600 font-normal">(opcional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+34 600 000 000"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/40 transition-colors"
                />
              </div>

              <label className="flex gap-3 items-start cursor-pointer p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-purple-500/30 transition-colors">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={e => setConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-purple-500 cursor-pointer shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <ShieldCheck size={13} className="text-purple-400" />
                    <span className="text-xs font-semibold text-white">Consentimiento de uso de imagen</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">{CONSENT_TEXT}</p>
                </div>
              </label>
            </>
          )}

          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={
              submitting
              || !name.trim()
              || !photo
              || (kind === "person" && !consent)
            }
            className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background: isBrand
                ? "linear-gradient(135deg, #d97706, #f59e0b, #fbbf24)"
                : "linear-gradient(135deg, #7c3aed, #c026d3, #d97706)",
              boxShadow: isBrand
                ? "0 0 25px rgba(217,119,6,0.40)"
                : "0 0 25px rgba(168,85,247,0.40)",
            }}
          >
            {submitting ? "Enviando…" : (isBrand ? "Registrar marca" : "Enviar mis datos")}
          </button>
        </div>

        <p className="text-center text-[10px] text-gray-700 mt-6">
          {kind === "person" ? "Tus datos están protegidos · " : ""}Caduca en 7 días
        </p>
      </div>
    </div>
  );
}

function CenteredPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a18] p-4">
      <div
        className="w-full max-w-sm rounded-3xl p-8 flex flex-col items-center text-center"
        style={{
          background: "rgba(15,15,25,0.95)",
          border: "1px solid rgba(168,85,247,0.30)",
          boxShadow: "0 0 60px rgba(168,85,247,0.15)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
