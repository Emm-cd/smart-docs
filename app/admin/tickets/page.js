"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Ticket, MessageSquarePlus, AlertTriangle, CheckCircle2, Clock,
  XCircle, FileText, X, Filter, ChevronDown, RefreshCw,
  User, Hash, Tag, SendHorizonal, Loader2, ChevronRight,
  Pencil, CreditCard, FileBadge, ScrollText, UserCheck,
  Receipt, ShieldAlert, Flag, Eye, MessageCircle,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { createClient } from "@/app/lib/supabase/client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatFecha = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const formatFechaHora = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const TICKET_TIPOS = [
  { value: "CALIDAD_IMAGEN",     label: "Calidad de imagen",   color: "bg-amber-100 text-amber-700 border-amber-200",   dot: "bg-amber-400"    },
  { value: "DOCUMENTO_VENCIDO",  label: "Documento vencido",   color: "bg-red-100 text-red-700 border-red-200",         dot: "bg-red-400"      },
  { value: "DATOS_INCORRECTOS",  label: "Datos incorrectos",   color: "bg-orange-100 text-orange-700 border-orange-200",dot: "bg-orange-400"   },
  { value: "DOCUMENTO_ILEGIBLE", label: "Documento ilegible",  color: "bg-pink-100 text-pink-700 border-pink-200",      dot: "bg-pink-400"     },
  { value: "OTRO",               label: "Otro problema",       color: "bg-gray-100 text-gray-600 border-gray-200",      dot: "bg-gray-400"     },
];

const TICKET_ESTADOS = {
  ABIERTO:     { label: "Abierto",      color: "bg-blue-100 text-blue-700 border-blue-200",     Icon: Clock,        next: "EN_REVISION" },
  EN_REVISION: { label: "En revisión",  color: "bg-yellow-100 text-yellow-700 border-yellow-200",Icon: Loader2,      next: "RESUELTO"    },
  RESUELTO:    { label: "Resuelto",     color: "bg-green-100 text-green-700 border-green-200",   Icon: CheckCircle2, next: "CERRADO"     },
  CERRADO:     { label: "Cerrado",      color: "bg-gray-100 text-gray-500 border-gray-200",      Icon: XCircle,      next: null          },
};

const TICKET_PRIORIDADES = {
  BAJA:    { label: "Baja",    color: "bg-gray-100 text-gray-500",     dot: "bg-gray-400"  },
  MEDIA:   { label: "Media",   color: "bg-blue-100 text-blue-600",     dot: "bg-blue-400"  },
  ALTA:    { label: "Alta",    color: "bg-orange-100 text-orange-600", dot: "bg-orange-400"},
  URGENTE: { label: "Urgente", color: "bg-red-100 text-red-600",       dot: "bg-red-500"   },
};

function getTipoInfo(tipo) {
  return TICKET_TIPOS.find(t => t.value === tipo) ?? { label: tipo, color: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" };
}

function getEstadoInfo(estado) {
  return TICKET_ESTADOS[estado] ?? TICKET_ESTADOS.ABIERTO;
}

function getPrioridadInfo(prioridad) {
  return TICKET_PRIORIDADES[prioridad] ?? TICKET_PRIORIDADES.MEDIA;
}

function getUserNombre(ticket) {
  const u = ticket.usuario;
  if (!u) return ticket.uid_usuario?.slice(0, 8) + "…";
  if (u.nombre) return `${u.nombre} ${u.apellido || ""}`.trim();
  return u.email ?? ticket.uid_usuario?.slice(0, 8) + "…";
}

const getDocIcon = (tipo) => {
  const t = (tipo || "").toUpperCase();
  if (t.includes("INE") || t === "CREDENCIAL") return <CreditCard size={16} className="text-green-600" />;
  if (t === "PASAPORTE")                        return <FileBadge size={16} className="text-blue-600" />;
  if (t.includes("ACTA"))                       return <ScrollText size={16} className="text-orange-600" />;
  if (t === "FORMATO_CURP")                     return <UserCheck size={16} className="text-purple-600" />;
  if (t.includes("FISCAL") || t.includes("CONSTANCIA") || t.includes("SAT"))
    return <Receipt size={16} className="text-teal-600" />;
  return <FileText size={16} className="text-gray-500" />;
};

// ─── Modal de detalle / acciones ──────────────────────────────────────────────

function TicketDetailModal({ ticket, onClose, onUpdated, supabase }) {
  const [estado,          setEstado]          = useState(ticket.estado);
  const [prioridad,       setPrioridad]       = useState(ticket.prioridad);
  const [notas,           setNotas]           = useState(ticket.notas_resolucion || "");
  const [comentario,      setComentario]      = useState("");
  const [guardando,       setGuardando]       = useState(false);
  const [guardandoNota,   setGuardandoNota]   = useState(false);
  const [error,           setError]           = useState(null);

  const tipoInfo     = getTipoInfo(ticket.tipo);
  const estadoInfo   = getEstadoInfo(estado);
  const priorInfo    = getPrioridadInfo(prioridad);
  const EstadoIcon   = estadoInfo.Icon;

  // Guardar estado + prioridad
  const handleGuardarCambios = async () => {
    setGuardando(true); setError(null);
    const { error: dbErr } = await supabase
      .from("tickets")
      .update({
        estado,
        prioridad,
        ...(estado === "RESUELTO" && { resuelto_en: new Date().toISOString() }),
      })
      .eq("id", ticket.id);

    if (dbErr) { setError("Error al guardar cambios."); setGuardando(false); return; }
    onUpdated({ ...ticket, estado, prioridad });
    setGuardando(false);
  };

  // Guardar nota de resolución
  const handleGuardarNota = async () => {
    if (!comentario.trim() && !notas.trim()) return;
    setGuardandoNota(true); setError(null);
    const notaFinal = comentario.trim()
      ? `${notas}\n[${formatFechaHora(new Date().toISOString())}] ${comentario.trim()}`.trim()
      : notas.trim();

    const { error: dbErr } = await supabase
      .from("tickets")
      .update({ notas_resolucion: notaFinal })
      .eq("id", ticket.id);

    if (dbErr) { setError("Error al guardar la nota."); setGuardandoNota(false); return; }
    setNotas(notaFinal);
    setComentario("");
    onUpdated({ ...ticket, estado, prioridad, notas_resolucion: notaFinal });
    setGuardandoNota(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col border border-gray-100"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/60">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2.5 rounded-xl">
              <Ticket size={18} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Ticket #{ticket.id.slice(0, 8).toUpperCase()}</h3>
              <p className="text-xs text-gray-400">{formatFechaHora(ticket.creado_en)}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="text-gray-400 hover:text-gray-600 bg-white rounded-full p-1.5 border border-gray-200 transition">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Info del usuario */}
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Información del usuario</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Nombre</p>
                <p className="font-semibold text-sm text-gray-800 flex items-center gap-1.5">
                  <User size={13} className="text-gray-400" /> {getUserNombre(ticket)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Email</p>
                <p className="font-semibold text-sm text-gray-800 truncate">{ticket.usuario?.email ?? "—"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-0.5">ID de usuario</p>
                <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-mono flex items-center gap-1.5">
                  <Hash size={11} /> {ticket.uid_usuario}
                </code>
              </div>
            </div>
          </div>

          {/* Info del documento */}
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Documento relacionado</p>
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-xl border border-gray-200">
                {getDocIcon(ticket.tipo_doc)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-800 truncate">{ticket.archivo_nombre ?? "—"}</p>
                <p className="text-xs text-gray-400">{ticket.tipo_doc ?? "Tipo desconocido"}</p>
              </div>
            </div>
          </div>

          {/* Tipo y descripción */}
          <div className="space-y-3">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Tipo de incidencia</p>
              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${tipoInfo.color}`}>
                <span className={`w-2 h-2 rounded-full ${tipoInfo.dot}`} /> {tipoInfo.label}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Descripción del usuario</p>
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <p className="text-sm text-gray-700 leading-relaxed">{ticket.descripcion}</p>
              </div>
            </div>
          </div>

          {/* Acciones admin */}
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Acciones de administrador</p>

            <div className="grid grid-cols-2 gap-3">
              {/* Estado */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Estado del ticket</p>
                <div className="flex flex-col gap-1.5">
                  {Object.entries(TICKET_ESTADOS).map(([key, cfg]) => (
                    <button key={key} onClick={() => setEstado(key)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                        estado === key ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}>
                      <cfg.Icon size={11} className="shrink-0" />
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prioridad */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Prioridad</p>
                <div className="flex flex-col gap-1.5">
                  {Object.entries(TICKET_PRIORIDADES).map(([key, cfg]) => (
                    <button key={key} onClick={() => setPrioridad(key)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                        prioridad === key ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={handleGuardarCambios} disabled={guardando}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition disabled:opacity-40">
              {guardando ? <><Loader2 size={14} className="animate-spin" /> Guardando…</> : "Guardar cambios de estado y prioridad"}
            </button>
          </div>

          {/* Notas de resolución + comentarios */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-2">
              <MessageCircle size={13} /> Notas de resolución
            </p>

            {notas && (
              <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                <p className="text-xs text-green-600 font-semibold mb-1">Historial de notas</p>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{notas}</pre>
              </div>
            )}

            <div className="flex gap-2">
              <textarea
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                placeholder="Añadir un comentario o nota de resolución…"
                rows={2}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-300"
              />
              <button onClick={handleGuardarNota} disabled={!comentario.trim() || guardandoNota}
                className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold flex items-center gap-1.5 hover:bg-green-700 transition disabled:opacity-40 self-end">
                {guardandoNota ? <Loader2 size={14} className="animate-spin" /> : <SendHorizonal size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              <AlertTriangle size={14} className="text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function TicketsAdminPage() {
  const supabase = useMemo(() => createClient(), []);

  const [tickets,       setTickets]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [selectedTk,    setSelectedTk]    = useState(null);
  const [filtroEstado,  setFiltroEstado]  = useState("TODOS");
  const [filtroTipo,    setFiltroTipo]    = useState("TODOS");
  const [filtroPrior,   setFiltroPrior]   = useState("TODOS");
  const [openDropdown,  setOpenDropdown]  = useState(null);
  const [searchTerm,    setSearchTerm]    = useState("");

  // ── Fetch ──────────────────────────────────────────────────────

// ── FIX: uid_usuario → auth.users no es joineable por PostgREST.
// Solución: fetch separado de usuarios y merge manual.
const fetchTickets = useCallback(async () => {
  setLoading(true);

  // 1. Traer tickets sin join
  const { data: ticketsRaw, error } = await supabase
    .from("tickets")
    .select("*")
    .order("creado_en", { ascending: false });

  if (error) {
    console.error("Error al cargar tickets:", error.message);
    setLoading(false);
    return;
  }

  // 2. Extraer UIDs únicos y buscar en tabla usuarios
  const uids = [...new Set((ticketsRaw || []).map(t => t.uid_usuario).filter(Boolean))];

  let usuariosMap = {};
  if (uids.length > 0) {
    const { data: usuariosData } = await supabase
      .from("usuarios")
      .select("id, nombre, apellido, email, username")
      .in("id", uids);

    (usuariosData || []).forEach(u => { usuariosMap[u.id] = u; });
  }

  // 3. Merge manual
  const merged = (ticketsRaw || []).map(t => ({
    ...t,
    usuario: usuariosMap[t.uid_usuario] || null,
  }));

  setTickets(merged);
  setLoading(false);
}, [supabase]);

useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // ── Stats ──────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    total:       tickets.length,
    abiertos:    tickets.filter(t => t.estado === "ABIERTO").length,
    enRevision:  tickets.filter(t => t.estado === "EN_REVISION").length,
    resueltos:   tickets.filter(t => t.estado === "RESUELTO").length,
    urgentes:    tickets.filter(t => t.prioridad === "URGENTE" && t.estado !== "CERRADO").length,
  }), [tickets]);

  // ── Filtrado ───────────────────────────────────────────────────

  const ticketsFiltrados = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return tickets.filter(t => {
      const matchEstado  = filtroEstado === "TODOS" || t.estado === filtroEstado;
      const matchTipo    = filtroTipo   === "TODOS" || t.tipo   === filtroTipo;
      const matchPrior   = filtroPrior  === "TODOS" || t.prioridad === filtroPrior;
      const matchSearch  = !term ||
        getUserNombre(t).toLowerCase().includes(term) ||
        (t.archivo_nombre || "").toLowerCase().includes(term) ||
        (t.descripcion || "").toLowerCase().includes(term) ||
        (t.uid_usuario || "").toLowerCase().includes(term);
      return matchEstado && matchTipo && matchPrior && matchSearch;
    });
  }, [tickets, filtroEstado, filtroTipo, filtroPrior, searchTerm]);

  const handleUpdated = (updated) => {
    setTickets(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
    setSelectedTk(prev => prev?.id === updated.id ? { ...prev, ...updated } : prev);
  };

  const toggleDropdown = (e, name) => {
    e.stopPropagation();
    setOpenDropdown(openDropdown === name ? null : name);
  };

  // ── Render ─────────────────────────────────────────────────────

  return (
    <ProtectedRoute>
      <div
        className="w-full flex flex-col gap-5 p-4 md:p-6 pt-2 md:pt-3"
        onClick={() => setOpenDropdown(null)}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Tickets</h1>
            <p className="text-sm text-gray-500 mt-0.5">Revisa y responde las incidencias reportadas por usuarios</p>
          </div>
          <button onClick={fetchTickets}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Actualizar
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total",        value: stats.total,      bg: "bg-white",         color: "text-gray-700"   },
            { label: "Abiertos",     value: stats.abiertos,   bg: "bg-blue-50",       color: "text-blue-700"   },
            { label: "En revisión",  value: stats.enRevision, bg: "bg-yellow-50",     color: "text-yellow-700" },
            { label: "Resueltos",    value: stats.resueltos,  bg: "bg-green-50",      color: "text-green-700"  },
            { label: "Urgentes",     value: stats.urgentes,   bg: "bg-red-50",        color: "text-red-600"    },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border border-gray-100 rounded-2xl p-4 shadow-sm`}>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>
                {loading ? <span className="animate-pulse text-gray-200">—</span> : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* FILTROS */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Búsqueda */}
          <div className="relative flex-1 w-full">
            <Eye size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por usuario, documento o descripción…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={15} className="text-gray-400 shrink-0" />

            {/* Estado */}
            {[
              { key: "filtroEstado", value: filtroEstado, set: setFiltroEstado, label: "Estado",
                options: [["TODOS","Todos"], ...Object.entries(TICKET_ESTADOS).map(([k,v]) => [k, v.label])] },
              { key: "filtroTipo", value: filtroTipo, set: setFiltroTipo, label: "Tipo",
                options: [["TODOS","Todos"], ...TICKET_TIPOS.map(t => [t.value, t.label])] },
              { key: "filtroPrior", value: filtroPrior, set: setFiltroPrior, label: "Prioridad",
                options: [["TODOS","Todos"], ...Object.entries(TICKET_PRIORIDADES).map(([k,v]) => [k, v.label])] },
            ].map(({ key, value, set, label, options }) => (
              <div key={key} className="relative">
                <button
                  onClick={e => toggleDropdown(e, key)}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-sm transition min-w-[130px] bg-white ${
                    openDropdown === key ? "border-blue-500 ring-2 ring-blue-500/20" : "border-gray-200 hover:border-gray-300"
                  }`}>
                  <span className="flex-1 text-gray-700 text-left truncate">{label}: {options.find(o => o[0] === value)?.[1] ?? value}</span>
                  <ChevronDown size={13} className={`text-gray-400 shrink-0 transition-transform ${openDropdown === key ? "rotate-180" : ""}`} />
                </button>
                {openDropdown === key && (
                  <div className="absolute top-full mt-1 left-0 min-w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1.5 max-h-60 overflow-y-auto">
                    {options.map(([k, l]) => (
                      <button key={k} onClick={() => { set(k); setOpenDropdown(null); }}
                        className={`w-full text-left px-4 py-2 text-sm transition ${value === k ? "bg-blue-600 text-white font-medium" : "text-gray-700 hover:bg-gray-50"}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* TABLA DE TICKETS */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="py-3.5 px-5">Ticket</th>
                  <th className="py-3.5 px-5">Usuario</th>
                  <th className="py-3.5 px-5">Documento</th>
                  <th className="py-3.5 px-5 min-w-[160px]">Descripción</th>
                  <th className="py-3.5 px-5">Estado</th>
                  <th className="py-3.5 px-5">Prioridad</th>
                  <th className="py-3.5 px-5">Fecha</th>
                  <th className="py-3.5 px-5 text-center">Ver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="py-3.5 px-5"><div className="h-4 bg-gray-100 rounded-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : ticketsFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-gray-400">
                      <Ticket size={32} className="opacity-20 mx-auto mb-2" />
                      <p className="text-sm font-medium">Sin tickets con los filtros seleccionados</p>
                    </td>
                  </tr>
                ) : ticketsFiltrados.map(ticket => {
                  const tipoInfo   = getTipoInfo(ticket.tipo);
                  const estadoInfo = getEstadoInfo(ticket.estado);
                  const priorInfo  = getPrioridadInfo(ticket.prioridad);
                  const EstadoIcon = estadoInfo.Icon;

                  return (
                    <tr key={ticket.id}
                      className={`transition-colors hover:bg-gray-50/60 ${ticket.prioridad === "URGENTE" && ticket.estado !== "CERRADO" ? "bg-red-50/30" : ""}`}>

                      {/* Ticket ID + tipo */}
                      <td className="py-3.5 px-5">
                        <span className="font-mono text-xs text-gray-400 block">#{ticket.id.slice(0,8).toUpperCase()}</span>
                        <span className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${tipoInfo.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${tipoInfo.dot}`} />
                          {tipoInfo.label}
                        </span>
                      </td>

                      {/* Usuario */}
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-gray-800 text-sm">{getUserNombre(ticket)}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[120px]">{ticket.usuario?.email ?? "—"}</p>
                        <code className="text-[10px] text-gray-300 font-mono">{ticket.uid_usuario?.slice(0, 8)}…</code>
                      </td>

                      {/* Documento */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-1.5">
                          {getDocIcon(ticket.tipo_doc)}
                          <span className="text-sm text-gray-700 truncate max-w-[160px]" title={ticket.archivo_nombre}>
                            {ticket.archivo_nombre ?? "—"}
                          </span>
                        </div>
                      </td>

                      {/* Descripción */}
                      <td className="py-3.5 px-5">
                        <p className="text-sm text-gray-600 max-w-[220px] line-clamp-2">{ticket.descripcion}</p>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${estadoInfo.color}`}>
                          <EstadoIcon size={11} /> {estadoInfo.label}
                        </span>
                      </td>

                      {/* Prioridad */}
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${priorInfo.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${priorInfo.dot}`} />
                          {priorInfo.label}
                        </span>
                      </td>

                      {/* Fecha */}
                      <td className="py-3.5 px-5 text-xs text-gray-500 whitespace-nowrap">
                        {formatFecha(ticket.creado_en)}
                      </td>

                      {/* Acción */}
                      <td className="py-3.5 px-5 text-center">
                        <button onClick={() => setSelectedTk(ticket)}
                          className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition">
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!loading && ticketsFiltrados.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
              Mostrando {ticketsFiltrados.length} de {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DETALLE */}
      {selectedTk && (
        <TicketDetailModal
          ticket={selectedTk}
          onClose={() => setSelectedTk(null)}
          onUpdated={handleUpdated}
          supabase={supabase}
        />
      )}
    </ProtectedRoute>
  );
}