"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";

/* ── Icons ─────────────────────────────────────────────── */
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="white" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3.5V11c0 4.418-3.134 8.223-7 9.5C8.134 19.223 5 15.418 5 11V6.5L12 3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
  </svg>
);
const EyeIcon = ({ open }) =>
  open ? (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.94 17.94A10.94 10.94 0 0112 19c-7 0-11-7-11-7a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 7 11 7a18.5 18.5 0 01-2.16 3.19M1 1l22 22" />
    </svg>
  );
const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="#9CA3AF" strokeWidth={2}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);
const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="#9CA3AF" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const DocIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="white" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

/* ── Alert Modal ────────────────────────────────────────── */
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
      <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 px-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-sm rounded-2xl p-4 shadow-2xl flex items-start gap-3"
          style={{ background: v.bg, border: `1px solid ${v.border}`, backdropFilter: "blur(8px)", animation: "slideDown 0.25s ease-out" }}
        >
          {icons[type]}
          <p className="flex-1 text-sm font-medium leading-relaxed" style={{ color: v.color }}>{message}</p>
          <button onClick={onClose} className="shrink-0 hover:opacity-60 transition-opacity" style={{ color: v.color }} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2.5}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
      <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </>
  );
}

/* ── Auth Navbar ────────────────────────────────────────── */
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
      <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#2563EB] transition-colors">
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7"/></svg>
        <span className="hidden sm:block">Volver al inicio</span>
        <span className="sm:hidden">Inicio</span>
      </Link>
    </nav>
  );
}

/* ── Auth Footer ────────────────────────────────────────── */
function AuthFooter() {
  return (
    <footer className="py-6 border-t border-blue-50 text-center px-4">
      <p className="text-xs text-slate-400">© 2025 SmartDocs · Gestión inteligente de documentos personales</p>
      <p className="text-xs text-slate-300 mt-1">Tu información protegida con cifrado de extremo a extremo </p>
    </footer>
  );
}

/* ── Field ──────────────────────────────────────────────── */
function Field({ id, label, type, value, onChange, placeholder, icon, rightSlot, disabled }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[#374151] mb-1.5">{label}</label>
      <div
        className={`flex items-center gap-3 rounded-[12px] border px-4 py-3 transition-all duration-200 ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        style={{ borderColor: focused ? "#3B82F6" : "#BFDBFE", boxShadow: focused ? "0 0 0 3px rgba(191,219,254,0.6)" : "none", background: "rgba(255,255,255,0.55)" }}
      >
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

/* ── LoginPage ──────────────────────────────────────────── */
export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [modal, setModal]       = useState(null); // { type, message }
  const router = useRouter();

  const closeModal = () => setModal(null);

  const handleResetPassword = async () => {
    if (!email) {
      setModal({ type: "warning", message: "Ingresa tu correo electrónico para recuperar la contraseña." });
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "http://192.168.56.1:3000/update-password",
      });
      if (error) throw error;
      setModal({ type: "info", message: "Se envio un link a tu correo para restablecer tu contraseña." });
    } catch (err) {
      setModal({ type: "error", message: err.message || "Error al enviar el correo." });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setModal(null);
    if (!email || !password) {
      setModal({ type: "warning", message: "Por favor completa todos los campos." });
      return;
    }
    try {
      setLoading(true);
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw new Error("Credenciales inválidas.");
      if (authData?.user) {
        const userRole = authData.user.app_metadata?.rol || "usuario";
        await supabase.from("usuarios").update({ estado: "activo", ultimo_acceso: new Date().toISOString() }).eq("id", authData.user.id);
        router.push(userRole === "admin" ? "/admin" : "/usuario");
      }
    } catch (err) {
      setModal({ type: "error", message: err?.message || "Ocurrió un error al iniciar sesión." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 50%, #EFF6FF 100%)" }}>
      <AuthNavbar pageTitle="Inicio de Sesión" />
      {modal && <AlertModal type={modal.type} message={modal.message} onClose={closeModal} />}

      <main className="flex-1 flex items-center justify-center p-4 relative">
        {/* Blobs decorativos */}
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #3B82F6, transparent 70%)" }} />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #60A5FA, transparent 70%)" }} />
        </div>

        <div className="relative w-full max-w-lg rounded-[24px] border overflow-hidden"
          style={{ background: "rgba(255,255,255,0.72)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderColor: "#BFDBFE", boxShadow: "0 12px 48px rgba(59,130,246,0.14), 0 2px 8px rgba(59,130,246,0.06)" }}>
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #2563EB, #60A5FA, #2563EB)" }} />

          <div className="p-8">
            {/* Logo + marca */}
            <div className="flex items-center gap-3 mb-7">
              <div className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #1D4ED8, #3B82F6)" }}>
                <ShieldIcon />
              </div>
              <div>
                <span className="text-xl font-bold leading-none" style={{ background: "linear-gradient(90deg, #1D4ED8, #60A5FA)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
                  SmartDocs
                </span>
                <p className="text-[11px] text-[#6B7280] mt-0.5 tracking-wide uppercase font-medium">Panel de Inicio de Sesión</p>
              </div>
            </div>

            <h1 className="text-[1.75rem] font-bold text-[#1F2937] leading-tight">Acceso al Sistema</h1>
            <p className="mt-1 text-sm text-[#6B7280]">Ingresa tus credenciales para continuar</p>

            <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
              <Field id="email" label="Correo Electrónico" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" icon={<MailIcon />} disabled={loading} />
              <Field
                id="password" label="Contraseña" type={showPwd ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" icon={<LockIcon />} disabled={loading}
                rightSlot={
                  <button type="button" onClick={() => setShowPwd((v) => !v)} className="text-[#9CA3AF] hover:text-[#3B82F6] transition-colors" disabled={loading}>
                    <EyeIcon open={showPwd} />
                  </button>
                }
              />

              <div className="flex justify-end">
                <button type="button" onClick={handleResetPassword} className="text-xs text-[#3B82F6] hover:text-[#1D4ED8] hover:underline">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button type="submit" disabled={loading}
                className="w-full rounded-[12px] py-3 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                style={{ background: loading ? "#93C5FD" : "linear-gradient(90deg, #1D4ED8, #3B82F6)", boxShadow: loading ? "none" : "0 6px 20px rgba(37,99,235,0.35)" }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                    Verificando...
                  </span>
                ) : "Ingresar al Panel"}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-[#E5E7EB]" />
              <span className="text-xs text-[#9CA3AF]">o</span>
              <div className="flex-1 h-px bg-[#E5E7EB]" />
            </div>

            <p className="text-center text-sm text-[#4B5563]">
              ¿No tienes cuenta?{" "}
              <Link href="/registro" className="text-[#2563EB] font-medium hover:text-[#1D4ED8] hover:underline underline-offset-2 transition-colors">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </main>

      <AuthFooter />
    </div>
  );
}