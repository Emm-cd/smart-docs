"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { createClient } from "@/app/lib/supabase/client";
import {
  Ticket, MessageSquarePlus, SendHorizonal, Loader2,
  AlertTriangle, CheckCircle2, Clock, XCircle, FileText,
  CreditCard, FileBadge, ScrollText, UserCheck, Receipt,
  X, ChevronDown, ChevronUp, Filter, ShieldAlert, ListChecks,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS / CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const calcEstadoVencimiento = (fechaVencimiento) => {
  if (!fechaVencimiento) return "SIN_FECHA";
  const hoy  = new Date(); hoy.setHours(0, 0, 0, 0);
  const venc = new Date(fechaVencimiento); venc.setHours(0, 0, 0, 0);
  const dias = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
  if (dias < 0)   return "VENCIDO";
  if (dias <= 10) return "PROXIMO_VENCER";
  return "VIGENTE";
};

const parseCalidad = (calidad_imagen) => {
  if (!calidad_imagen) return { tieneAdvertencias: false, advertencias: [] };
  const advertencias        = calidad_imagen.advertencias || [];
  const calidadInsuficiente = calidad_imagen.calidad_suficiente === false;
  return { tieneAdvertencias: advertencias.length > 0 || calidadInsuficiente, advertencias };
};

const formatFecha = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const getDocStyle = (tipo) => {
  const t = (tipo || "").toUpperCase();
  if (t.includes("INE") || t === "CREDENCIAL")
    return { icon: <CreditCard size={18} />, bg: "bg-green-100", color: "text-green-600", label: "INE / Credencial" };
  if (t === "PASAPORTE")
    return { icon: <FileBadge size={18} />, bg: "bg-blue-100", color: "text-blue-600", label: "Pasaporte" };
  if (t.includes("ACTA"))
    return { icon: <ScrollText size={18} />, bg: "bg-orange-100", color: "text-orange-600", label: "Acta de Nacimiento" };
  if (t === "FORMATO_CURP")
    return { icon: <UserCheck size={18} />, bg: "bg-purple-100", color: "text-purple-600", label: "CURP" };
  if (t.includes("FISCAL") || t.includes("CONSTANCIA") || t.includes("CSF") || t.includes("SAT"))
    return { icon: <Receipt size={18} />, bg: "bg-teal-100", color: "text-teal-600", label: "Constancia / SAT" };
  if (t.includes("DECLARACION"))
    return { icon: <Receipt size={18} />, bg: "bg-red-100", color: "text-red-600", label: "Declaración SAT" };
  return { icon: <FileText size={18} />, bg: "bg-gray-100", color: "text-gray-500", label: tipo || "Documento" };
};

const TICKET_TIPOS = [
  { value: "CALIDAD_IMAGEN",     label: "Calidad de imagen",  color: "bg-amber-100 text-amber-700 border-amber-200",    dot: "bg-amber-400" },
  { value: "DOCUMENTO_VENCIDO",  label: "Documento vencido",  color: "bg-red-100 text-red-700 border-red-200",          dot: "bg-red-400"   },
  { value: "DATOS_INCORRECTOS",  label: "Datos incorrectos",  color: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-400"},
  { value: "DOCUMENTO_ILEGIBLE", label: "Doc. ilegible",      color: "bg-pink-100 text-pink-700 border-pink-200",       dot: "bg-pink-400"  },
  { value: "OTRO",               label: "Otro problema",      color: "bg-gray-100 text-gray-600 border-gray-200",       dot: "bg-gray-400"  },
];

const TICKET_ESTADOS = {
  ABIERTO:     { label: "Abierto",     color: "bg-blue-100 text-blue-700",     icon: <Clock size={11} /> },
  EN_REVISION: { label: "En revisión", color: "bg-yellow-100 text-yellow-700", icon: <Loader2 size={11} className="animate-spin" /> },
  RESUELTO:    { label: "Resuelto",    color: "bg-green-100 text-green-700",   icon: <CheckCircle2 size={11} /> },
  CERRADO:     { label: "Cerrado",     color: "bg-gray-100 text-gray-500",     icon: <XCircle size={11} /> },
};

// ─────────────────────────────────────────────────────────────────────────────
//  TARJETA DE INCIDENCIA
// ─────────────────────────────────────────────────────────────────────────────
function IncidenciaCard({ doc, tieneTicketActivo, onLevantarTicket }) {
  const style = getDocStyle(doc.tipo_doc);
  const { tieneAdvertencias } = parseCalidad(doc.calidad_imagen);
  const estadoVenc = calcEstadoVencimiento(doc.fecha_vencimiento);
  const isVencido  = estadoVenc === "VENCIDO";
  const isProximo  = estadoVenc === "PROXIMO_VENCER";

  const borderColor = isVencido ? "border-red-200" : isProximo ? "border-yellow-200" : "border-amber-200";
  const lineColor   = isVencido ? "bg-red-400"     : isProximo ? "bg-yellow-400"     : "bg-amber-400";

  return (
    <div className={`bg-white rounded-2xl border shadow-sm flex flex-col overflow-hidden ${borderColor}`}>
      <div className={`h-1 w-full ${lineColor}`} />
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className={`${style.bg} ${style.color} p-2.5 rounded-xl shrink-0`}>{style.icon}</div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 text-sm">{style.label}</p>
            <p className="text-xs text-gray-400 truncate mt-0.5">{doc.filename}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {isVencido && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full border border-red-200">
                  <XCircle size={10} /> Vencido
                </span>
              )}
              {isProximo && !isVencido && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full border border-yellow-200">
                  <Clock size={10} /> Próximo a vencer
                </span>
              )}
              {tieneAdvertencias && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full border border-amber-200">
                  <AlertTriangle size={10} /> Calidad baja
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => !tieneTicketActivo && onLevantarTicket(doc)}
          disabled={tieneTicketActivo}
          className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            tieneTicketActivo
              ? "bg-green-50 text-green-600 border border-green-200 cursor-default"
              : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-sm"
          }`}
        >
          {tieneTicketActivo
            ? <><CheckCircle2 size={13} /> Ticket activo</>
            : <><MessageSquarePlus size={13} /> Levantar Ticket</>}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  FILA DE TICKET
// ─────────────────────────────────────────────────────────────────────────────
function TicketRow({ ticket }) {
  const [expanded, setExpanded] = useState(false);
  const tipoInfo   = TICKET_TIPOS.find((t) => t.value === ticket.tipo);
  const estadoInfo = TICKET_ESTADOS[ticket.estado] || TICKET_ESTADOS.ABIERTO;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50/80 transition"
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${tipoInfo?.dot || "bg-gray-400"}`} />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${tipoInfo?.color || "bg-gray-100 text-gray-600 border-gray-200"}`}>
              {tipoInfo?.label || ticket.tipo}
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${estadoInfo.color}`}>
              {estadoInfo.icon} {estadoInfo.label}
            </span>
          </div>
          {ticket.archivo_nombre && (
            <p className="text-xs text-gray-400 mt-0.5 truncate flex items-center gap-1">
              <FileText size={10} /> {ticket.archivo_nombre}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-gray-400 hidden sm:block">{formatFecha(ticket.creado_en)}</span>
          {expanded
            ? <ChevronUp size={15} className="text-gray-400" />
            : <ChevronDown size={15} className="text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Descripción</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2.5 leading-relaxed">{ticket.descripcion}</p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-gray-400">
            <span>Creado: {formatFecha(ticket.creado_en)}</span>
            {ticket.resuelto_en && <span>Resuelto: {formatFecha(ticket.resuelto_en)}</span>}
          </div>
          {ticket.notas_resolucion && (
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Notas de resolución</p>
              <p className="text-sm text-green-700 bg-green-50 rounded-xl px-3 py-2.5 leading-relaxed">{ticket.notas_resolucion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MODAL CREAR TICKET
// ─────────────────────────────────────────────────────────────────────────────
function ModalCrearTicket({ doc, onClose, onCreado }) {
  const supabase = useMemo(() => createClient(), []);
  const style    = getDocStyle(doc?.tipo_doc);

  const [tipoTicket, setTipoTicket] = useState(() => {
    const { tieneAdvertencias } = parseCalidad(doc?.calidad_imagen);
    const ev = calcEstadoVencimiento(doc?.fecha_vencimiento);
    if (ev === "VENCIDO")      return "DOCUMENTO_VENCIDO";
    if (tieneAdvertencias)     return "CALIDAD_IMAGEN";
    return "OTRO";
  });
  const [descripcion, setDescripcion] = useState("");
  const [enviando,    setEnviando]    = useState(false);
  const [error,       setError]       = useState(null);

  const handleCrear = async () => {
    if (!descripcion.trim()) { setError("Por favor escribe una descripción del problema."); return; }
    setEnviando(true); setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    const { error: dbError } = await supabase.from("tickets").insert({
      documento_id:   doc.id,
      uid_usuario:    user.id,
      tipo:           tipoTicket,
      descripcion:    descripcion.trim(),
      archivo_nombre: doc.filename,
      tipo_doc:       doc.tipo_doc,
      storage_path:   doc.storage_path,
      estado:         "ABIERTO",
    });
    if (dbError) { setError("No se pudo crear el ticket. Intenta de nuevo."); setEnviando(false); return; }
    onCreado();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={() => !enviando && onClose()}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`${style.bg} ${style.color} p-2.5 rounded-xl shrink-0`}>{style.icon}</div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Levantar Ticket</h3>
              <p className="text-xs text-gray-400 truncate max-w-[220px]">{doc.filename}</p>
            </div>
          </div>
          <button onClick={onClose} disabled={enviando}
            className="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1.5 transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Tipo */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
              Tipo de problema
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TICKET_TIPOS.map((t) => (
                <button key={t.value} onClick={() => setTipoTicket(t.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition border ${
                    tipoTicket === t.value
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${t.dot}`} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
              Describe el problema
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => { setDescripcion(e.target.value); setError(null); }}
              placeholder="Explica brevemente qué problema encontraste con este documento…"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-300"
            />
            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                <AlertTriangle size={11} /> {error}
              </p>
            )}
          </div>

          <button onClick={handleCrear} disabled={!descripcion.trim() || enviando}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
            {enviando
              ? <><Loader2 size={16} className="animate-spin" /> Enviando…</>
              : <><SendHorizonal size={16} /> Enviar Ticket</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PÁGINA PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function TicketsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [documentos,     setDocumentos]     = useState([]);
  const [tickets,        setTickets]        = useState([]);
  const [loadingDocs,    setLoadingDocs]    = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [docModal,       setDocModal]       = useState(null);
  const [filtroEstado,   setFiltroEstado]   = useState("TODOS");
  const [tab,            setTab]            = useState("incidencias"); // "incidencias" | "tickets"

  // ── Carga de datos ─────────────────────────────────────────────
  const cargarDocumentos = useCallback(async () => {
    setLoadingDocs(true);
    const { data } = await supabase
      .from("documentos")
      .select("id, filename, tipo_doc, estado, calidad_imagen, fecha_vencimiento, storage_path, vencimiento_estado")
      .is("eliminado_en", null)
      .eq("estado", "procesado")
      .order("creado_en", { ascending: false });

    const conProblema = (data || []).filter((d) => {
      const { tieneAdvertencias } = parseCalidad(d.calidad_imagen);
      const ev = calcEstadoVencimiento(d.fecha_vencimiento);
      return tieneAdvertencias || ev === "VENCIDO" || ev === "PROXIMO_VENCER";
    });
    setDocumentos(conProblema);
    setLoadingDocs(false);
  }, [supabase]);

  const cargarTickets = useCallback(async () => {
    setLoadingTickets(true);
    const { data } = await supabase
      .from("tickets")
      .select("*")
      .order("creado_en", { ascending: false });
    setTickets(data || []);
    setLoadingTickets(false);
  }, [supabase]);

  useEffect(() => { cargarDocumentos(); cargarTickets(); }, [cargarDocumentos, cargarTickets]);

  const handleTicketCreado = () => { setDocModal(null); cargarTickets(); setTab("tickets"); };

  const ticketsActivosPorDoc = useMemo(() => {
    const map = {};
    tickets.forEach((t) => {
      if (t.documento_id && ["ABIERTO", "EN_REVISION"].includes(t.estado))
        map[t.documento_id] = true;
    });
    return map;
  }, [tickets]);

  const ticketsFiltrados = useMemo(() =>
    filtroEstado === "TODOS" ? tickets : tickets.filter((t) => t.estado === filtroEstado),
    [tickets, filtroEstado]
  );

  const stats = useMemo(() => ({
    total:      tickets.length,
    abiertos:   tickets.filter((t) => t.estado === "ABIERTO").length,
    enRevision: tickets.filter((t) => t.estado === "EN_REVISION").length,
    resueltos:  tickets.filter((t) => t.estado === "RESUELTO").length,
  }), [tickets]);

  // ─────────────────────────────────────────────────────────────────
  return (
    <ProtectedRoute>
      <div className="space-y-5 pb-6">

        {/* HEADER */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Tickets de Soporte</h2>
          <p className="text-gray-500 text-sm mt-0.5">Reporta y da seguimiento a incidencias en tus documentos</p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total",       value: stats.total,      color: "text-gray-700",   bg: "bg-gray-50",    border: "border-gray-200",   line: "bg-gray-300"   },
            { label: "Abiertos",    value: stats.abiertos,   color: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-200",   line: "bg-blue-500"   },
            { label: "En revisión", value: stats.enRevision, color: "text-yellow-700", bg: "bg-yellow-50",  border: "border-yellow-200", line: "bg-yellow-400" },
            { label: "Resueltos",   value: stats.resueltos,  color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200",  line: "bg-green-500"  },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl overflow-hidden`}>
              <div className={`h-1 ${s.line}`} />
              <div className="p-4">
                <p className="text-xs font-medium text-gray-500">{s.label}</p>
                <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl w-full sm:w-fit">
          <button
            onClick={() => setTab("incidencias")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === "incidencias"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <ShieldAlert size={15} />
            Incidencias
            {documentos.length > 0 && (
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                tab === "incidencias" ? "bg-red-100 text-red-600" : "bg-gray-200 text-gray-500"
              }`}>
                {documentos.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("tickets")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === "tickets"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <ListChecks size={15} />
            Mis Tickets
            {tickets.length > 0 && (
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                tab === "tickets" ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-500"
              }`}>
                {tickets.length}
              </span>
            )}
          </button>
        </div>

        {/* ── TAB: INCIDENCIAS ── */}
        {tab === "incidencias" && (
          <div className="space-y-4">
            {/* Aviso informativo */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
              <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 leading-relaxed">
                Aquí aparecen los documentos que requieren atención: vencidos, próximos a vencer o con calidad de imagen insuficiente. Levanta un ticket para que el equipo de soporte te ayude.
              </p>
            </div>

            {loadingDocs ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-36 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                ))}
              </div>
            ) : documentos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                <CheckCircle2 size={40} className="text-green-400 opacity-50 mb-3" />
                <p className="text-sm font-semibold text-gray-600">Sin incidencias detectadas</p>
                <p className="text-xs text-gray-400 mt-1">Todos tus documentos están en buen estado 🎉</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {documentos.map((doc) => (
                  <IncidenciaCard
                    key={doc.id}
                    doc={doc}
                    tieneTicketActivo={!!ticketsActivosPorDoc[doc.id]}
                    onLevantarTicket={setDocModal}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: MIS TICKETS ── */}
        {tab === "tickets" && (
          <div className="space-y-4">
            {/* Filtros */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={13} className="text-gray-400 shrink-0" />
              <span className="text-xs text-gray-400 font-medium mr-1">Filtrar:</span>
              {["TODOS", "ABIERTO", "EN_REVISION", "RESUELTO", "CERRADO"].map((estado) => (
                <button
                  key={estado}
                  onClick={() => setFiltroEstado(estado)}
                  className={`text-[11px] font-bold px-3 py-1 rounded-full border transition ${
                    filtroEstado === estado
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {estado === "TODOS" ? "Todos" : TICKET_ESTADOS[estado]?.label || estado}
                  {estado !== "TODOS" && (
                    <span className="ml-1 opacity-70">
                      ({tickets.filter((t) => t.estado === estado).length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {loadingTickets ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                ))}
              </div>
            ) : ticketsFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                <Ticket size={40} className="text-gray-300 mb-3" />
                <p className="text-sm font-semibold text-gray-600">
                  {filtroEstado === "TODOS" ? "Sin tickets aún" : `Sin tickets "${TICKET_ESTADOS[filtroEstado]?.label || filtroEstado}"`}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {filtroEstado === "TODOS"
                    ? "Ve a la pestaña Incidencias para levantar un ticket"
                    : "Prueba seleccionando otro filtro"}
                </p>
                {filtroEstado === "TODOS" && (
                  <button
                    onClick={() => setTab("incidencias")}
                    className="mt-4 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                  >
                    Ver Incidencias →
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {ticketsFiltrados.map((ticket) => (
                  <TicketRow key={ticket.id} ticket={ticket} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL CREAR TICKET */}
      {docModal && (
        <ModalCrearTicket
          doc={docModal}
          onClose={() => setDocModal(null)}
          onCreado={handleTicketCreado}
        />
      )}
    </ProtectedRoute>
  );
}