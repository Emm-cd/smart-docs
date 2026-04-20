import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white/70 backdrop-blur-lg sticky top-0 z-50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-[#2563EB] rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-[#1E293B]">SmartDocs</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
          <a href="#servicios" className="hover:text-blue-600 transition-colors">Servicios</a>
          <a href="#vision" className="hover:text-blue-600 transition-colors">Visión</a>
          <a href="#tecnologia" className="hover:text-blue-600 transition-colors">Tecnología</a>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-all">
            Iniciar sesión
          </Link>
          <Link href="/registro" className="px-5 py-2.5 bg-[#2563EB] text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md">
            Registro
          </Link>
        </div>
      </nav>

      <main>
        {/* HERO — FIX: reducido pt-12→pt-6 y lg:pt-24→lg:pt-14 */}
        <section className="relative pt-2 pb-16 lg:pt-8 lg:pb-24 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">IA + OCR integrados</span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-black text-[#0F172A] leading-[1.05] mb-6">
                Tus documentos,{' '}
                <span className="text-[#2563EB]">organizados por IA.</span>
              </h1>
              <p className="text-lg text-slate-500 mb-10 max-w-lg leading-relaxed">
                SmartDocs centraliza, lee y analiza tu documentación oficial de forma automática. Identifica vencimientos, resuelve dudas con un chatbot inteligente y mantén todo seguro en la nube.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/registro" className="px-8 py-4 bg-[#1E293B] text-white font-bold rounded-2xl hover:scale-105 transition-transform text-center">
                  Empezar gratis
                </Link>
                <a href="#servicios" className="px-8 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-sm text-center">
                  Ver servicios
                </a>
              </div>
            </div>

            {/* Mock UI */}
            <div className="relative">
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-400/10 blur-[100px] rounded-full"></div>
              <div className="relative bg-white border border-slate-100 rounded-[2rem] shadow-2xl p-3 transform lg:rotate-3">
                <div className="bg-[#F8FAFC] rounded-[1.5rem] overflow-hidden border border-slate-50">
                  <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                    </div>
                    <div className="h-4 w-24 bg-slate-100 rounded-full"></div>
                  </div>
                  <div className="p-8">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Documentos analizados</p>
                    <h2 className="text-4xl font-black text-[#1E293B]">3 archivos</h2>
                    <div className="mt-4 mb-6 flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full">⚠ 1 próximo a vencer</span>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full">✓ 2 vigentes</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-slate-100">
                        <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-xs font-bold">ID</div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">INE / Identificación</p>
                          <p className="text-[10px] text-slate-400">Vence: 12/2027</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-amber-100">
                        <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 text-xs font-bold">CF</div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">Constancia Fiscal</p>
                          <p className="text-[10px] text-amber-500">Vence: 06/2025 · Renovar pronto</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SERVICIOS */}
        <section id="servicios" className="py-24 bg-white border-t border-slate-50">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-extrabold text-[#1E293B] mb-4">Todo lo que SmartDocs hace por ti</h2>
            <p className="text-slate-500 mb-16 max-w-xl mx-auto text-sm leading-relaxed">
              Olvídate de buscar documentos a mano. Nuestra plataforma lee, organiza y te avisa de forma automática.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: '🔍',
                  title: 'OCR Inteligente',
                  desc: 'Sube una foto o PDF de tu documento y la IA extrae automáticamente los datos relevantes: nombre, fecha de vencimiento, número de folio y más.',
                },
                {
                  icon: '🤖',
                  title: 'Chatbot de Consulta',
                  desc: 'Pregunta sobre tus documentos en lenguaje natural. "¿Cuándo vence mi pasaporte?" y el chatbot responde al instante con tu información.',
                },
                {
                  icon: '🔔',
                  title: 'Alertas de Vencimiento',
                  desc: 'Recibe notificaciones anticipadas cuando alguno de tus documentos esté próximo a vencer, para renovarlo a tiempo sin sorpresas.',
                },
              ].map((item, i) => (
                <div key={i} className="group p-8 rounded-3xl bg-[#F8FAFC] hover:bg-white border border-transparent hover:border-blue-100 hover:shadow-xl transition-all duration-300">
                  <div className="text-4xl mb-6">{item.icon}</div>
                  <h3 className="text-xl font-bold text-[#1E293B] mb-4">{item.title}</h3>
                  <p className="text-slate-500 leading-relaxed text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* VISIÓN */}
        <section id="vision" className="py-24 bg-[#F8FAFC] border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-extrabold text-[#1E293B] mb-4">Visión, Objetivo y Seguridad</h2>
            <p className="text-slate-500 mb-16 max-w-xl mx-auto text-sm leading-relaxed">
              Construimos SmartDocs con un propósito claro: hacer que la gestión documental sea simple, inteligente y completamente segura.
            </p>
            <div className="grid md:grid-cols-3 gap-12">
              {[
                { title: 'Visión',    icon: '🎯', desc: 'Ser la plataforma líder en gestión inteligente de documentos personales en Latinoamérica, transformando cómo las personas cuidan su identidad digital.' },
                { title: 'Objetivo', icon: '⚡', desc: 'Centralizar y automatizar la administración de documentación oficial, eliminando la pérdida de tiempo y los riesgos de perder un trámite por descuido.' },
                { title: 'Seguridad',icon: '🔒', desc: 'Control de acceso robusto, cifrado en tránsito y en reposo. Tu información personal e identificaciones están protegidas desde el diseño hasta producción.' },
              ].map((item, i) => (
                <div key={i} className="group p-8 rounded-3xl bg-white hover:bg-white border border-slate-100 hover:border-blue-100 hover:shadow-xl transition-all duration-300">
                  <div className="text-4xl mb-6">{item.icon}</div>
                  <h3 className="text-xl font-bold text-[#1E293B] mb-4">{item.title}</h3>
                  <p className="text-slate-500 leading-relaxed text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TECH STACK */}
        <section id="tecnologia" className="py-14 bg-white border-t border-slate-100">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Construido con tecnología de última generación</p>
            <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 text-sm font-semibold text-slate-500">
              {[
                { emoji: '⚡', label: 'Next.js' },
                { emoji: '🎨', label: 'Tailwind CSS' },
                { emoji: '🔒', label: 'Supabase' },
                { emoji: '🤖', label: 'APIs de IA' },
                { emoji: '⚙️', label: 'n8n' },
              ].map((tech, i) => (
                <span key={i} className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full hover:border-blue-200 hover:bg-blue-50 transition-all">
                  <span>{tech.emoji}</span>
                  <span>{tech.label}</span>
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-slate-100 text-center text-slate-400 text-xs">
        <p>&copy; 2025 SmartDocs · Gestión inteligente de documentos personales.</p>
      </footer>
    </div>
  );
}