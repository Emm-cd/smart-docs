"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search, FileText, FileImage, MoreVertical, Eye, Download,
  Trash2, AlertTriangle, X, Activity, HardDrive, Upload,
  Users, Filter, ChevronDown, List, RefreshCw, Clock,
  CheckCircle, AlertCircle, ShieldAlert, FileQuestion,
  Pencil, Ticket, RotateCcw, LogIn, Droplets,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { createClient } from "@/app/lib/supabase/client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIPO_DOC_LABELS = {
  CONSTANCIA_SAT:              "Constancia SAT",
  CONSTANCIA_SITUACION_FISCAL: "Constancia Fiscal",
  FORMATO_CURP:                "CURP",
  PASAPORTE:                   "Pasaporte",
  ACTA_NACIMIENTO:             "Acta de nacimiento",
  INE:                         "INE",
  DECLARACION_SAT:             "Declaración SAT",
  DECLARACION_ANUAL:           "Declaración Anual",
  REPORTE_DERRAME:             "Reporte de Derrame",
};

const TIPO_DOC_FILTER_OPTIONS = ["Todos", ...new Set(Object.values(TIPO_DOC_LABELS))];

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatBytesToMB(bytes) {
  return parseFloat((bytes / (1024 * 1024)).toFixed(2));
}

function relativeTime(dateStr) {
  if (!dateStr) return "—";
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return "Justo ahora";
  if (mins  < 60) return `Hace ${mins}m`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days  === 1) return "Ayer";
  return `Hace ${days} días`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("es-MX", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function isToday(dateStr) {
  const d = new Date(dateStr), n = new Date();
  return d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate()  === n.getDate();
}

function getUserLabel(doc) {
  if (doc.usuarios?.nombre) {
    return [doc.usuarios.nombre, doc.usuarios.apellido].filter(Boolean).join(" ");
  }
  if (doc.usuarios?.email) return doc.usuarios.email;
  return doc.uid_usuario?.slice(0, 8) + "…";
}

function getExtLabel(ext) {
  return (ext || "").toUpperCase().replace("JPEG", "JPG");
}

function getTipoLabel(tipo) {
  return TIPO_DOC_LABELS[tipo] ?? tipo ?? "—";
}

// Mapa de eventos del historial → label + ícono
const EVENTO_CONFIG = {
  SUBIDA:        { label: "Documento subido",        Icon: Upload,       color: "bg-blue-100 text-blue-600"   },
  PROCESADO:     { label: "Procesado por IA",         Icon: CheckCircle,  color: "bg-green-100 text-green-600" },
  RENOMBRADO:    { label: "Archivo renombrado",       Icon: Pencil,       color: "bg-purple-100 text-purple-600"},
  ELIMINADO:     { label: "Documento eliminado",      Icon: Trash2,       color: "bg-red-100 text-red-600"     },
  DESCARGADO:    { label: "Archivo descargado",       Icon: Download,     color: "bg-teal-100 text-teal-600"   },
  ACTUALIZADO:   { label: "Documento actualizado",    Icon: RotateCcw,    color: "bg-amber-100 text-amber-600" },
  VISTO:         { label: "Documento visualizado",    Icon: Eye,          color: "bg-gray-100 text-gray-500"   },
  TICKET:        { label: "Ticket levantado",         Icon: Ticket,       color: "bg-orange-100 text-orange-600"},
  LOGIN:         { label: "Acceso de usuario",        Icon: LogIn,        color: "bg-indigo-100 text-indigo-600"},
};

function getEventoCfg(tipo) {
  return EVENTO_CONFIG[tipo] ?? { label: tipo, Icon: Activity, color: "bg-gray-100 text-gray-500" };
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function FileIcon({ ext, suspicious }) {
  const isImg = ["jpg", "jpeg", "png", "webp"].includes((ext || "").toLowerCase());
  const cls   = suspicious ? "text-red-500" : isImg ? "text-green-500" : "text-red-500";
  return isImg ? <FileImage className={cls} size={20} /> : <FileText className={cls} size={20} />;
}

function DocBadge({ tipo }) {
  const label = getTipoLabel(tipo);
  const styles = {
    "INE":                "bg-orange-100 text-orange-700 border-orange-200",
    "Pasaporte":          "bg-emerald-100 text-emerald-700 border-emerald-200",
    "Acta de nacimiento": "bg-amber-100 text-amber-700 border-amber-200",
    "CURP":               "bg-purple-100 text-purple-700 border-purple-200",
    "Constancia SAT":     "bg-indigo-100 text-indigo-700 border-indigo-200",
    "Constancia Fiscal":  "bg-teal-100 text-teal-700 border-teal-200",
    "Declaración SAT":    "bg-blue-100 text-blue-700 border-blue-200",
    "Declaración Anual":  "bg-sky-100 text-sky-700 border-sky-200",
    "Reporte de Derrame": "bg-amber-100 text-amber-700 border-amber-200",
  };
  return (
    <span className={`whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-medium border ${
      styles[label] ?? "bg-gray-100 text-gray-700 border-gray-200"
    }`}>
      {label}
    </span>
  );
}

function EstadoBadge({ estado }) {
  const map = {
    procesado:  { label: "Procesado",  cls: "bg-green-100 text-green-700",   Icon: CheckCircle  },
    procesando: { label: "Procesando", cls: "bg-yellow-100 text-yellow-700", Icon: Clock        },
    error:      { label: "Error",      cls: "bg-red-100 text-red-700",       Icon: AlertCircle  },
  };
  const { label, cls, Icon } = map[estado] ?? { label: estado, cls: "bg-gray-100 text-gray-700", Icon: FileQuestion };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>
      <Icon size={12} /> {label}
    </span>
  );
}

function VencimientoBadge({ estado }) {
  const map = {
    VIGENTE:        { label: "Vigente",         cls: "bg-green-100 text-green-700"   },
    PROXIMO_VENCER: { label: "Próx. a vencer",  cls: "bg-yellow-100 text-yellow-700" },
    VENCIDO:        { label: "Vencido",         cls: "bg-red-100 text-red-700"       },
    SIN_FECHA:      { label: "Sin fecha",       cls: "bg-gray-100 text-gray-500"     },
  };
  const { label, cls } = map[estado] ?? { label: estado, cls: "bg-gray-100 text-gray-600" };
  return (
    <span className={`whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

// ─── Modal de Detalles ────────────────────────────────────────────────────────

function DetailsModal({ doc, onClose, supabase }) {
  const [timeline,        setTimeline]        = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(true);

  const extracted   = Object.entries(doc.datos_extraidos ?? {});
  const datosEx     = doc.datos_extraidos ?? {};
  const esDerrame   = (doc.tipo_doc || "").toUpperCase() === "REPORTE_DERRAME";
  // REPORTE_DERRAME: fecha_limite_pago calculada en backend, guardada en datos_extraidos
  const fechaLimitePago = esDerrame
    ? (datosEx.fecha_limite_pago?.valor || datosEx.fecha_limite_pago || null)
    : null;
  const pagoVencido  = esDerrame && fechaLimitePago && new Date(fechaLimitePago) < new Date();
  const pagoDias     = esDerrame && fechaLimitePago
    ? Math.ceil((new Date(fechaLimitePago) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  const pagoProximo  = !pagoVencido && pagoDias !== null && pagoDias <= 10;

  // Cargar historial dinámico desde historial_documentos + tickets
  useEffect(() => {
    let isMounted = true;
    const fetchTimeline = async () => {
      setLoadingTimeline(true);

      const [{ data: eventos }, { data: ticketsDoc }] = await Promise.all([
        supabase
          .from("historial_documentos")
          .select("*, actor:uid_usuario(nombre, apellido, email)")
          .eq("doc_id", doc.id)
          .order("creado_en", { ascending: true }),
        supabase
          .from("tickets")
          .select("*, usuario:uid_usuario(nombre, apellido, email)")
          .eq("documento_id", doc.id)
          .order("creado_en", { ascending: true }),
      ]);

      if (!isMounted) return;

      const items = [];

      // Eventos de historial_documentos
      for (const e of eventos || []) {
        const actorNombre = e.actor?.nombre
          ? `${e.actor.nombre} ${e.actor.apellido || ""}`.trim()
          : "Sistema";
        items.push({
          tipo:    e.evento,
          label:   getEventoCfg(e.evento).label,
          detalle: e.detalle || null,
          date:    e.creado_en,
          user:    actorNombre,
        });
      }

      // Tickets relacionados al documento
      for (const t of ticketsDoc || []) {
        const usuNombre = t.usuario?.nombre
          ? `${t.usuario.nombre} ${t.usuario.apellido || ""}`.trim()
          : "Usuario";
        items.push({
          tipo:    "TICKET",
          label:   "Ticket levantado",
          detalle: `[${t.tipo}] ${t.descripcion}`,
          date:    t.creado_en,
          user:    usuNombre,
        });
      }

      // Si no hay eventos en historial, construir desde el doc mismo como fallback
      if (items.length === 0) {
        items.push({
          tipo: "SUBIDA", label: "Documento subido",
          date: doc.creado_en, user: getUserLabel(doc), detalle: null,
        });
        if (doc.estado === "procesado") {
          items.push({
            tipo: "PROCESADO", label: "Procesado por IA",
            date: doc.actualizado_en, user: "Sistema", detalle: null,
          });
        }
      }

      // Ordenar cronológicamente
      items.sort((a, b) => new Date(a.date) - new Date(b.date));
      setTimeline(items);
      setLoadingTimeline(false);
    };

    fetchTimeline();
    return () => { isMounted = false; };
  }, [doc.id, doc.creado_en, doc.actualizado_en, doc.estado, supabase]);

  return (
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/80">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
            <FileIcon ext={doc.extension} suspicious={doc.sospechoso} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900 truncate max-w-xs">{doc.filename}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <EstadoBadge estado={doc.estado} />
              <VencimientoBadge estado={doc.vencimiento_estado} />
            </div>
          </div>
        </div>
        <button onClick={onClose}
          className="text-gray-400 hover:text-gray-700 bg-white p-2 rounded-xl shadow-sm border border-gray-100 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
        {/* Métricas rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
          <div><p className="text-xs text-gray-500 mb-1">Usuario</p><p className="font-bold text-sm text-gray-900 truncate">{getUserLabel(doc)}</p></div>
          <div><p className="text-xs text-gray-500 mb-1">Tamaño</p><p className="font-bold text-sm text-gray-900">{formatBytes(doc.tamano)}</p></div>
          <div><p className="text-xs text-gray-500 mb-1">Documento</p><DocBadge tipo={doc.tipo_doc} /></div>
          <div><p className="text-xs text-gray-500 mb-1">Descargas</p><p className="font-bold text-sm text-gray-900">{doc.descargas ?? 0}</p></div>
          <div><p className="text-xs text-gray-500 mb-1">Subido</p><p className="font-bold text-sm text-gray-900">{formatDate(doc.creado_en)}</p></div>
          <div>
            <p className="text-xs text-gray-500 mb-1">{esDerrame ? "Límite de Pago" : "Vencimiento"}</p>
            <p className={`font-bold text-sm ${
              esDerrame
                ? pagoVencido ? "text-red-600" : pagoProximo ? "text-amber-600" : "text-gray-900"
                : "text-gray-900"
            }`}>
              {esDerrame ? formatDate(fechaLimitePago) : formatDate(doc.fecha_vencimiento)}
            </p>
          </div>
          <div><p className="text-xs text-gray-500 mb-1">Versión</p><p className="font-bold text-sm text-gray-900">v{doc.version ?? 1}</p></div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Revisión</p>
            <span className={`text-xs font-semibold ${doc.requiere_revision ? "text-amber-600" : "text-green-600"}`}>
              {doc.requiere_revision ? "⚠ Pendiente" : "✓ OK"}
            </span>
          </div>
        </div>

        {/* Resumen IA */}
        {doc.resumen_ia && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-blue-600 mb-1.5 uppercase tracking-wide">Resumen IA</p>
            <p className="text-sm text-gray-700 leading-relaxed">{doc.resumen_ia}</p>
          </div>
        )}

        {/* Alertas de calidad */}
        {(doc.calidad_imagen?.advertencias ?? []).length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
            <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-600 mb-1 uppercase tracking-wide">Advertencias de calidad</p>
              {doc.calidad_imagen.advertencias.map((a, i) => (
                <p key={i} className="text-sm text-amber-800">• {a}</p>
              ))}
            </div>
          </div>
        )}

        {/* ── PANEL REPORTE DE DERRAME ───────────────────────────────────── */}
        {esDerrame && (
          <>
            {/* Alerta de pago */}
            {(pagoVencido || pagoProximo) && (
              <div className={`rounded-2xl p-4 flex gap-3 border ${
                pagoVencido
                  ? "bg-red-50 border-red-100"
                  : "bg-amber-50 border-amber-100"
              }`}>
                <AlertTriangle size={16} className={`mt-0.5 shrink-0 ${pagoVencido ? "text-red-500" : "text-amber-500"}`} />
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${pagoVencido ? "text-red-600" : "text-amber-600"}`}>
                    {pagoVencido ? "Pago vencido" : "Pago próximo a vencer"}
                  </p>
                  <p className={`text-sm ${pagoVencido ? "text-red-800" : "text-amber-800"}`}>
                    {pagoVencido
                      ? `La fecha límite de pago (${formatDate(fechaLimitePago)}) ha vencido. Requiere atención administrativa.`
                      : `Quedan ${pagoDias} día${pagoDias !== 1 ? "s" : ""} para el límite de pago (${formatDate(fechaLimitePago)}).`
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Grid de campos del incidente */}
            <div>
              <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide flex items-center gap-2">
                <Droplets size={13} className="text-amber-500" /> Datos del Incidente
              </p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {[
                  { label: "Aerolínea",       val: datosEx.empresa_responsable?.valor || datosEx.empresa_responsable },
                  { label: "Matrícula",        val: datosEx.matricula_aeronave?.valor  || datosEx.matricula_aeronave  },
                  { label: "N° de Vuelo",      val: datosEx.numero_vuelo?.valor        || datosEx.numero_vuelo        },
                  { label: "Combustible",      val: datosEx.tipo_combustible?.valor    || datosEx.tipo_combustible    },
                  { label: "Fecha incidente",  val: datosEx.fecha_incidente?.valor     || datosEx.fecha_incidente     },
                  { label: "Hora",             val: datosEx.hora_incidente?.valor      || datosEx.hora_incidente      },
                  { label: "Volumen derrame",  val: datosEx.volumen_derrame?.valor     || datosEx.volumen_derrame     },
                  { label: "Tipo de derrame",  val: datosEx.tipo_derrame?.valor        || datosEx.tipo_derrame        },
                  { label: "Folio informe",    val: datosEx.folio_informe?.valor       || datosEx.folio_informe       },
                  { label: "Reportado por",    val: datosEx.reportado_por?.valor       || datosEx.reportado_por       },
                ].filter(f => f.val).map(({ label, val }) => (
                  <div key={label} className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                    <p className="text-xs text-amber-600 font-medium capitalize mb-0.5">{label}</p>
                    <p className="font-semibold text-sm text-gray-900 truncate">{val}</p>
                  </div>
                ))}
              </div>

              {/* Ubicación — ancho completo */}
              {(datosEx.ubicacion_lugar?.valor || datosEx.ubicacion_lugar) && (
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 mb-2">
                  <p className="text-xs text-amber-600 font-medium mb-0.5">Ubicación / Posición</p>
                  <p className="font-semibold text-sm text-gray-900">
                    {datosEx.ubicacion_lugar?.valor || datosEx.ubicacion_lugar}
                  </p>
                </div>
              )}

              {/* Medidas de contención — ancho completo */}
              {(datosEx.medidas_contencion?.valor || datosEx.medidas_contencion) && (
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium mb-1">Medidas de contención (Sección B)</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {datosEx.medidas_contencion?.valor || datosEx.medidas_contencion}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Datos extraídos */}
        {extracted.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">
              {esDerrame ? "Todos los campos extraídos" : "Datos extraídos"}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {extracted.map(([key, val]) => {
                const display = val && typeof val === "object" && val.valor != null
                  ? String(val.valor)
                  : typeof val === "string" ? val : null;
                if (!display || display === "null") return null;
                return (
                  <div key={key} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 capitalize mb-0.5">{key.replace(/_/g, " ")}</p>
                    <p className="font-semibold text-sm text-gray-900">{display}</p>
                    {val?.confianza && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Confianza: {Math.round(val.confianza * 100)}%
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Historial de acciones dinámico */}
        <div>
          <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">
            <Activity size={16} className="text-blue-600" /> Historial de acciones
          </h4>
          {loadingTimeline ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="w-8 h-8 bg-gray-100 rounded-full shrink-0" />
                  <div className="flex-1 h-16 bg-gray-50 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : timeline.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Sin historial disponible</p>
          ) : (
            <div className="space-y-3 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
              {timeline.map((item, idx) => {
                const cfg = getEventoCfg(item.tipo);
                const Icon = cfg.Icon;
                return (
                  <div key={idx} className="relative flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center mt-1 relative z-10 shadow-sm ${cfg.color}`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 bg-white hover:bg-gray-50 transition-colors p-3.5 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-sm">{item.label}</span>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                          {formatDateTime(item.date)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Por: <span className="font-semibold text-gray-900">{item.user}</span>
                      </p>
                      {item.detalle && (
                        <p className="text-xs text-gray-500 mt-1 bg-gray-50 px-2 py-1 rounded-lg">{item.detalle}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info adicional */}
        {doc.info_adicional && doc.info_adicional !== "{}" && doc.info_adicional !== "" && (
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Info adicional</p>
            <p className="text-sm text-gray-600">{doc.info_adicional}</p>
          </div>
        )}

        {/* Descargar */}
        {doc.url_archivo && (
          <a href={doc.url_archivo} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm">
            <Download size={16} /> Descargar archivo
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function DocumentosAdminPage() {
  const supabase = useMemo(() => createClient(), []);

  const [documents,      setDocuments]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [searchTerm,     setSearchTerm]     = useState("");
  const [filterTipo,     setFilterTipo]     = useState("Todos");
  const [filterExt,      setFilterExt]      = useState("Todos");
  const [itemsPerPage,   setItemsPerPage]   = useState(10);
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [openDropdown,   setDropdownOpen]   = useState(null);
  const [selectedDoc,    setSelectedDoc]    = useState(null);
  const [modalType,      setModalType]      = useState(null);
  const [totalStorageMB, setTotalStorageMB] = useState(0);
  const limiteMB = 1024;

  // ── Fetch ───────────────────────────────────────────────────────

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("documentos")
      .select("*, usuarios:uid_usuario(nombre, apellido, email)")
      .is("eliminado_en", null)
      .order("creado_en", { ascending: false });

    if (error) {
      console.error("Error al obtener documentos:", error.message);
    } else {
      const docs = data ?? [];
      setDocuments(docs);
      const totalBytes = docs.reduce((acc, d) => acc + (d.tamano ?? 0), 0);
      setTotalStorageMB(formatBytesToMB(totalBytes));
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  // ── Métricas ─────────────────────────────────────────────────────

  const subidosHoy = documents.filter(d => isToday(d.creado_en)).length;

  const topUsuario = useMemo(() => {
    const counts = {};
    for (const doc of documents) {
      if (!counts[doc.uid_usuario]) {
        counts[doc.uid_usuario] = { label: getUserLabel(doc), count: 0 };
      }
      counts[doc.uid_usuario].count++;
    }
    return Object.values(counts).sort((a, b) => b.count - a.count)[0]?.label ?? "—";
  }, [documents]);

  const porcentaje        = Math.min((totalStorageMB / limiteMB) * 100, 100);
  const isStorageCritical = porcentaje >= 90;

  // ── Filtros ──────────────────────────────────────────────────────

  const extOptions = ["Todos", ...Array.from(new Set(documents.map(d => getExtLabel(d.extension)).filter(Boolean)))];

  const filteredDocs = documents.filter(doc => {
    const term        = searchTerm.toLowerCase();
    const matchSearch = doc.filename.toLowerCase().includes(term) ||
                        getUserLabel(doc).toLowerCase().includes(term);
    const matchTipo   = filterTipo === "Todos" ||
                        getTipoLabel(doc.tipo_doc) === filterTipo;
    const matchExt    = filterExt === "Todos" || getExtLabel(doc.extension) === filterExt;
    return matchSearch && matchTipo && matchExt;
  });

  // null = todos
  const displayedDocs = itemsPerPage === null ? filteredDocs : filteredDocs.slice(0, itemsPerPage);

  // ── Acciones ─────────────────────────────────────────────────────

  const openModal = (type, doc) => {
    setSelectedDoc(doc); setModalType(type); setOpenActionMenu(null);
  };

  const closeModal = () => { setSelectedDoc(null); setModalType(null); };

  const handleDelete = async () => {
    if (!selectedDoc) return;
    // Hard delete + storage
    if (selectedDoc.storage_path) {
      await supabase.storage.from("documentos").remove([selectedDoc.storage_path]);
    }
    await supabase.from("documentos").delete().eq("id", selectedDoc.id);
    setDocuments(d => d.filter(x => x.id !== selectedDoc.id));
    closeModal();
  };

  const toggleSospechoso = async (doc, e) => {
    e.stopPropagation();
    const newVal = !doc.sospechoso;
    const { error } = await supabase.from("documentos").update({ sospechoso: newVal }).eq("id", doc.id);
    if (!error) setDocuments(d => d.map(x => x.id === doc.id ? { ...x, sospechoso: newVal } : x));
    setOpenActionMenu(null);
  };

  const handleDropdown = (e, name) => {
    e.stopPropagation();
    setDropdownOpen(openDropdown === name ? null : name);
    setOpenActionMenu(null);
  };

  // ── Render ───────────────────────────────────────────────────────

  return (
    <ProtectedRoute>
      <div
        className="w-full flex flex-col gap-5 p-4 md:p-6 pt-2 md:pt-3"
        onClick={() => { setOpenActionMenu(null); setDropdownOpen(null); }}
      >
        {/* ENCABEZADO */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Documentos</h1>
            <p className="text-sm text-gray-500 mt-0.5">Monitorea y administra INE, Pasaportes, Actas, Reportes de Derrame y más.</p>
          </div>
          <button onClick={fetchDocuments}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>

        {/* MÉTRICAS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Documentos totales", value: documents.length,  icon: <FileText size={22} />, bg: "bg-blue-50",   color: "text-blue-600"   },
            { label: "Subidos hoy",         value: subidosHoy,        icon: <Upload size={22} />,   bg: "bg-emerald-50",color: "text-emerald-600" },
            {
              label: "Almacenamiento",
              value: loading ? "—" : `${totalStorageMB} MB`,
              sub:   `/ ${limiteMB} MB`,
              icon:  <HardDrive size={22} />,
              bg:    isStorageCritical ? "bg-red-50" : "bg-amber-50",
              color: isStorageCritical ? "text-red-600" : "text-amber-600",
              bar:   true,
            },
            { label: "Top Usuario", value: topUsuario, icon: <Users size={22} />, bg: "bg-purple-50", color: "text-purple-600" },
          ].map((card, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              {card.bar && (
                <div className="absolute bottom-0 left-0 h-1 transition-all duration-1000 rounded-b-2xl"
                  style={{ width: `${porcentaje}%`, background: isStorageCritical ? "#EF4444" : "#F59E0B" }} />
              )}
              <div className="flex items-center gap-3">
                <div className={`p-2.5 ${card.bg} ${card.color} rounded-xl`}>{card.icon}</div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                  <h3 className="text-xl font-bold text-gray-900 truncate">
                    {loading ? <span className="animate-pulse text-gray-300">—</span> : card.value}
                    {card.sub && <span className="text-sm font-normal text-gray-400 ml-1">{card.sub}</span>}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FILTROS */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center z-20">
          <div className="relative w-full xl:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input type="text" placeholder="Buscar por nombre o usuario..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all hover:bg-gray-50"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={16} className="text-gray-400 shrink-0" />
            <span className="text-sm font-semibold text-gray-600 mr-1">Filtros:</span>

            {/* Tipo de doc */}
            <div className="relative">
              <button onClick={e => handleDropdown(e, "tipo")}
                className={`flex items-center gap-2 px-3 py-2 bg-white border rounded-xl text-sm transition-all min-w-[160px] ${
                  openDropdown === "tipo" ? "border-blue-500 ring-2 ring-blue-500/20" : "border-gray-200 hover:border-gray-300"
                }`}>
                <span className="text-gray-700 truncate flex-1">Doc: {filterTipo}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform shrink-0 ${openDropdown === "tipo" ? "rotate-180" : ""}`} />
              </button>
              {openDropdown === "tipo" && (
                <div className="absolute top-full mt-1 left-0 min-w-[200px] bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1.5 max-h-64 overflow-y-auto">
                  {TIPO_DOC_FILTER_OPTIONS.map(opt => (
                    <button key={opt} onClick={() => { setFilterTipo(opt); setDropdownOpen(null); }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${filterTipo === opt ? "bg-blue-600 text-white font-medium" : "text-gray-700 hover:bg-gray-50"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Extensión */}
            <div className="relative">
              <button onClick={e => handleDropdown(e, "ext")}
                className={`flex items-center gap-2 px-3 py-2 bg-white border rounded-xl text-sm transition-all min-w-[140px] ${
                  openDropdown === "ext" ? "border-blue-500 ring-2 ring-blue-500/20" : "border-gray-200 hover:border-gray-300"
                }`}>
                <span className="text-gray-700 flex-1">Formato: {filterExt}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform shrink-0 ${openDropdown === "ext" ? "rotate-180" : ""}`} />
              </button>
              {openDropdown === "ext" && (
                <div className="absolute top-full mt-1 left-0 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1.5">
                  {extOptions.map(opt => (
                    <button key={opt} onClick={() => { setFilterExt(opt); setDropdownOpen(null); }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${filterExt === opt ? "bg-blue-600 text-white font-medium" : "text-gray-700 hover:bg-gray-50"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Items por página */}
            <div className="relative">
              <button onClick={e => handleDropdown(e, "limit")}
                className={`flex items-center gap-2 px-3 py-2 bg-white border rounded-xl text-sm transition-all min-w-[120px] ${
                  openDropdown === "limit" ? "border-blue-500 ring-2 ring-blue-500/20 text-blue-600" : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}>
                <List size={14} className="shrink-0" />
                <span className="flex-1">{itemsPerPage === null ? "Todos" : `Ver ${itemsPerPage}`}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform shrink-0 ${openDropdown === "limit" ? "rotate-180" : ""}`} />
              </button>
              {openDropdown === "limit" && (
                <div className="absolute top-full mt-1 right-0 min-w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1.5">
                  {[5, 10, 20, 50, null].map(opt => (
                    <button key={opt ?? "all"} onClick={() => { setItemsPerPage(opt); setDropdownOpen(null); }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${itemsPerPage === opt ? "bg-blue-600 text-white font-medium" : "text-gray-700 hover:bg-gray-50"}`}>
                      {opt === null ? "Ver todos" : `Ver ${opt}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TABLA */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="py-3.5 px-5">Archivo</th>
                  <th className="py-3.5 px-5">Usuario</th>
                  <th className="py-3.5 px-5">Tamaño</th>
                  <th className="py-3.5 px-5 min-w-[160px]">Tipo doc.</th>
                  <th className="py-3.5 px-5 min-w-[160px]">Estado</th>
                  <th className="py-3.5 px-5">Última actualización</th>
                  <th className="py-3.5 px-5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="py-3.5 px-5">
                          <div className="h-4 bg-gray-100 rounded-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : displayedDocs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      No se encontraron documentos con los filtros seleccionados.
                    </td>
                  </tr>
                ) : displayedDocs.map(doc => (
                  <tr key={doc.id}
                    className={`transition-colors group ${doc.sospechoso ? "bg-red-50 hover:bg-red-100/60" : "hover:bg-gray-50/60"}`}>

                    {/* Archivo */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${doc.sospechoso ? "bg-red-100" : "bg-gray-50 border border-gray-100"}`}>
                          <FileIcon ext={doc.extension} suspicious={doc.sospechoso} />
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 block max-w-[200px] truncate" title={doc.filename}>
                            {doc.filename}
                          </span>
                          <span className={`text-xs ${doc.sospechoso ? "text-red-600 font-medium" : "text-gray-400"}`}>
                            {doc.sospechoso ? "⚠️ Sospechoso" : getExtLabel(doc.extension)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Usuario */}
                    <td className="py-3.5 px-5 font-medium text-gray-700 whitespace-nowrap">
                      {getUserLabel(doc)}
                    </td>

                    {/* Tamaño */}
                    <td className="py-3.5 px-5 text-gray-600 whitespace-nowrap">
                      {formatBytes(doc.tamano)}
                    </td>

                    {/* Tipo doc */}
                    <td className="py-3.5 px-5">
                      <DocBadge tipo={doc.tipo_doc} />
                    </td>

                    {/* Estado */}
                    <td className="py-3.5 px-5">
                      <div className="flex flex-col gap-1.5 items-start">
                        <EstadoBadge estado={doc.estado} />
                        {doc.vencimiento_alerta && doc.vencimiento_estado && (
                          <VencimientoBadge estado={doc.vencimiento_estado} />
                        )}
                      </div>
                    </td>

                    {/* Fechas */}
                    <td className="py-3.5 px-5 text-gray-600">
                      <span className="font-medium text-gray-800 block">{relativeTime(doc.actualizado_en)}</span>
                      <span className="text-xs text-gray-400">Creado: {formatDate(doc.creado_en)}</span>
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-5 text-center relative">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setOpenActionMenu(openActionMenu === doc.id ? null : doc.id);
                          setDropdownOpen(null);
                        }}
                        className={`p-2 rounded-xl transition-all ${
                          openActionMenu === doc.id ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                        }`}>
                        <MoreVertical size={18} />
                      </button>

                      {openActionMenu === doc.id && (
                        <div className="absolute right-12 top-8 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 py-2 text-left">
                          <button onClick={() => openModal("details", doc)}
                            className="w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors font-medium">
                            <Eye size={16} className="text-gray-400" /> Ver detalles y datos
                          </button>
                          {doc.url_archivo && (
                            <a href={doc.url_archivo} target="_blank" rel="noopener noreferrer"
                              className="w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors font-medium">
                              <Download size={16} className="text-gray-400" /> Descargar archivo
                            </a>
                          )}
                          <div className="h-px bg-gray-100 my-1" />
                          <button onClick={e => toggleSospechoso(doc, e)}
                            className="w-full px-4 py-2.5 text-sm text-purple-600 hover:bg-purple-50 flex items-center gap-3 transition-colors font-medium">
                            <ShieldAlert size={16} />
                            {doc.sospechoso ? "Quitar sospechoso" : "Marcar sospechoso"}
                          </button>
                          <button onClick={() => openModal("delete", doc)}
                            className="w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors font-medium">
                            <Trash2 size={16} /> Eliminar documento
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && filteredDocs.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
              <span>
                Mostrando {displayedDocs.length} de {filteredDocs.length} resultado{filteredDocs.length !== 1 ? "s" : ""}
              </span>
              {filteredDocs.length !== documents.length && (
                <span>{documents.length} documentos en total</span>
              )}
            </div>
          )}
        </div>

        {/* MODALES */}
        {modalType && selectedDoc && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            {modalType === "details" && (
              <DetailsModal doc={selectedDoc} onClose={closeModal} supabase={supabase} />
            )}
            {modalType === "delete" && (
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center border border-gray-100">
                <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5 bg-red-50 text-red-600 border border-red-100">
                  <Trash2 size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar documento?</h3>
                <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                  Esto eliminará permanentemente <b className="text-gray-900">{selectedDoc.filename}</b> del storage y la base de datos.
                </p>
                <div className="flex gap-3">
                  <button onClick={closeModal}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors shadow-sm">
                    Cancelar
                  </button>
                  <button onClick={handleDelete}
                    className="flex-1 px-4 py-2.5 text-white font-semibold rounded-xl transition-all shadow-sm bg-red-600 hover:bg-red-700">
                    Confirmar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}