"use client";

/**
 * /cuenta — Configuración de cuenta del usuario.
 *
 * Permite editar:
 *  - Nombre visible
 *  - Teléfono (E.164, ej. +34611111111)
 *  - Preferencias de notificación por canal (email/whatsapp) y evento
 *    (foto recibida, créditos bajos, novedades)
 *
 * El email NO es editable aquí — cambiarlo requeriría flow de
 * re-verificación que aún no está implementado.
 *
 * La integración WhatsApp aún no está viva en producción. Los toggles de
 * whatsapp se muestran pero con una nota explicando que se activarán
 * cuando habilitemos el canal y el usuario verifique su número.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Save, User as UserIcon, Mail, Bell, MessageCircle, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/lib/toast";
import PhoneVerification from "@/components/account/PhoneVerification";

type NotificationPrefs = {
  email: { foto_recibida: boolean; creditos_bajos: boolean; novedades: boolean };
  whatsapp: { foto_recibida: boolean; creditos_bajos: boolean };
};

type Account = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  phone_verified_at: string | null;
  notification_prefs: NotificationPrefs;
  plan: string | null;
};

export default function CuentaPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state — espejo editable del account state.
  // El teléfono ya NO va aquí: lo gestiona PhoneVerification, que guarda
  // directamente en profiles vía /api/account/phone/verify-otp tras OTP.
  const [name, setName] = useState("");
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    email: { foto_recibida: true, creditos_bajos: true, novedades: false },
    whatsapp: { foto_recibida: false, creditos_bajos: false },
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    (async () => {
      try {
        const res = await fetch("/api/account");
        if (!res.ok) throw new Error("No se pudo cargar tu cuenta");
        const data = (await res.json()) as Account;
        setAccount(data);
        setName(data.name ?? "");
        setPrefs(data.notification_prefs);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    })();
    // Deps ESTABLES: solo cargamos al resolver auth / cambiar de usuario. NO
    // incluir `toast` — useToast() devuelve un objeto NUEVO en cada render, así
    // que tenerlo en deps re-ejecutaba este efecto en cada render → re-fetch →
    // setName(data.name) sobrescribía lo que el usuario estaba escribiendo
    // ("no me deja editar").
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          notification_prefs: prefs,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");
      toast.success("Cambios guardados");
      if (account) {
        setAccount({
          ...account,
          name: name.trim(),
          notification_prefs: prefs,
        });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <Lock size={32} className="text-gray-500 mb-4" />
        <h1 className="text-2xl font-black mb-2" style={{ color: "var(--home-text)" }}>
          Inicia sesión para ver tu cuenta
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Configura tu nombre, teléfono y preferencias de notificación.
        </p>
        <Link
          href="/auth?next=/cuenta"
          className="px-6 py-3 rounded-full font-bold text-white"
          style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)" }}
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-black mb-2" style={{ color: "var(--home-text)" }}>
          Mi cuenta
        </h1>
        <p className="text-sm text-gray-500">
          Configura tu perfil y cómo quieres recibir las notificaciones.
        </p>
      </header>

      {/* ── Bloque 1: Perfil ───────────────────────────────────────────── */}
      <section className="mb-8 p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <h2 className="text-sm font-black uppercase tracking-widest text-purple-300 mb-4 flex items-center gap-2">
          <UserIcon size={14} /> Perfil
        </h2>

        <label className="block mb-4">
          <span className="text-xs text-gray-400 mb-1.5 block">Nombre visible</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="Tu nombre o nombre de marca"
            className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white focus:border-purple-500/50 focus:outline-none"
          />
        </label>

        <label className="block mb-4">
          <span className="text-xs text-gray-400 mb-1.5 block flex items-center gap-1.5">
            <Mail size={12} /> Email
          </span>
          <input
            type="email"
            value={account?.email ?? ""}
            disabled
            className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/[0.02] border border-white/[0.05] text-gray-500 cursor-not-allowed"
          />
          <p className="text-[10px] text-gray-500 mt-1">El email se gestiona desde tu proveedor de login.</p>
        </label>

        <PhoneVerification
          initialPhone={account?.phone ?? null}
          initialVerifiedAt={account?.phone_verified_at ?? null}
          onVerified={(verifiedPhone) => {
            if (account) {
              setAccount({
                ...account,
                phone: verifiedPhone,
                phone_verified_at: new Date().toISOString(),
              });
            }
          }}
        />
      </section>

      {/* ── Bloque 2: Notificaciones por email ─────────────────────────── */}
      <section className="mb-8 p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <h2 className="text-sm font-black uppercase tracking-widest text-purple-300 mb-1 flex items-center gap-2">
          <Mail size={14} /> Por email
        </h2>
        <p className="text-xs text-gray-500 mb-4">Avisos que llegan a tu bandeja de entrada.</p>

        <NotifToggle
          label="Foto recibida de un colaborador"
          desc="Cuando un DJ/artista sube la foto que le pediste."
          checked={prefs.email.foto_recibida}
          onChange={(v) => setPrefs({ ...prefs, email: { ...prefs.email, foto_recibida: v } })}
        />
        <NotifToggle
          label="Créditos bajos"
          desc="Cuando te quedan menos de un 20% del balance mensual."
          checked={prefs.email.creditos_bajos}
          onChange={(v) => setPrefs({ ...prefs, email: { ...prefs.email, creditos_bajos: v } })}
        />
        <NotifToggle
          label="Novedades de ArteGenIA"
          desc="Nuevas plantillas, features, descuentos puntuales. Máximo 1 al mes."
          checked={prefs.email.novedades}
          onChange={(v) => setPrefs({ ...prefs, email: { ...prefs.email, novedades: v } })}
        />
      </section>

      {/* ── Bloque 3: Notificaciones por WhatsApp ──────────────────────── */}
      <section className="mb-8 p-5 rounded-2xl" style={{ background: "rgba(37,211,102,0.04)", border: "1px solid rgba(37,211,102,0.20)" }}>
        <h2 className="text-sm font-black uppercase tracking-widest text-emerald-300 mb-1 flex items-center gap-2">
          <MessageCircle size={14} /> Por WhatsApp
        </h2>
        <p className="text-xs text-gray-500 mb-4">Avisos al WhatsApp verificado. Más rápidos que el email.</p>

        <NotifToggle
          label="Foto recibida de un colaborador"
          desc="Notificación inmediata al subir la foto. Más rápido que el email."
          checked={prefs.whatsapp.foto_recibida}
          onChange={(v) => setPrefs({ ...prefs, whatsapp: { ...prefs.whatsapp, foto_recibida: v } })}
          disabled={!account?.phone_verified_at}
          disabledReason="Verifica tu teléfono arriba para activar WhatsApp"
        />
        <NotifToggle
          label="Créditos bajos"
          desc="Aviso inmediato cuando estés a punto de quedarte sin créditos."
          checked={prefs.whatsapp.creditos_bajos}
          onChange={(v) => setPrefs({ ...prefs, whatsapp: { ...prefs.whatsapp, creditos_bajos: v } })}
          disabled={!account?.phone_verified_at}
          disabledReason="Verifica tu teléfono arriba para activar WhatsApp"
        />
      </section>

      {/* ── Botón guardar (sticky bottom en mobile, inline en desktop) ──── */}
      <div className="sticky bottom-4 sm:static">
        <button
          onClick={save}
          disabled={saving}
          className="w-full py-3.5 rounded-2xl font-black text-white shadow-2xl shadow-purple-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)" }}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}

function NotifToggle({
  label,
  desc,
  checked,
  onChange,
  disabled,
  disabledReason,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  disabledReason?: string;
}) {
  return (
    <label
      className={`flex items-start justify-between gap-3 py-3 border-b border-white/[0.05] last:border-b-0 ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
      title={disabled ? disabledReason : undefined}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white flex items-center gap-1.5">
          <Bell size={11} className="text-gray-500" />
          {label}
        </p>
        <p className="text-[11px] text-gray-500 mt-0.5">{desc}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="mt-1 w-5 h-5 rounded accent-purple-500 cursor-pointer"
      />
    </label>
  );
}
