"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import SubirDocumento from "@/components/SubirDocumento";
import ProtectedRoute from "@/components/ProtectedRoute";
import { createClient } from "@/app/lib/supabase/client";
import {
  Upload, FileText, Eye, CreditCard, FileBadge, Download,
  Trash2, Pencil, X, Calendar, HardDrive, AlertTriangle,
  CheckCircle2, Clock, ScrollText, UserCheck, Receipt,
  Loader2, Moon, Info, XCircle, Bot,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const formatFecha = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit", month: "long", year: "numeric",
  });
};

const formatFechaConHora = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
};

const formatDatoExtraidoKey = (key) => {
  if (!key) return "";
  return key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
};

const formatDatoExtraidoValue = (value) => {
  if (typeof value === "boolean") return value ? "Verdadero" : "Falso";
  if (value === "null" || value === "undefined" || value === null) return "—";
  return String(value);
};

// Calcula vencimiento_estado en tiempo real desde fecha_vencimiento
export const calcEstadoVencimiento = (fechaVencimiento) => {
  if (!fechaVencimiento) return "SIN_FECHA";
  const hoy  = new Date(); hoy.setHours(0, 0, 0, 0);
  const venc = new Date(fechaVencimiento); venc.setHours(0, 0, 0, 0);
  const dias = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
  if (dias < 0)   return "VENCIDO";
  if (dias <= 10) return "PROXIMO_VENCER";
  return "VIGENTE";
};

const diasRestantes = (fechaVencimiento) => {
  if (!fechaVencimiento) return null;
  const hoy  = new Date(); hoy.setHours(0, 0, 0, 0);
  const venc = new Date(fechaVencimiento); venc.setHours(0, 0, 0, 0);
  return Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
};

// Tipos de documento que no tienen fecha de vencimiento natural
const TIPOS_SIN_VENCIMIENTO = [
  "ACTA_NACIMIENTO", "FORMATO_CURP", "CONSTANCIA_SITUACION_FISCAL",
];

const colorVenc = (e) =>
  ({
    VIGENTE:        "bg-green-100 text-green-700 border-green-200",
    VENCIDO:        "bg-red-100 text-red-700 border-red-200",
    PROXIMO_VENCER: "bg-yellow-100 text-yellow-700 border-yellow-200",
    SIN_FECHA:      "bg-gray-100 text-gray-500 border-gray-200",
  }[e] ?? "bg-gray-100 text-gray-500 border-gray-200");

const iconoVenc = (e) =>
  ({
    VIGENTE:        <CheckCircle2 size={12} />,
    VENCIDO:        <AlertTriangle size={12} />,
    PROXIMO_VENCER: <Clock size={12} />,
  }[e] ?? null);

const getDocStyle = (tipo) => {
  const t = (tipo || "").toUpperCase();
  if (t === "INE" || t === "CREDENCIAL" || t.includes("INE"))
    return { icon: <CreditCard size={24} />, bg: "bg-green-100", color: "text-green-600", border: "border-green-200", line: "bg-green-400", label: "INE / Credencial" };
  if (t === "PASAPORTE")
    return { icon: <FileBadge size={24} />, bg: "bg-blue-100", color: "text-blue-600", border: "border-blue-200", line: "bg-blue-400", label: "Pasaporte" };
  if (t === "ACTA_NACIMIENTO" || t.includes("ACTA"))
    return { icon: <ScrollText size={24} />, bg: "bg-orange-100", color: "text-orange-600", border: "border-orange-200", line: "bg-orange-400", label: "Acta de Nacimiento" };
  if (t === "FORMATO_CURP")
    return { icon: <UserCheck size={24} />, bg: "bg-purple-100", color: "text-purple-600", border: "border-purple-200", line: "bg-purple-400", label: "CURP" };
  if (t === "CONSTANCIA_SITUACION_FISCAL" || t.includes("CSF") || t.includes("CONSTANCIA") || t.includes("FISCAL"))
    return { icon: <Receipt size={24} />, bg: "bg-teal-100", color: "text-teal-600", border: "border-teal-200", line: "bg-teal-400", label: "Constancia Fiscal" };
  if (t === "DECLARACION_SAT" || t.includes("DECLARACION_ANUAL") || t.includes("DECLARACION"))
    return { icon: <Receipt size={22} />, bg: "bg-red-100", color: "text-red-600", border: "border-red-200", line: "bg-red-400", label: "Declaración SAT" };
  if (t === "PROCESANDO")
    return { icon: <Loader2 size={24} className="animate-spin" />, bg: "bg-gray-100", color: "text-gray-400", border: "border-gray-200", line: "bg-gray-300", label: "Analizando…" };
  return { icon: <FileText size={24} />, bg: "bg-gray-100", color: "text-gray-500", border: "border-gray-200", line: "bg-gray-300", label: tipo || "Otro" };
};

const parseCalidad = (calidad_imagen) => {
  if (!calidad_imagen) return { tieneAdvertencias: false, advertencias: [], calidadInsuficiente: false };
  const advertencias        = calidad_imagen.advertencias || [];
  const calidadInsuficiente = calidad_imagen.calidad_suficiente === false;
  return { tieneAdvertencias: advertencias.length > 0 || calidadInsuficiente, advertencias, calidadInsuficiente };
};

// ─────────────────────────────────────────────────────────────────────────────
//  SUB-COMPONENTES
// ─────────────────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return <div className="bg-white p-5 rounded-2xl border border-gray-100 animate-pulse h-44" />;
}

function ProcessingCard({ doc, idx, onCancel, cancelling }) {
  return (
    <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-blue-100 shadow-sm flex flex-col gap-4 cursor-default select-none">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(90deg,transparent 0%,rgba(59,130,246,.06) 50%,transparent 100%)", backgroundSize: "200% 100%", animation: "shimmer 2s linear infinite" }} />
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
      <div className="flex items-center gap-3 relative z-10">
        <span className="text-xs font-bold text-gray-300">{String(idx + 1).padStart(2, "0")}</span>
        <div className="h-[2px] flex-1 bg-blue-100 rounded-full" />
      </div>
      <div className="flex gap-4 relative z-10 items-center">
        <div className="bg-blue-50 text-blue-400 p-3 rounded-xl h-fit shrink-0">
          {cancelling ? <Loader2 size={24} className="animate-spin text-red-400" /> : <Loader2 size={24} className="animate-spin" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800">{cancelling ? "Cancelando…" : "Analizando documento…"}</h3>
          <p className="text-sm text-gray-500 truncate">{doc.filename}</p>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Clock size={10} /> El análisis continúa en segundo plano</p>
        </div>
        <button onClick={() => onCancel(doc.id)} disabled={cancelling}
          className="text-gray-400 hover:text-red-500 transition shrink-0 p-2 rounded-full hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed">
          <XCircle size={24} />
        </button>
      </div>
    </div>
  );
}

function DocumentPreview({ path, supabase }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchUrl = async () => {
      setLoading(true);
      const { data, error } = await supabase.storage.from("documentos").createSignedUrl(path, 60);
      if (!error && isMounted && data) setUrl(data.signedUrl);
      if (isMounted) setLoading(false);
    };
    fetchUrl();
    const interval = setInterval(fetchUrl, 50000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [path, supabase]);

  return (
    <div className="w-full mt-4">
      <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
        {loading && (
          <div className="flex items-center justify-center h-48 sm:h-64">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-blue-500" size={24} />
              <p className="text-sm text-gray-500 font-medium animate-pulse">Cargando preview...</p>
            </div>
          </div>
        )}
        {!loading && url && <iframe src={url} className="w-full h-64 sm:h-96" title="Vista previa del documento" />}
        {!loading && !url && (
          <div className="flex flex-col items-center justify-center h-48 sm:h-64 gap-2">
            <AlertTriangle className="text-red-400" size={28} />
            <p className="text-sm text-red-500 font-medium">Error al cargar la vista previa</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AccionBtn({ icon, label, cls, onClick, disabled, loading }) {
  return (
    <button onClick={onClick} disabled={disabled || loading}
      className={`flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl transition ${cls} disabled:opacity-40 disabled:cursor-not-allowed`}>
      {loading ? <Loader2 size={18} className="animate-spin" /> : icon}
      <span className="text-[11px] font-semibold leading-none">{label}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function DocumentosPage() {
  const router   = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [documentos,    setDocumentos]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [selectedDoc,   setSelectedDoc]   = useState(null);
  const [showUpload,    setShowUpload]    = useState(false);
  const [imagenUrl,     setImagenUrl]     = useState(null);
  const [renombrando,   setRenombrando]   = useState(false);
  const [nuevoNombre,   setNuevoNombre]   = useState("");
  const [guardandoNombre, setGuardandoNombre] = useState(false);
  const [eliminando,    setEliminando]    = useState(false);
  const [descargando,   setDescargando]   = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [cancellingIds, setCancellingIds] = useState(new Set());
  const [modalProc,     setModalProc]     = useState(false);
  const [docProcListo,  setDocProcListo]  = useState(false);
  const [docProcError,  setDocProcError]  = useState(null);
  const [docProcInfo,   setDocProcInfo]   = useState(null);
  const [renombreError, setRenombreError] = useState(null);

  const pollRef = useRef(null);

  // ── Cargar ─────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("documentos")
      .select("*")
      .is("eliminado_en", null)
      .neq("estado", "cancelado")
      .order("creado_en", { ascending: false });
    setDocumentos(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { cargar(); }, [cargar]);

  // ── Sincronizar vencimiento_estado con la fecha actual en DB ───
  useEffect(() => {
    if (!documentos.length) return;
    const syncVencimientos = async () => {
      const updates = [];
      documentos
        .filter((d) => d.fecha_vencimiento && d.estado === "procesado")
        .forEach((d) => {
          const calculado = calcEstadoVencimiento(d.fecha_vencimiento);
          if (calculado !== d.vencimiento_estado) updates.push({ id: d.id, vencimiento_estado: calculado });
        });
      if (!updates.length) return;
      await Promise.all(
        updates.map((u) =>
          supabase.from("documentos").update({ vencimiento_estado: u.vencimiento_estado }).eq("id", u.id)
        )
      );
      setDocumentos((prev) =>
        prev.map((d) => {
          const u = updates.find((x) => x.id === d.id);
          return u ? { ...d, vencimiento_estado: u.vencimiento_estado } : d;
        })
      );
    };
    syncVencimientos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentos.length, supabase]);

  /* ── Polling OCR ───────────────────────────────────────────────── */
  useEffect(() => {
    const ids = documentos.filter((d) => d.estado === "procesando").map((d) => d.id);
    clearInterval(pollRef.current);
    if (!ids.length) return;
    pollRef.current = setInterval(async () => {
      const checks = await Promise.all(
        ids.map((id) => fetch(`/api/ocr/documento-estado/${id}`).then((r) => r.json()).catch(() => null))
      );
      let hayListo = false, ultimoListo = null;
      for (const c of checks) {
        if (!c) continue;
        if (c.listo) {
          hayListo = true; ultimoListo = c;
          setDocumentos((prev) =>
            prev.map((d) => d.id === c.id ? { ...d, estado: "procesado", tipo_doc: c.tipo_doc, resumen_ia: c.resumen } : d)
          );
        } else if (c.error) { setDocProcError(c.error); }
      }
      if (hayListo) { setDocProcListo(true); setDocProcInfo(ultimoListo); setModalProc(true); cargar(); }
    }, 4000);
    return () => clearInterval(pollRef.current);
  }, [documentos, cargar]);

  const handleSuccess = (data) => {
    setShowUpload(false); cargar();
    if (data?.doc_id && data?.estado === "procesando") {
      setDocProcListo(false); setDocProcError(data?.error || null);
      setDocProcInfo({ filename: data.metadata?.filename || "tu documento" }); setModalProc(true);
    }
  };

  useEffect(() => () => clearInterval(pollRef.current), []);

  /* ── Cancelar análisis ─────────────────────────────────────────── */
  const handleCancelarAnalisis = async (id) => {
    if (cancellingIds.has(id)) return;
    setCancellingIds((prev) => new Set([...prev, id]));
    const doc = documentos.find((d) => d.id === id);
    try {
      await supabase.from("documentos").update({ estado: "cancelado", eliminado_en: new Date().toISOString() }).eq("id", id);
      if (doc?.storage_path) await supabase.storage.from("documentos").remove([doc.storage_path]);
      await supabase.from("documentos").delete().eq("id", id);
      setDocumentos((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      console.error("Error al cancelar análisis:", e);
      setCancellingIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  /* ── Abrir detalle ──────────────────────────────────────────────── */
  const abrirDetalle = async (doc) => {
    if (doc.estado === "procesando") return;
    setSelectedDoc(doc); setConfirmDelete(false); setRenombrando(false); setRenombreError(null);
    if (doc.storage_path) {
      const { data } = await supabase.storage.from("documentos").createSignedUrl(doc.storage_path, 3600);
      setImagenUrl(data?.signedUrl || null);
    }
  };

  const cerrarDetalle = () => {
    setSelectedDoc(null); setImagenUrl(null); setConfirmDelete(false);
    setRenombrando(false); setRenombreError(null);
  };

  /* ── DESCARGA — fetch → Blob → link (evita abrir en misma ventana) ── */
  const handleDescargar = async () => {
    if (!imagenUrl || descargando) return;
    setDescargando(true);
    try {
      const response = await fetch(imagenUrl);
      if (!response.ok) throw new Error("Error al obtener el archivo");
      const blob    = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a       = document.createElement("a");
      a.href        = blobUrl;
      a.download    = selectedDoc.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Error al descargar:", err);
    } finally {
      setDescargando(false);
    }
  };

/* ── RENOMBRAR — usa el route handler del servidor para saltarse RLS ── */
const handleRenombrar = async () => {
  const trimmed = nuevoNombre.trim();
  if (!trimmed || trimmed === selectedDoc.filename) {
    setRenombrando(false);
    return;
  }
  setGuardandoNombre(true);
  setRenombreError(null);

  try {
    // Usamos el route handler PATCH /api/ocr/documentos/[id]
    // que corre en el servidor con createClient() sin restricciones de RLS
    const res = await fetch(`/api/ocr/documentos/${selectedDoc.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ filename: trimmed }),
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.error || `Error ${res.status}`);
    }

    // Actualizar estado local con el nombre confirmado por el servidor
    const confirmed = { ...selectedDoc, filename: json.filename };
    setSelectedDoc(confirmed);
    setDocumentos((prev) =>
      prev.map((d) => (d.id === confirmed.id ? { ...d, filename: confirmed.filename } : d))
    );
    setRenombrando(false);

  } catch (err) {
    console.error("Error al renombrar:", err.message);
    setRenombreError(err.message || "No se pudo guardar el nombre. Intenta de nuevo.");
  } finally {
    setGuardandoNombre(false);
  }
};

  /* ── ELIMINAR — borra Storage + registro en DB ─────────────────── */
  const handleEliminar = async () => {
    setEliminando(true);
    // 1. Borrar archivo de Storage
    if (selectedDoc.storage_path) {
      const { error: storageErr } = await supabase.storage
        .from("documentos")
        .remove([selectedDoc.storage_path]);
      if (storageErr) console.warn("Storage delete warn:", storageErr.message);
    }
    // 2. Hard delete del registro en la tabla
    await supabase.from("documentos").delete().eq("id", selectedDoc.id);
    setDocumentos((prev) => prev.filter((d) => d.id !== selectedDoc.id));
    cerrarDetalle();
    setEliminando(false);
  };

  const cerrarModalProc = () => { setModalProc(false); setDocProcListo(false); setDocProcError(null); };

  // ─────────────────────────────────────────────────────────────────
  return (
    <ProtectedRoute>
      <div className="space-y-5 pb-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Mis Documentos</h2>
            <p className="text-gray-500 text-sm">Gestiona y visualiza tus documentos inteligentes</p>
          </div>
          <div className="flex w-full sm:w-auto gap-2">
            <button
              onClick={() => router.push("/usuario/chat")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition shrink-0"
            >
              <Bot size={16} /> Asistente IA
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="flex-1 sm:flex-none justify-center bg-blue-600 text-white px-4 py-2.5 rounded-2xl flex items-center gap-2 hover:bg-blue-700 transition shadow-md hover:shadow-lg hover:-translate-y-0.5 text-sm font-semibold"
            >
              <Upload size={16} /> Subir Documento
            </button>
          </div>
        </div>

        {/* LISTADO */}
        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            <SkeletonCard /><SkeletonCard />
          </div>
        ) : documentos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <FileText size={52} className="opacity-20 mb-4" />
            <p className="font-semibold">No tienes documentos aún</p>
            <p className="text-sm mt-1">Sube tu primer documento para comenzar</p>
            <button onClick={() => setShowUpload(true)}
              className="mt-5 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition">
              Subir ahora
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {documentos.map((doc, i) => {
              if (doc.estado === "procesando") {
                return (
                  <ProcessingCard key={doc.id} doc={doc} idx={i}
                    onCancel={handleCancelarAnalisis} cancelling={cancellingIds.has(doc.id)} />
                );
              }

              const style          = getDocStyle(doc.tipo_doc);
              const { tieneAdvertencias } = parseCalidad(doc.calidad_imagen);
              const estadoVencLive = calcEstadoVencimiento(doc.fecha_vencimiento);
              const sinVencimiento = TIPOS_SIN_VENCIMIENTO.includes((doc.tipo_doc || "").toUpperCase());
              const isVencido      = estadoVencLive === "VENCIDO";
              const isProximo      = estadoVencLive === "PROXIMO_VENCER";

              return (
                <div key={doc.id} onClick={() => abrirDetalle(doc)}
                  className={`bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 hover:-translate-y-0.5 flex flex-col gap-4 relative overflow-hidden ${
                    isVencido ? "border-red-200" : isProximo ? "border-yellow-200" : style.border
                  }`}>
                  {isVencido  && <div className="absolute top-0 left-0 right-0 h-1 bg-red-400 rounded-t-2xl" />}
                  {isProximo  && !isVencido && <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-400 rounded-t-2xl" />}

                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold ${style.color}`}>{String(i + 1).padStart(2, "0")}</span>
                    <div className={`h-[2px] flex-1 ${style.line} rounded-full`} />
                    {isVencido && <span className="text-red-400"><AlertTriangle size={13} /></span>}
                    {isProximo && !isVencido && <span className="text-yellow-400"><Clock size={13} /></span>}
                    {tieneAdvertencias && !isVencido && !isProximo && (
                      <span title="Advertencia de calidad" className="text-amber-400"><AlertTriangle size={13} /></span>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <div className={`${style.bg} ${style.color} p-3 rounded-xl h-fit shrink-0`}>{style.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">{style.label}</h3>
                      <p className="text-sm text-gray-500 truncate">{doc.filename}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatFecha(doc.creado_en)}</p>
                      {doc.fecha_vencimiento && (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold mt-1.5 px-2 py-0.5 rounded-full border ${colorVenc(estadoVencLive)}`}>
                          {iconoVenc(estadoVencLive)}
                          {isVencido ? "Vencido" : isProximo ? `${diasRestantes(doc.fecha_vencimiento)} días` : "Vigente"}
                        </span>
                      )}
                      {sinVencimiento && !doc.fecha_vencimiento && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold mt-1.5 px-2 py-0.5 rounded-full border bg-green-50 text-green-600 border-green-200">
                          <CheckCircle2 size={10} /> Vigente
                        </span>
                      )}
                    </div>
                    <Eye size={18} className="text-gray-300 shrink-0 mt-1" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL DETALLE ────────────────────────────────────────────── */}
      {selectedDoc && (() => {
        const { tieneAdvertencias, advertencias, calidadInsuficiente } = parseCalidad(selectedDoc.calidad_imagen);
        const sinVenc    = TIPOS_SIN_VENCIMIENTO.includes((selectedDoc.tipo_doc || "").toUpperCase());
        const estadoVenc = calcEstadoVencimiento(selectedDoc.fecha_vencimiento);
        const datosEx    = selectedDoc.datos_extraidos || {};
        const fechaVigenciaSAT =
          datosEx.fecha_vigencia_linea?.valor || datosEx.fecha_vigencia_linea ||
          datosEx.vigencia?.valor             || datosEx.vigencia || null;

        return (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
            onClick={cerrarDetalle}>
            <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden h-[90vh] sm:max-h-[92vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}>

              {/* Cabecera */}
              <div className="flex items-center justify-between px-4 sm:px-6 pt-5 pb-4 shrink-0 border-b border-gray-100">
                <div className="flex items-center gap-4 min-w-0 pr-4">
                  {(() => {
                    const s = getDocStyle(selectedDoc.tipo_doc);
                    return <div className={`${s.bg} ${s.color} p-3 rounded-xl shrink-0 hidden sm:block`}>{s.icon}</div>;
                  })()}
                  <div className="min-w-0">
                    {renombrando ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <input autoFocus value={nuevoNombre}
                            onChange={(e) => { setNuevoNombre(e.target.value); setRenombreError(null); }}
                            onKeyDown={(e) => { if (e.key === "Enter") handleRenombrar(); if (e.key === "Escape") setRenombrando(false); }}
                            className="border border-blue-300 rounded-lg px-2 py-1 text-sm font-semibold text-gray-800 w-full sm:w-52 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                          <button onClick={handleRenombrar} disabled={guardandoNombre}
                            className="text-xs bg-blue-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-blue-700 transition flex items-center gap-1 disabled:opacity-50">
                            {guardandoNombre ? <><Loader2 size={11} className="animate-spin" /> Guardando…</> : "Guardar"}
                          </button>
                          <button onClick={() => { setRenombrando(false); setRenombreError(null); }} className="text-gray-400 hover:text-gray-600 p-1">
                            <X size={16} />
                          </button>
                        </div>
                        {renombreError && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertTriangle size={11} /> {renombreError}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800 truncate">{selectedDoc.filename}</p>
                        <button onClick={() => { setNuevoNombre(selectedDoc.filename); setRenombrando(true); }}
                          className="text-gray-300 hover:text-blue-500 transition shrink-0">
                          <Pencil size={13} />
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">{getDocStyle(selectedDoc.tipo_doc).label}</p>
                  </div>
                </div>
                <button onClick={cerrarDetalle} className="text-gray-400 bg-gray-100 rounded-full hover:bg-gray-200 hover:text-gray-700 transition p-1.5 shrink-0">
                  <X size={20} />
                </button>
              </div>

              {/* Cuerpo scrollable */}
              <div className="overflow-y-auto flex-1 px-4 sm:px-6 pb-6 space-y-6 pt-5">

                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Detalles del Archivo</p>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-1">
                    <div className="divide-y divide-gray-100">

                      <div className="flex justify-between items-center py-2.5 text-[13px]">
                        <span className="text-gray-500 font-medium flex items-center gap-2"><Calendar size={14} /> Fecha de subida</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-200">
                          {formatFechaConHora(selectedDoc.creado_en)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-2.5 text-[13px]">
                        <span className="text-gray-500 font-medium flex items-center gap-2"><HardDrive size={14} /> Tamaño</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border bg-slate-100 text-slate-700 border-slate-200">
                          {formatBytes(selectedDoc.tamano)}
                        </span>
                      </div>

                      {selectedDoc.fecha_vencimiento ? (
                        <div className="flex justify-between items-center py-2.5 text-[13px]">
                          <span className="text-gray-500 font-medium flex items-center gap-2"><Clock size={14} /> Vencimiento</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${colorVenc(estadoVenc)}`}>
                            {iconoVenc(estadoVenc)} {formatFecha(selectedDoc.fecha_vencimiento)}
                          </span>
                        </div>
                      ) : sinVenc ? (
                        <div className="flex justify-between items-center py-2.5 text-[13px]">
                          <span className="text-gray-500 font-medium flex items-center gap-2"><Clock size={14} /> Vigencia</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 size={12} /> Vigente
                          </span>
                        </div>
                      ) : null}

                      {fechaVigenciaSAT && !selectedDoc.fecha_vencimiento && (
                        <div className="flex justify-between items-center py-2.5 text-[13px]">
                          <span className="text-gray-500 font-medium flex items-center gap-2"><Clock size={14} /> Vigencia SAT</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border bg-teal-50 text-teal-700 border-teal-200">
                            <CheckCircle2 size={12} /> {fechaVigenciaSAT}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedDoc.storage_path && <DocumentPreview path={selectedDoc.storage_path} supabase={supabase} />}

                {selectedDoc.resumen_ia && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Moon size={15} className="text-blue-500" />
                      <span className="text-[11px] font-medium text-blue-600 uppercase tracking-wide">Resumen del Documento</span>
                    </div>
                    <p className="text-sm text-blue-800 leading-relaxed">{selectedDoc.resumen_ia}</p>
                  </div>
                )}

                {tieneAdvertencias && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={15} className="text-amber-500" />
                      <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wide">Advertencia de Calidad</span>
                    </div>
                    <div className="space-y-1.5">
                      {advertencias.map((adv, i) => <p key={i} className="text-sm text-amber-800">• {adv}</p>)}
                      {calidadInsuficiente && (
                        <p className="text-sm text-amber-800">• El documento tiene poca calidad de imagen. Sube una versión más nítida para mejores resultados.</p>
                      )}
                    </div>
                  </div>
                )}

                {selectedDoc.datos_extraidos && Object.keys(selectedDoc.datos_extraidos).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Campos extraídos</p>
                    <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-1">
                      <div className="divide-y divide-gray-100">
                        {Object.entries(selectedDoc.datos_extraidos).map(([k, v]) => {
                          const display =
                            v && typeof v === "object" && "valor" in v
                              ? formatDatoExtraidoValue(v.valor)
                              : typeof v === "object" ? JSON.stringify(v) : formatDatoExtraidoValue(v);
                          if (display === "—") return null;
                          return (
                            <div key={k} className="flex justify-between py-2.5 text-[13px]">
                              <span className="text-gray-500 shrink-0 pr-4">{formatDatoExtraidoKey(k)}</span>
                              <span className="text-gray-800 font-medium text-right break-all">{display}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Información Adicional</p>
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-4">
                    {selectedDoc.info_adicional ? (
                      <p className="text-sm text-indigo-900 leading-relaxed">{selectedDoc.info_adicional}</p>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-2 opacity-50">
                        <Info size={20} className="text-indigo-400 mb-2" />
                        <p className="text-sm text-indigo-700 italic">No hay información adicional disponible…</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer acciones */}
              <div className="border-t border-gray-100 px-4 sm:px-6 py-4 bg-gray-50 grid grid-cols-3 gap-3 shrink-0">
                <AccionBtn icon={<Download size={18} />} label="Descargar"
                  onClick={handleDescargar} disabled={!imagenUrl} loading={descargando}
                  cls="bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200" />
                <AccionBtn icon={<Pencil size={18} />} label="Renombrar"
                  onClick={() => { setNuevoNombre(selectedDoc.filename); setRenombrando(true); }}
                  cls="bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm" />
                {!confirmDelete ? (
                  <AccionBtn icon={<Trash2 size={18} />} label="Eliminar"
                    onClick={() => setConfirmDelete(true)}
                    cls="bg-red-50 text-red-600 hover:bg-red-100 border border-red-100" />
                ) : (
                  <button onClick={handleEliminar} disabled={eliminando}
                    className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-40">
                    {eliminando
                      ? <span className="text-xs font-medium">Borrando…</span>
                      : <><AlertTriangle size={16} /><span className="text-[11px] font-bold leading-none">¿Confirmar?</span></>}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL SUBIR ──────────────────────────────────────────────── */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full sm:max-w-xl shadow-xl overflow-hidden">
            <div className="flex justify-between items-center px-6 pt-5 pb-3 border-b border-gray-50">
              <h3 className="font-semibold text-gray-800">Subir Documento</h3>
              <button onClick={() => setShowUpload(false)}
                className="text-gray-400 bg-gray-100 rounded-full hover:bg-gray-200 hover:text-gray-600 p-1.5 transition">
                <X size={18} />
              </button>
            </div>
            <div className="p-2">
              <SubirDocumento onSuccess={handleSuccess} />
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL PROCESAMIENTO ──────────────────────────────────────── */}
      {modalProc && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full sm:max-w-md shadow-2xl p-6 text-center relative flex flex-col items-center">
            <button onClick={cerrarModalProc}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-1.5 transition">
              <X size={18} />
            </button>
            {docProcListo ? (
              <>
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4"><CheckCircle2 size={32} /></div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">¡Análisis completado!</h3>
                <p className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-md mb-4 break-all">{docProcInfo?.filename || "tu documento"}</p>
                <p className="text-gray-500 text-sm mb-6">Tu documento fue procesado correctamente.</p>
                <button onClick={() => { cerrarModalProc(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition shadow-sm">
                  Ver en Mis Documentos
                </button>
              </>
            ) : docProcError ? (
              <>
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4"><XCircle size={32} /></div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Error en el análisis</h3>
                <p className="text-gray-500 text-sm mb-6">{docProcError}</p>
                <button onClick={cerrarModalProc} className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition">Cerrar</button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4 relative">
                  <Loader2 size={32} className="animate-spin absolute" /><FileText size={16} className="text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Analizando documento...</h3>
                <p className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-md mb-4 break-all">{docProcInfo?.filename || "tu documento"}</p>
                <p className="text-gray-500 text-sm mb-6">Estamos extrayendo la información con IA. Este proceso puede tardar <b>varios segundos</b>.</p>
                <div className="bg-blue-50 border border-blue-100 text-blue-700 rounded-xl p-3 text-xs flex items-start gap-2 text-left w-full">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                  <p>Puedes cerrar esta ventana — el análisis continuará en segundo plano.</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}