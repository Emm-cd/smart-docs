"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

const DocIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="white" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
  </svg>
);
const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="#9CA3AF" strokeWidth={2}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);
const EyeIcon = ({ open }) =>
  open ? (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.94 17.94A10.94 10.94 0 0112 19c-7 0-11-7-11-7a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 7 11 7a18.5 18.5 0 01-2.16 3.19M1 1l22 22"/>
    </svg>
  );
const KeyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="white" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
);

function AlertModal({ type = "error", message, onClose }) {
  const v = {
    error:   { color: "#DC2626", bg: "rgba(254,226,226,0.97)", border: "#FECACA" },
    warning: { color: "#D97706", bg: "rgba(255,251,235,0.97)", border: "#FDE68A" },
    success: { color: "#16A34A", bg: "rgba(220,252,231,0.97)", border: "#86EFAC" },
    info:    { color: "#2563EB", bg: "rgba(219,234,254,0.97)", border: "#BFDBFE" },
  }[type] || { color: "#DC2626", bg: "rgba(254,226,226,0.97)", border: "#FECACA" };
  const icons = {
    error:   <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0" stroke={v.color} strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    warning: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0" stroke={v.color} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    success: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0" stroke={v.color} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    info:    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0" stroke={v.color} strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  };
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]" onClick={onClose}/>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 px-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-sm rounded-2xl p-4 shadow-2xl flex items-start gap-3"
          style={{ background: v.bg, border: `1px solid ${v.border}`, backdropFilter: "blur(8px)", animation: "slideDown 0.25s ease-out" }}>
          {icons[type]}
          <p className="flex-1 text-sm font-medium leading-relaxed" style={{ color: v.color }}>{message}</p>
          <button onClick={onClose} className="shrink-0 hover:opacity-60 transition-opacity" style={{ color: v.color }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2.5}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    </>
  );
}

function AuthNavbar({ pageTitle }) {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-lg border-b border-blue-50 sticky top-0 z-30">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-[#2563EB] rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
          <DocIcon />
        </div>
        <span className="text-lg font-bold text-[#1E293B]">SmartDocs</span>
        {pageTitle && (
          <>
            <span className="text-slate-300 text-sm hidden sm:block">·</span>
            <span className="text-sm font-medium text-slate-500 hidden sm:block">{pageTitle}</span>
          </>
        )}
      </div>
      <Link href="/login" className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#2563EB] transition-colors">
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7"/></svg>
        <span className="hidden sm:block">Volver al login</span>
        <span className="sm:hidden">Login</span>
      </Link>
    </nav>
  );
}

function AuthFooter() {
  return (
    <footer className="py-6 border-t border-blue-50 text-center px-4">
      <p className="text-xs text-slate-400">© 2025 SmartDocs · Gestión inteligente de documentos personales</p>
      <p className="text-xs text-slate-300 mt-1">Tu información protegida con cifrado de extremo a extremo 🔒</p>
    </footer>
  );
}

function Field({ id, label, type, value, onChange, placeholder, icon, rightSlot, disabled }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[#374151] mb-1.5">{label}</label>
      <div
        className={`flex items-center gap-3 rounded-[12px] border px-4 py-3 transition-all duration-200 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        style={{ borderColor: focused ? "#3B82F6" : "#BFDBFE", boxShadow: focused ? "0 0 0 3px rgba(191,219,254,0.6)" : "none", background: "rgba(255,255,255,0.55)" }}>
        {icon}
        <input
          id={id} type={type} value={value} onChange={onChange} required disabled={disabled}
          placeholder={placeholder} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent text-[#1F2937] placeholder:text-[#9CA3AF] focus:outline-none text-sm disabled:cursor-not-allowed"
        />
        {rightSlot}
      </div>
    </div>
  );
}

export default function UpdatePassword() {
  const supabase = createClient();
  const router   = useRouter();

  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [modal,    setModal]    = useState(null);

  // ── ESTADOS DE SESIÓN ─────────────────────────────────────────────────────
  // "checking" → aún esperando que Supabase procese el code/token del link
  // "ready"    → sesión de recuperación lista, el usuario puede actualizar
  // "blocked"  → link inválido/expirado
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    /**
     * FIX: NO llamar exchangeCodeForSession() manualmente.
     *
     * El cliente Supabase JS v2 con PKCE detecta el ?code= automáticamente
     * al inicializarse (detectSessionInUrl: true por defecto). Si el AuthProvider
     * ya está montado cuando llega este componente, el code ya fue canjeado,
     * y una segunda llamada a exchangeCodeForSession() siempre falla.
     *
     * La solución correcta es escuchar onAuthStateChange:
     *   - PASSWORD_RECOVERY → Supabase procesó el link de recuperación 
     *   - SIGNED_IN         → también válido en algunos flujos PKCE
     *
     * Si después de un tiempo razonable no llega ningún evento con sesión,
     * marcamos como bloqueado (link inválido/expirado).
     */

    let timeoutId;

    // 1. Verificar si ya hay una sesión activa al montar
    //    (puede ocurrir si el código fue procesado antes de que este
    //     componente terminara de montarse)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus("ready");
        clearTimeout(timeoutId);
      }
    });

    // 2. Escuchar eventos de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") &&
        session
      ) {
        setStatus("ready");
        clearTimeout(timeoutId);
      }
    });

    // 3. Si en 6 segundos no hay sesión, el link está expirado/inválido
    timeoutId = setTimeout(() => {
      setStatus(prev => {
        if (prev === "checking") {
          setModal({
            type: "error",
            message: "El enlace ha expirado o ya fue utilizado. Por favor solicita uno nuevo desde la pantalla de login.",
          });
          return "blocked";
        }
        return prev;
      });
    }, 6000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdate = async (e) => {
    e.preventDefault();
    setModal(null);

    if (!password || password.length < 6) {
      setModal({ type: "warning", message: "La contraseña debe tener al menos 6 caracteres." });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setModal({ type: "success", message: "¡Contraseña actualizada correctamente! Redirigiendo al login..." });
      // FIX: cerrar sesión activa antes de redirigir — sin esto Supabase
      // mantiene la sesión del flujo de recuperación y el AuthProvider
      // redirige al dashboard automáticamente en lugar de pedir credenciales.
      await supabase.auth.signOut();
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setModal({ type: "error", message: err.message || "Ocurrió un error al actualizar la contraseña." });
    } finally {
      setLoading(false);
    }
  };

  const isBlocked  = status === "blocked";
  const isChecking = status === "checking";
  const isDisabled = loading || isBlocked || isChecking;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 50%, #EFF6FF 100%)" }}>
      <AuthNavbar pageTitle="Restablecer Contraseña" />
      {modal && <AlertModal type={modal.type} message={modal.message} onClose={() => setModal(null)} />}

      <main className="flex-1 flex items-center justify-center p-4 relative">
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #3B82F6, transparent 70%)" }}/>
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #60A5FA, transparent 70%)" }}/>
        </div>

        <div className="relative w-full max-w-lg rounded-[24px] border overflow-hidden"
          style={{ background: "rgba(255,255,255,0.72)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderColor: "#BFDBFE", boxShadow: "0 12px 48px rgba(59,130,246,0.14), 0 2px 8px rgba(59,130,246,0.06)" }}>
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #2563EB, #60A5FA, #2563EB)" }}/>

          <div className="p-8">
            <div className="flex items-center gap-3 mb-7">
              <div className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #1D4ED8, #3B82F6)" }}>
                <KeyIcon />
              </div>
              <div>
                <span className="text-xl font-bold leading-none" style={{ background: "linear-gradient(90deg, #1D4ED8, #60A5FA)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
                  SmartDocs
                </span>
                <p className="text-[11px] text-[#6B7280] mt-0.5 tracking-wide uppercase font-medium">Recuperación de Acceso</p>
              </div>
            </div>

            <h1 className="text-[1.75rem] font-bold text-[#1F2937] leading-tight">Nueva Contraseña</h1>
            <p className="mt-1 text-sm text-[#6B7280] mb-7">Elige una contraseña segura de al menos 6 caracteres.</p>

            <div className="flex gap-3 mb-7">
              {[
                { icon: "🔒", label: "Mínimo 6 caracteres" },
                { icon: "🔑", label: "Cifrado seguro" },
              ].map((item, i) => (
                <div key={i} className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-blue-700"
                  style={{ background: "rgba(239,246,255,0.8)", border: "1px solid #BFDBFE" }}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Estado: verificando sesión */}
            {isChecking && (
              <div className="mb-6 rounded-[12px] px-4 py-3 text-sm flex items-center gap-3"
                style={{ background: "rgba(219,234,254,0.7)", border: "1px solid #BFDBFE" }}>
                <svg className="animate-spin w-5 h-5 shrink-0 text-blue-600" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
                <p className="text-blue-700 font-medium text-sm">Verificando enlace de recuperación…</p>
              </div>
            )}

            {/* Estado: bloqueado */}
            {isBlocked && (
              <div className="mb-6 rounded-[12px] px-4 py-3 text-sm flex items-start gap-3"
                style={{ background: "rgba(254,226,226,0.7)", border: "1px solid #FECACA" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0 mt-0.5 text-red-600" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <div>
                  <p className="font-semibold text-red-700 text-sm">Enlace inválido o expirado</p>
                  <p className="text-red-600 text-xs mt-0.5">Vuelve al login y solicita un nuevo correo de recuperación.</p>
                  <Link href="/login" className="text-xs font-bold text-red-700 underline underline-offset-2 mt-1 inline-block">
                    Ir al Login →
                  </Link>
                </div>
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4">
              <Field
                id="password" label="Nueva Contraseña"
                type={showPwd ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" icon={<LockIcon />}
                disabled={isDisabled}
                rightSlot={
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="text-[#9CA3AF] hover:text-[#3B82F6] transition-colors" disabled={isDisabled}>
                    <EyeIcon open={showPwd} />
                  </button>
                }
              />

              <button type="submit" disabled={isDisabled}
                className="w-full rounded-[12px] py-3 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: isDisabled ? "#93C5FD" : "linear-gradient(90deg, #1D4ED8, #3B82F6)", boxShadow: isDisabled ? "none" : "0 6px 20px rgba(37,99,235,0.35)" }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                    Actualizando...
                  </span>
                ) : isChecking ? "Verificando enlace…" : "Actualizar Contraseña"}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-[#E5E7EB]" />
              <span className="text-xs text-[#9CA3AF]">o</span>
              <div className="flex-1 h-px bg-[#E5E7EB]" />
            </div>

            <p className="text-center text-sm text-[#4B5563]">
              ¿Recordaste tu contraseña?{" "}
              <Link href="/login" className="text-[#2563EB] font-medium hover:text-[#1D4ED8] hover:underline underline-offset-2 transition-colors">
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </main>

      <AuthFooter />
      <style>{`
        @keyframes slideDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}