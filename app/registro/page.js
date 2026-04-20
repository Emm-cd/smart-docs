"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { useRouter } from "next/navigation";

const STRENGTH_LABELS = ["", "Débil", "Regular", "Buena", "Fuerte", "Muy fuerte"];
const STRENGTH_COLORS = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"];
const STEP_TITLES = { 1: "Datos personales", 2: "Seguridad", 3: "¡Cuenta creada!" };

const DocIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="white" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
  </svg>
);
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="#9CA3AF" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 21a8 8 0 10-16 0"/>
    <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="#9CA3AF" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const AtIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="#9CA3AF" strokeWidth={2}>
    <circle cx="12" cy="12" r="4"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-3.92 7.94"/>
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
      <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#2563EB] transition-colors">
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7"/></svg>
        <span className="hidden sm:block">Volver al inicio</span>
        <span className="sm:hidden">Inicio</span>
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

function Field({ id, name, label, type, value, onChange, placeholder, icon, rightSlot, disabled, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[#374151] mb-1.5">{label}</label>
      <div
        className={`flex items-center gap-3 rounded-[12px] border px-4 py-3 transition-all duration-200 ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        style={{
          borderColor: error ? "#FCA5A5" : focused ? "#3B82F6" : "#BFDBFE",
          boxShadow: error ? "0 0 0 3px rgba(252,165,165,0.4)" : focused ? "0 0 0 3px rgba(191,219,254,0.6)" : "none",
          background: error ? "rgba(254,242,242,0.5)" : "rgba(255,255,255,0.55)",
        }}>
        {icon}
        <input
          id={id} name={name} type={type} value={value} onChange={onChange}
          required disabled={disabled} placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent text-[#1F2937] placeholder:text-[#9CA3AF] focus:outline-none text-sm disabled:cursor-not-allowed"
        />
        {rightSlot}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
          <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </p>
      )}
    </div>
  );
}

export default function RegistroPage() {
  const supabase = createClient();
  const router   = useRouter();

  const [step, setStep]                         = useState(1);
  const [loading, setLoading]                   = useState(false);
  const [modal, setModal]                       = useState(null);
  const [errors, setErrors]                     = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPwd, setShowPwd]                   = useState(false);
  const [showConfirm, setShowConfirm]           = useState(false);

  const [form, setForm] = useState({
    nombre: "", apellido: "", email: "", username: "",
    password: "", confirmPassword: "",
    aceptaTerminos: false, aceptaVeracidad: false,
  });

  const calcStrength = (pwd) => {
    let s = 0;
    if (pwd.length >= 6) s++;
    if (pwd.length >= 10) s++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) s++;
    if (/\d/.test(pwd)) s++;
    if (/[!@#$%^&*]/.test(pwd)) s++;
    return s;
  };

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    setForm((p) => ({ ...p, [name]: val }));
    if (name === "password") setPasswordStrength(calcStrength(value));
    setErrors((p) => ({ ...p, [name]: "" }));
  }, []);

  const validar = (s) => {
    const e = {};
    if (s === 1) {
      if (!form.nombre.trim())   e.nombre   = "Nombre requerido";
      if (!form.apellido.trim()) e.apellido = "Apellido requerido";
      if (!form.email.trim())    e.email    = "Email requerido";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email inválido";
      if (!form.username.trim()) e.username = "Usuario requerido";
      else if (form.username.includes(" ")) e.username = "Sin espacios";
    }
    if (s === 2) {
      if (!form.password)                e.password = "Contraseña requerida";
      else if (form.password.length < 6) e.password = "Mínimo 6 caracteres";
      if (form.password !== form.confirmPassword) e.confirmPassword = "Las contraseñas no coinciden";
      if (!form.aceptaTerminos)  e.aceptaTerminos  = "Debes aceptar los términos";
      if (!form.aceptaVeracidad) e.aceptaVeracidad = "Confirma la veracidad";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validar(step)) setStep((s) => s + 1); };
  const handlePrev = () => { if (step > 1) setStep((s) => s - 1); };

  // ── FIX PRINCIPAL: signOut después de signUp para no auto-logear al usuario ──
  const handleSubmit = async () => {
    if (!validar(2)) return;
    setLoading(true);
    setModal(null);

    const { error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { nombre: form.nombre, apellido: form.apellido, username: form.username } },
    });

    if (authError) {
      setLoading(false);
      setModal({
        type: "error",
        message: authError.message.includes("already registered")
          ? "Este email ya está registrado. ¿Quieres iniciar sesión?"
          : authError.message,
      });
      return;
    }

    // ⚠️ Cerrar sesión inmediatamente: signUp logea al usuario automáticamente
    // Si no hacemos signOut, cualquier redirect lo mandará al dashboard
    await supabase.auth.signOut();

    setLoading(false);
    setStep(3);
  };

  const stepDot = (num) => {
    const isActive = num === step;
    const isDone   = num < step;
    return (
      <div key={num} className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
          style={{
            background: isDone ? "linear-gradient(135deg,#22c55e,#16a34a)" : isActive ? "linear-gradient(135deg,#1D4ED8,#3B82F6)" : "#EFF6FF",
            color: isDone || isActive ? "white" : "#93C5FD",
            border: `2px solid ${isDone ? "#16a34a" : isActive ? "#1D4ED8" : "#BFDBFE"}`,
            boxShadow: isActive ? "0 4px 12px rgba(37,99,235,0.3)" : "none",
          }}>
          {isDone
            ? <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="white" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>
            : num}
        </div>
        {num < 2 && <div className="w-12 h-0.5 rounded-full" style={{ background: step > num ? "#3B82F6" : "#BFDBFE" }} />}
      </div>
    );
  };

  const renderStep = () => {
    if (step === 1) return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="nombre"   name="nombre"   label="Nombre"   type="text"  value={form.nombre}   onChange={handleChange} placeholder="Juan"  icon={<UserIcon/>} disabled={loading} error={errors.nombre}/>
          <Field id="apellido" name="apellido" label="Apellido" type="text"  value={form.apellido} onChange={handleChange} placeholder="Pérez" icon={<UserIcon/>} disabled={loading} error={errors.apellido}/>
        </div>
        <Field id="email"    name="email"    label="Correo Electrónico" type="email" value={form.email}    onChange={handleChange} placeholder="tu@email.com" icon={<MailIcon/>} disabled={loading} error={errors.email}/>
        <Field id="username" name="username" label="Usuario (@)"        type="text"  value={form.username} onChange={handleChange} placeholder="juanperez"    icon={<AtIcon/>}   disabled={loading} error={errors.username}/>
      </div>
    );

    if (step === 2) return (
      <div className="space-y-4">
        <Field
          id="password" name="password" label="Contraseña"
          type={showPwd ? "text" : "password"} value={form.password}
          onChange={handleChange} placeholder="••••••••" icon={<LockIcon/>}
          disabled={loading} error={errors.password}
          rightSlot={
            <button type="button" onClick={() => setShowPwd(v => !v)} className="text-[#9CA3AF] hover:text-[#3B82F6] transition-colors">
              <EyeIcon open={showPwd}/>
            </button>
          }
        />
        {form.password && (
          <div className="flex items-center gap-3">
            <div className="flex-1 flex gap-1">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex-1 h-1.5 rounded-full transition-all duration-300"
                  style={{ background: i <= passwordStrength ? (STRENGTH_COLORS[passwordStrength] || "#d1d5db") : "#E5E7EB" }}/>
              ))}
            </div>
            <span className="text-xs font-semibold min-w-[65px]" style={{ color: STRENGTH_COLORS[passwordStrength] || "#d1d5db" }}>
              {STRENGTH_LABELS[passwordStrength]}
            </span>
          </div>
        )}
        <Field
          id="confirmPassword" name="confirmPassword" label="Confirmar Contraseña"
          type={showConfirm ? "text" : "password"} value={form.confirmPassword}
          onChange={handleChange} placeholder="••••••••" icon={<LockIcon/>}
          disabled={loading} error={errors.confirmPassword}
          rightSlot={
            <button type="button" onClick={() => setShowConfirm(v => !v)} className="text-[#9CA3AF] hover:text-[#3B82F6] transition-colors">
              <EyeIcon open={showConfirm}/>
            </button>
          }
        />
        <div className="rounded-[12px] border p-4 text-xs text-slate-500 leading-relaxed max-h-28 overflow-y-auto"
          style={{ borderColor: "#BFDBFE", background: "rgba(239,246,255,0.5)" }}>
          <strong className="text-slate-700">Términos y Condiciones</strong>
          <p className="mt-1">Al registrarte en SmartDocs aceptas nuestros términos de servicio y política de privacidad. Nos comprometemos a proteger tus datos de acuerdo con la legislación vigente. No compartiremos tu información con terceros sin tu consentimiento explícito. Tienes derecho a acceder, modificar o eliminar tus datos en cualquier momento.</p>
        </div>
        <div className="space-y-2">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input type="checkbox" name="aceptaTerminos" checked={form.aceptaTerminos} onChange={handleChange}
              className="mt-0.5 w-4 h-4 rounded border-blue-200 accent-blue-600 cursor-pointer shrink-0"/>
            <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">Acepto los términos y condiciones y política de privacidad</span>
          </label>
          {errors.aceptaTerminos && <p className="text-xs text-red-500 pl-7">{errors.aceptaTerminos}</p>}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input type="checkbox" name="aceptaVeracidad" checked={form.aceptaVeracidad} onChange={handleChange}
              className="mt-0.5 w-4 h-4 rounded border-blue-200 accent-blue-600 cursor-pointer shrink-0"/>
            <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">Confirmo que la información proporcionada es verídica y completa</span>
          </label>
          {errors.aceptaVeracidad && <p className="text-xs text-red-500 pl-7">{errors.aceptaVeracidad}</p>}
        </div>
      </div>
    );

    if (step === 3) return (
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", boxShadow: "0 8px 24px rgba(34,197,94,0.25)", animation: "scaleIn 0.5s ease-out" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
          style={{ background: "#dcfce7", border: "1px solid #86efac", color: "#166534" }}>
          ✓ Cuenta creada exitosamente
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#1F2937]">¡Bienvenido, {form.nombre}!</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-xs leading-relaxed">
            Tu cuenta ha sido creada. Activa tu cuenta iniciando sesión para poder disfrutar de nuestros servicios.
          </p>
        </div>
        {/* Aviso importante */}
        <div className="w-full rounded-[12px] px-4 py-3 text-xs text-blue-700 flex items-start gap-2"
          style={{ background: "rgba(219,234,254,0.6)", border: "1px solid #BFDBFE" }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 shrink-0 mt-0.5" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <span>Evita compartir tus credenciales con terceros.</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 50%, #EFF6FF 100%)" }}>
      <AuthNavbar pageTitle="Crear Cuenta" />
      {modal && <AlertModal type={modal.type} message={modal.message} onClose={() => setModal(null)} />}

      <main className="flex-1 flex items-center justify-center p-4 relative">
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #3B82F6, transparent 70%)" }}/>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #60A5FA, transparent 70%)" }}/>
        </div>

        <div className="relative w-full max-w-lg rounded-[24px] border overflow-hidden"
          style={{ background: "rgba(255,255,255,0.72)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderColor: "#BFDBFE", boxShadow: "0 12px 48px rgba(59,130,246,0.14), 0 2px 8px rgba(59,130,246,0.06)", animation: "slideUp 0.4s ease-out" }}>
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #2563EB, #60A5FA, #2563EB)" }}/>

          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #1D4ED8, #3B82F6)" }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="white" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 21a8 8 0 10-16 0"/>
                  <circle cx="12" cy="7" r="4" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <span className="text-xl font-bold leading-none" style={{ background: "linear-gradient(90deg, #1D4ED8, #60A5FA)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
                  SmartDocs
                </span>
                <p className="text-[11px] text-[#6B7280] mt-0.5 tracking-wide uppercase font-medium">
                  {STEP_TITLES[step]}
                </p>
              </div>
            </div>

            <h1 className="text-[1.6rem] font-bold text-[#1F2937] leading-tight">Crear Cuenta</h1>
            <p className="mt-1 text-sm text-[#6B7280] mb-6">
              {step === 1 ? "Ingresa tus datos personales para comenzar"
                : step === 2 ? "Configura tu contraseña y acepta los términos"
                : "Ya puedes iniciar sesión"}
            </p>

            {step !== 3 && (
              <div className="flex items-center mb-7">
                {[1, 2].map(stepDot)}
              </div>
            )}

            {renderStep()}

            {step !== 3 ? (
              <div className="flex gap-3 mt-6">
                <button onClick={handlePrev} disabled={step === 1 || loading}
                  className="flex-1 py-3 rounded-[12px] text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }}>
                  ← Atrás
                </button>
                <button onClick={step === 2 ? handleSubmit : handleNext} disabled={loading}
                  className="flex-1 py-3 rounded-[12px] text-white text-sm font-semibold transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{ background: loading ? "#93C5FD" : "linear-gradient(90deg, #1D4ED8, #3B82F6)", boxShadow: loading ? "none" : "0 6px 20px rgba(37,99,235,0.35)" }}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                      Registrando...
                    </span>
                  ) : step === 2 ? "Crear Cuenta" : "Siguiente →"}
                </button>
              </div>
            ) : (
              <button onClick={() => router.push("/")}
                className="w-full mt-6 py-3 rounded-[12px] text-white text-sm font-semibold transition-all"
                style={{ background: "linear-gradient(90deg, #1D4ED8, #3B82F6)", boxShadow: "0 6px 20px rgba(37,99,235,0.35)" }}>
                Ir a Landing Page →
              </button>
            )}
            <p className="text-center mt-5 text-sm text-[#4B5563]">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-[#2563EB] font-medium hover:text-[#1D4ED8] hover:underline underline-offset-2 transition-colors">
                Iniciar Sesión
              </Link>
            </p>
          </div>
        </div>
      </main>

      <AuthFooter />
      <style>{`
        @keyframes slideUp   { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scaleIn   { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }
      `}</style>
    </div>
  );
}