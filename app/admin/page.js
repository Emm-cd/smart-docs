"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { createClient } from "@/app/lib/supabase/client";
import { Users, FileText, Bot, Ticket } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, AreaChart, Area,
} from "recharts";

const P = {
  users:   { main: "#6366F1", light: "#EEF2FF" },
  docs:    { main: "#0D9488", light: "#F0FDFA" },
  chat:    { main: "#7C3AED", light: "#F5F3FF" },
  tickets: { main: "#EA580C", light: "#FFF7ED" },
};
const ESTADO_COLORS = { activo: "#10B981", pendiente: "#F59E0B", suspendido: "#EF4444" };
const TICKET_ESTADO = { ABIERTO: "#3B82F6", EN_REVISION: "#F59E0B", RESUELTO: "#10B981", CERRADO: "#6B7280" };
const DOC_TYPE_C    = ["#0D9488","#3B82F6","#7C3AED","#F97316","#10B981","#EC4899","#6366F1","#EAB308"];
const TICKET_TIPO_C = ["#6366F1","#EA580C","#EC4899","#10B981","#3B82F6"];

const fmt = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
};
const fmtFull = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
};
const formatBytes = (b) => {
  if (!b) return "0 B";
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(2)} MB`;
};
const agruparPorDia = (arr, campo = "creado_en") => {
  const map = {};
  (arr || []).forEach((r) => {
    const d = fmt(r[campo]);
    if (d && d !== "—") map[d] = (map[d] || 0) + 1;
  });
  return Object.entries(map).slice(-12).map(([dia, total]) => ({ dia, total }));
};
const agruparPor = (arr, campo) => {
  const map = {};
  (arr || []).forEach((r) => {
    const k = (r[campo] || "sin dato").toString().toLowerCase().trim();
    map[k] = (map[k] || 0) + 1;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
};
const calcOcrTiempos = (historial) => {
  const sub = {}, proc = {};
  historial.forEach((h) => {
    if (h.evento === "subido")    sub[h.doc_id]  = new Date(h.creado_en);
    if (h.evento === "procesado") proc[h.doc_id] = new Date(h.creado_en);
  });
  return Object.keys(proc).filter(id => sub[id]).map(id => {
    const diff = Math.round((proc[id] - sub[id]) / 1000);
    return diff > 0 && diff < 600 ? { id, seg: diff, fecha: fmt(proc[id].toISOString()) } : null;
  }).filter(Boolean);
};
const calcDuracion = (chats) =>
  chats.filter(c => c.actualizado_en && c.creado_en).map(c => ({
    id:   c.id,
    seg:  Math.round((new Date(c.actualizado_en) - new Date(c.creado_en)) / 1000),
    msgs: Array.isArray(c.mensajes) ? c.mensajes.length : 0,
    fecha: fmt(c.creado_en),
  }));

const Tip = ({ active, payload, label, accent = "#6366F1" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-lg text-xs">
      {label && <p className="font-semibold text-gray-600 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill || p.stroke || accent }}>
          {p.name || "Total"}: <b>{p.value}</b>
        </p>
      ))}
    </div>
  );
};

function MiniStat({ label, value, color, sub }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-xl border"
      style={{ background: color + "12", borderColor: color + "30" }}>
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
      <div className="min-w-0">
        <span className="text-xs font-medium text-gray-600 block">{label}</span>
        {sub && <span className="text-[10px] text-gray-400">{sub}</span>}
      </div>
      <span className="text-sm font-bold ml-auto" style={{ color }}>{value}</span>
    </div>
  );
}

function KpiCard({ label, value, unit, color, sub }) {
  return (
    <div className="bg-white rounded-2xl border p-4 shadow-sm flex flex-col gap-1"
      style={{ borderColor: color + "30" }}>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black" style={{ color }}>
        {value}<span className="text-sm font-medium text-gray-400 ml-1">{unit}</span>
      </p>
      {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      {title && <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">{title}</p>}
      {children}
    </div>
  );
}

function SimpleTable({ headers, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100">
            {headers.map(h => (
              <th key={h} className="text-left py-2.5 px-3 font-semibold text-gray-400 uppercase tracking-wide text-[11px]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={headers.length} className="py-8 text-center text-gray-400 text-xs">Sin datos disponibles</td></tr>
          ) : rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/60 transition">
              {row.map((cell, j) => <td key={j} className="py-2.5 px-3 text-gray-700">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminDashboard() {
  const supabase = useMemo(() => createClient(), []);

  const [tab,        setTab]        = useState("usuarios");
  const [loading,    setLoading]    = useState(true);
  // ── FIX: fetch usuarios directo en lugar de useUsers() ──────────
  const [usuarios,   setUsuarios]   = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [historial,  setHistorial]  = useState([]);
  const [chats,      setChats]      = useState([]);
  const [tickets,    setTickets]    = useState([]);
  const [storage,    setStorage]    = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [usrRes, docsRes, histRes, chatRes, tickRes, storRes] = await Promise.all([
      // ── usuarios: fetch directo desde la tabla pública ──────────
      supabase
        .from("usuarios")
        .select("id, nombre, apellido, email, username, rol, estado, ultimo_acceso, fecha_registro, almacenamiento_usado, almacenamiento_limite")
        .order("fecha_registro", { ascending: false }),
      supabase
        .from("documentos")
        .select("id, tipo_doc, estado, creado_en, uid_usuario, tamano, vencimiento_estado")
        .is("eliminado_en", null),
      supabase
        .from("historial_documentos")
        .select("id, doc_id, evento, detalle, uid_usuario, creado_en")
        .order("creado_en", { ascending: false })
        .limit(60),
      supabase
        .from("conversaciones")
        .select("id, uid_usuario, mensajes, creado_en, actualizado_en")
        .order("creado_en", { ascending: false }),
      supabase
        .from("tickets")
        .select("id, tipo, tipo_doc, estado, prioridad, creado_en, uid_usuario, archivo_nombre, descripcion")
        .order("creado_en", { ascending: false }),
      supabase
        .from("documentos")
        .select("tamano")
        .is("eliminado_en", null),
    ]);

    if (usrRes.error)  console.error("Error Usuarios:",   usrRes.error.message);
    if (docsRes.error) console.error("Error Documentos:", docsRes.error.message);
    if (histRes.error) console.error("Error Historial:",  histRes.error.message);
    if (chatRes.error) console.error("Error Chats:",      chatRes.error.message);
    if (tickRes.error) console.error("Error Tickets:",    tickRes.error.message);

    setUsuarios(usrRes.data   || []);
    setDocumentos(docsRes.data || []);
    setHistorial(histRes.data  || []);
    setChats(chatRes.data      || []);
    setTickets(tickRes.data    || []);
    setStorage((storRes.data || []).reduce((a, d) => a + (d.tamano || 0), 0));
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Métricas derivadas ────────────────────────────────────────
  const totalMensajes = useMemo(
    () => chats.reduce((a, c) => a + (Array.isArray(c.mensajes) ? c.mensajes.length : 0), 0),
    [chats]
  );
  const ocrTiempos  = useMemo(() => calcOcrTiempos(historial), [historial]);
  const sesiones    = useMemo(() => calcDuracion(chats), [chats]);
  const ocrPromSeg  = ocrTiempos.length
    ? Math.round(ocrTiempos.reduce((a, t) => a + t.seg, 0) / ocrTiempos.length) : 0;
  const durProm     = sesiones.length
    ? Math.round(sesiones.reduce((a, s) => a + s.seg, 0) / sesiones.length) : 0;

  // ── Datos usuarios ────────────────────────────────────────────
  const ahora = new Date();
  const countEstado = (e) =>
    usuarios.filter(u => (u.estado || "").toLowerCase() === e).length;

  const usersByEstado = agruparPor(usuarios, "estado");
  const usersByDia    = agruparPorDia(usuarios, "fecha_registro");
  const activosRecientes = usuarios.filter(u => {
    if (!u.ultimo_acceso) return false;
    return (ahora - new Date(u.ultimo_acceso)) / (1000 * 60 * 60 * 24) <= 30;
  }).length;

  // ── Datos documentos ──────────────────────────────────────────
  const docsByTipo    = agruparPor(documentos, "tipo_doc");
  const docsByDia     = agruparPorDia(documentos, "creado_en");
  const histByEvento  = agruparPor(historial, "evento");
  const STORAGE_LIMIT = 100 * 1024 * 1024;
  const storagePct    = Math.min(Math.round((storage / STORAGE_LIMIT) * 100), 100);
  const storageBarColor = storagePct >= 90 ? "#EF4444" : storagePct >= 70 ? "#F59E0B" : "#0D9488";

  // ── Datos chat ────────────────────────────────────────────────
  const chatsByDia = agruparPorDia(chats, "creado_en");

  // ── Datos tickets ─────────────────────────────────────────────
  const tickByEstado  = agruparPor(tickets, "estado");
  const tickByTipo    = agruparPor(tickets, "tipo");
  const tickByDocTipo = agruparPor(tickets.filter(t => t.tipo_doc), "tipo_doc");

  const cards = [
    { label: "Usuarios",      value: usuarios.length,   icon: Users,    palette: P.users,   tab: "usuarios"   },
    { label: "Documentos",    value: documentos.length, icon: FileText, palette: P.docs,    tab: "documentos" },
    { label: "Interacciones", value: chats.length,      icon: Bot,      palette: P.chat,    tab: "chat"       },
    { label: "Tickets",       value: tickets.length,    icon: Ticket,   palette: P.tickets, tab: "tickets"    },
  ];

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-full bg-white" style={{ padding: "10px" }}>
        <div className="space-y-5 pb-8">

          <div>
            <h2 className="text-xl font-bold text-gray-800">Resumen General</h2>
            <p className="text-sm text-gray-400 mt-0.5">Monitoreo en tiempo real de la plataforma</p>
          </div>

          {/* KPI CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {cards.map(({ label, value, icon: Icon, palette, tab: t }) => (
              <button key={t} onClick={() => setTab(t)}
                className="text-left p-4 rounded-2xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                style={{
                  background:  tab === t ? palette.light : "#FAFAFA",
                  borderColor: tab === t ? palette.main  : "#E5E7EB",
                  borderWidth: tab === t ? "2px"         : "1px",
                }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-500">{label}</p>
                    <p className="text-3xl font-black mt-1" style={{ color: palette.main }}>
                      {loading
                        ? <span className="animate-pulse text-gray-300">—</span>
                        : value}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl shrink-0" style={{ background: palette.main + "20" }}>
                    <Icon size={18} style={{ color: palette.main }} />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* TABS */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl w-full sm:w-fit">
            {[
              { id: "usuarios",   label: "Usuarios",     icon: Users    },
              { id: "documentos", label: "Documentos",   icon: FileText },
              { id: "chat",       label: "Asistente IA", icon: Bot      },
              { id: "tickets",    label: "Tickets",      icon: Ticket   },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  tab === id ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}>
                <Icon size={14} /><span className="hidden sm:block">{label}</span>
              </button>
            ))}
          </div>

          {/* ── TAB: USUARIOS ────────────────────────────────────── */}
          {tab === "usuarios" && (
            <div className="space-y-4">
              {loading ? (
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <MiniStat label="Activos"     value={countEstado("activo")}     color={ESTADO_COLORS.activo}     />
                    <MiniStat label="Pendientes"  value={countEstado("pendiente")}  color={ESTADO_COLORS.pendiente}  />
                    <MiniStat label="Suspendidos" value={countEstado("suspendido")} color={ESTADO_COLORS.suspendido} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <KpiCard
                      label="Activos últimos 30 días"
                      value={activosRecientes}
                      unit="usuarios"
                      color="#10B981"
                      sub={`de ${countEstado("activo")} activos totales`}
                    />
                    <KpiCard
                      label="Sin actividad reciente"
                      value={Math.max(countEstado("activo") - activosRecientes, 0)}
                      unit="usuarios"
                      color="#F59E0B"
                      sub="Activos pero sin login en 30 días"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card title="Distribución por Estado">
                      {usersByEstado.length === 0
                        ? <p className="text-xs text-gray-400 text-center py-8">Sin datos</p>
                        : (
                          <div className="flex items-center gap-6">
                            <ResponsiveContainer width="50%" height={160}>
                              <PieChart>
                                <Pie
                                  data={usersByEstado}
                                  cx="50%" cy="50%"
                                  innerRadius={45} outerRadius={70}
                                  dataKey="value" paddingAngle={3}
                                >
                                  {usersByEstado.map((e, i) => (
                                    <Cell
                                      key={i}
                                      fill={ESTADO_COLORS[e.name] || "#9CA3AF"}
                                      stroke="white"
                                      strokeWidth={2}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip content={<Tip />} />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-col gap-2.5">
                              {usersByEstado.map((e, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                  <span className="w-3 h-3 rounded-full shrink-0"
                                    style={{ background: ESTADO_COLORS[e.name] || "#9CA3AF" }} />
                                  <span className="text-gray-600 capitalize font-medium">{e.name}</span>
                                  <span className="font-bold text-gray-800 ml-2">{e.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </Card>

                    <Card title="Crecimiento de Registros">
                      {usersByDia.length === 0
                        ? <p className="text-xs text-gray-400 text-center py-8">Sin datos de registros</p>
                        : (
                          <ResponsiveContainer width="100%" height={160}>
                            <AreaChart data={usersByDia}>
                              <defs>
                                <linearGradient id="ugr" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%"  stopColor={P.users.main} stopOpacity={0.2} />
                                  <stop offset="95%" stopColor={P.users.main} stopOpacity={0}   />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                              <XAxis dataKey="dia" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
                              <Tooltip content={<Tip accent={P.users.main} />} />
                              <Area
                                dataKey="total" name="Registros"
                                stroke={P.users.main} strokeWidth={2.5}
                                fill="url(#ugr)"
                                dot={{ fill: P.users.main, r: 3, strokeWidth: 0 }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                    </Card>
                  </div>

                  <Card title="Usuarios Recientes">
                    <SimpleTable
                      headers={["Nombre", "Email", "Usuario", "Estado", "Último acceso", "Registro"]}
                      rows={[...usuarios]
                        .sort((a, b) => new Date(b.fecha_registro || 0) - new Date(a.fecha_registro || 0))
                        .slice(0, 8)
                        .map(u => {
                          const est = (u.estado || "pendiente").toLowerCase();
                          const ec  = ESTADO_COLORS[est] || "#9CA3AF";
                          const dias = u.ultimo_acceso
                            ? Math.round((ahora - new Date(u.ultimo_acceso)) / (1000 * 60 * 60 * 24))
                            : null;
                          return [
                            <span key="n" className="font-semibold text-gray-800">{u.nombre} {u.apellido}</span>,
                            <span key="e" className="text-gray-500">{u.email}</span>,
                            <span key="u" className="text-gray-400">{u.username || "—"}</span>,
                            <span key="s"
                              className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold capitalize"
                              style={{ background: ec + "20", color: ec }}>
                              {est}
                            </span>,
                            <span key="a" className="text-gray-400">
                              {dias !== null ? `Hace ${dias}d` : "Nunca"}
                            </span>,
                            <span key="r" className="text-gray-400">{fmtFull(u.fecha_registro)}</span>,
                          ];
                        })}
                    />
                  </Card>
                </>
              )}
            </div>
          )}

          {/* ── TAB: DOCUMENTOS ──────────────────────────────────── */}
          {tab === "documentos" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <MiniStat label="Total subidos" value={documentos.length}                                      color={P.docs.main} />
                <MiniStat label="Procesados"    value={documentos.filter(d => d.estado === "procesado").length}  color="#10B981"    />
                <MiniStat label="Procesando"    value={documentos.filter(d => d.estado === "procesando").length} color="#F59E0B"    />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <KpiCard label="Almacenamiento usado" value={formatBytes(storage)} unit="" color={storageBarColor} sub={`${storagePct}% de 100 MB`} />
                <KpiCard label="Vigentes"             value={documentos.filter(d => d.vencimiento_estado === "VIGENTE").length}  unit="docs" color="#10B981" />
                <KpiCard label="Vencidos / por vencer" value={documentos.filter(d => ["VENCIDO","PROXIMO_VENCER"].includes(d.vencimiento_estado)).length} unit="docs" color="#EF4444" />
              </div>
              <Card>
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span className="font-semibold text-gray-600">Consumo de almacenamiento</span>
                  <span style={{ color: storageBarColor }} className="font-bold">{storagePct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div className="h-3 rounded-full transition-all duration-700"
                    style={{ width: `${storagePct}%`, background: storageBarColor }} />
                </div>
                <div className="flex justify-between text-[11px] text-gray-400 mt-1.5">
                  <span>{formatBytes(storage)} usados</span><span>100 MB disponibles</span>
                </div>
              </Card>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card title="Tipos de Documento más Comunes">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={docsByTipo} layout="vertical" barSize={12}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} width={150} />
                      <Tooltip content={<Tip accent={P.docs.main} />} />
                      <Bar dataKey="value" name="Docs" radius={[0, 4, 4, 0]}>
                        {docsByTipo.map((_, i) => <Cell key={i} fill={DOC_TYPE_C[i % DOC_TYPE_C.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
                <Card title="Volumen de Subidas en el Tiempo">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={docsByDia}>
                      <defs>
                        <linearGradient id="dgr" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={P.docs.main} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={P.docs.main} stopOpacity={0}   />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0FDFA" vertical={false} />
                      <XAxis dataKey="dia" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<Tip accent={P.docs.main} />} />
                      <Area dataKey="total" name="Documentos" stroke={P.docs.main} strokeWidth={2.5} fill="url(#dgr)" dot={{ fill: P.docs.main, r: 3, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <KpiCard label="Tiempo promedio OCR" value={ocrPromSeg < 60 ? ocrPromSeg : `${(ocrPromSeg / 60).toFixed(1)}`} unit={ocrPromSeg < 60 ? "seg" : "min"} color="#7C3AED" sub={`Sobre ${ocrTiempos.length} procesamientos`} />
                <KpiCard label="Eventos registrados" value={historial.length} unit="total" color="#3B82F6" sub={`Subidas: ${historial.filter(h => h.evento === "subido").length} · Procesados: ${historial.filter(h => h.evento === "procesado").length}`} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card title="Tiempos de Procesamiento OCR (seg)">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={ocrTiempos.slice(-10)} barSize={14}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F5F3FF" vertical={false} />
                      <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<Tip accent="#7C3AED" />} />
                      <Bar dataKey="seg" name="Segundos" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
                <Card title="Distribución de Eventos del Historial">
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width="50%" height={160}>
                      <PieChart>
                        <Pie data={histByEvento} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                          {histByEvento.map((_, i) => <Cell key={i} fill={DOC_TYPE_C[i % DOC_TYPE_C.length]} stroke="white" strokeWidth={2} />)}
                        </Pie>
                        <Tooltip content={<Tip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-2">
                      {histByEvento.map((e, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: DOC_TYPE_C[i % DOC_TYPE_C.length] }} />
                          <span className="text-gray-600 capitalize font-medium">{e.name}</span>
                          <span className="font-bold text-gray-800 ml-1">{e.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ── TAB: CHAT ────────────────────────────────────────── */}
          {tab === "chat" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KpiCard label="Conversaciones"    value={chats.length}   unit=""    color={P.chat.main} />
                <KpiCard label="Total mensajes"    value={totalMensajes}  unit=""    color="#7C3AED"     />
                <KpiCard label="Prom. por sesión"  value={chats.length ? Math.round(totalMensajes / chats.length) : 0} unit="msgs" color="#A78BFA" sub="3-5 = asistente eficiente" />
                <KpiCard label="Duración promedio" value={durProm < 60 ? durProm : `${(durProm / 60).toFixed(1)}`} unit={durProm < 60 ? "seg" : "min"} color="#6366F1" sub="Retención por sesión" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card title="Conversaciones por Día">
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chatsByDia}>
                      <defs>
                        <linearGradient id="cgr" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={P.chat.main} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={P.chat.main} stopOpacity={0}   />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F5F3FF" vertical={false} />
                      <XAxis dataKey="dia" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<Tip accent={P.chat.main} />} />
                      <Area dataKey="total" name="Conversaciones" stroke={P.chat.main} strokeWidth={2.5} fill="url(#cgr)" dot={{ fill: P.chat.main, r: 3, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>
                <Card title="Duración de Sesiones (segundos)">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={sesiones.slice(-10)} barSize={14}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F5F3FF" vertical={false} />
                      <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<Tip accent="#6366F1" />} />
                      <Bar dataKey="seg" name="Segundos" fill="#6366F1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>
              <Card title="Sesiones Recientes">
                <SimpleTable
                  headers={["ID sesión", "Mensajes", "Duración", "Primer mensaje", "Fecha"]}
                  rows={chats.slice(0, 10).map(c => {
                    const msgs   = Array.isArray(c.mensajes) ? c.mensajes : [];
                    const primer = msgs[0]?.contenido?.slice(0, 50) || "—";
                    const durSeg = c.actualizado_en
                      ? Math.round((new Date(c.actualizado_en) - new Date(c.creado_en)) / 1000) : 0;
                    return [
                      <span key="id" className="font-mono text-[10px] text-gray-400">{c.id?.slice(0, 8)}…</span>,
                      <span key="n"  className="font-bold" style={{ color: P.chat.main }}>{msgs.length}</span>,
                      <span key="d"  className="text-gray-500">{durSeg < 60 ? `${durSeg}s` : `${(durSeg / 60).toFixed(1)}min`}</span>,
                      <span key="p"  className="text-gray-500 text-[11px]" title={msgs[0]?.contenido}>{primer}…</span>,
                      <span key="f"  className="text-gray-400">{fmt(c.creado_en)}</span>,
                    ];
                  })}
                />
              </Card>
            </div>
          )}

          {/* ── TAB: TICKETS ─────────────────────────────────────── */}
          {tab === "tickets" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(TICKET_ESTADO).map(([k, c]) => (
                  <MiniStat
                    key={k}
                    label={k === "EN_REVISION" ? "En revisión" : k.charAt(0) + k.slice(1).toLowerCase()}
                    value={tickets.filter(t => t.estado === k).length}
                    color={c}
                  />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card title="Por Estado">
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width="50%" height={160}>
                      <PieChart>
                        <Pie data={tickByEstado} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                          {tickByEstado.map((e, i) => (
                            <Cell key={i} fill={TICKET_ESTADO[e.name.toUpperCase()] || "#9CA3AF"} stroke="white" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip content={<Tip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-2.5">
                      {tickByEstado.map((e, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: TICKET_ESTADO[e.name.toUpperCase()] || "#9CA3AF" }} />
                          <span className="text-gray-600 font-medium">{e.name}</span>
                          <span className="font-bold text-gray-800 ml-2">{e.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
                <Card title="Categorización de Fallos">
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={tickByTipo} barSize={16}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#FFF7ED" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => v.replace(/_/g, " ").slice(0, 12)} />
                      <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<Tip accent={P.tickets.main} />} />
                      <Bar dataKey="value" name="Tickets" radius={[4, 4, 0, 0]}>
                        {tickByTipo.map((_, i) => <Cell key={i} fill={TICKET_TIPO_C[i % TICKET_TIPO_C.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>
              {tickByDocTipo.length > 0 && (
                <Card title="Tasa de Error por Tipo de Documento">
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={tickByDocTipo} barSize={16}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#FFF7ED" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => v.replace(/_/g, " ").slice(0, 12)} />
                      <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<Tip accent="#EF4444" />} />
                      <Bar dataKey="value" name="Tickets" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
              <Card title="Tickets Recientes">
                <SimpleTable
                  headers={["Tipo", "Doc afectado", "Estado", "Prioridad", "Descripción", "Fecha"]}
                  rows={tickets.slice(0, 10).map(t => {
                    const ec  = TICKET_ESTADO[t.estado]  || "#9CA3AF";
                    const prc = { ALTA: "#EF4444", MEDIA: "#F59E0B", BAJA: "#10B981" }[t.prioridad] || "#9CA3AF";
                    return [
                      <span key="tipo" className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: P.tickets.main + "18", color: P.tickets.main }}>
                        {t.tipo?.replace(/_/g, " ")}
                      </span>,
                      <span key="doc" className="truncate max-w-[100px] block text-gray-400 text-[11px]">{t.tipo_doc || t.archivo_nombre || "—"}</span>,
                      <span key="est" className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: ec + "18", color: ec }}>
                        {t.estado}
                      </span>,
                      <span key="prio" className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: prc + "18", color: prc }}>
                        {t.prioridad || "—"}
                      </span>,
                      <span key="desc" className="truncate max-w-[160px] block text-gray-500" title={t.descripcion}>
                        {t.descripcion?.slice(0, 40)}…
                      </span>,
                      <span key="f" className="text-gray-400">{fmt(t.creado_en)}</span>,
                    ];
                  })}
                />
              </Card>
            </div>
          )}

        </div>
      </div>
    </ProtectedRoute>
  );
}