"use client";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { createClient } from "@/app/lib/supabase/client";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";

import {
  FileText, AlertTriangle, Bot,
  CheckCircle, Clock, XCircle, StarsIcon,
} from "lucide-react";
import { useOCR } from "@/app/hooks/useOCR";

// ── Límite de almacenamiento: 100 MB en bytes ─────────────────────────────────
const STORAGE_LIMIT_BYTES = 100 * 1024 * 1024;

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return "0 MB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function UsuarioDashboard() {
  const router   = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [documentos,     setDocumentos]     = useState([]);
  const [documentCount,  setDocumentCount]  = useState(0);
  const [modalOpen,      setModalOpen]      = useState(false);

  // ── Almacenamiento dinámico ──────────────────────────────────────────────────
  const [storageUsed,    setStorageUsed]    = useState(0);
  const [storageLoading, setStorageLoading] = useState(true);

  const storagePercent = Math.min(
    Math.round((storageUsed / STORAGE_LIMIT_BYTES) * 100),
    100
  );
  const storageBarColor =
    storagePercent >= 90 ? "#EF4444" :
    storagePercent >= 70 ? "#F59E0B" :
    "#3B82F6";

  // ── Hook OCR ─────────────────────────────────────────────────────────────────
  const {
    cargando, procesando,
    analizarDocumento,
    cerrarNotificacionListo,
  } = useOCR({
    onDocumentoListo: () => { cargarDocumentos(); },
  });

  useEffect(() => {
    if (cargando || procesando) setModalOpen(true);
  }, [cargando, procesando]);

  // ── Cargar documentos + almacenamiento ───────────────────────────────────────
  const cargarDocumentos = useCallback(async () => {
    // Últimos 10 para la vista
    const { data, error } = await supabase
      .from("documentos")
      .select("id, filename, creado_en, vencimiento_estado, estado, tamano")
      .is("eliminado_en", null)
      .order("creado_en", { ascending: false })
      .limit(10);

    if (error) { console.error("Error al cargar documentos:", error); return; }

    const docs = data || [];
    setDocumentos(docs);
    setDocumentCount(docs.length);

    // Todos los docs para sumar almacenamiento real
    const { data: allDocs } = await supabase
      .from("documentos")
      .select("tamano")
      .is("eliminado_en", null);

    const totalBytes = (allDocs || []).reduce((acc, d) => acc + (d.tamano || 0), 0);
    setStorageUsed(totalBytes);
    setStorageLoading(false);
  }, [supabase]);

  useEffect(() => { cargarDocumentos(); }, [cargarDocumentos]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const fileInputRef = useRef(null);
  const handleSubirArchivo = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    await analizarDocumento(archivo);
  };

  // ── Stats ────────────────────────────────────────────────────────────────────
  const vigentes  = documentos.filter(d => d.vencimiento_estado === "VIGENTE").length;
  const porVencer = documentos.filter(d => d.vencimiento_estado === "PROXIMO_VENCER").length;
  const vencidos  = documentos.filter(d => d.vencimiento_estado === "VENCIDO").length;

  const ultimosTresDocumentos = documentos.slice(0, 3);
  const ultimasTresAlertas    = documentos
    .filter(d => ["PROXIMO_VENCER", "VENCIDO"].includes(d.vencimiento_estado))
    .slice(0, 3);

  const styles = {
    blue:   { border: "border-blue-500",   hoverBorder: "hover:border-blue-600",   iconBg: "bg-blue-100",   iconColor: "text-blue-600",   textColor: "text-blue-600"   },
    green:  { border: "border-green-500",  hoverBorder: "hover:border-green-600",  iconBg: "bg-green-100",  iconColor: "text-green-600",  textColor: "text-green-600"  },
    yellow: { border: "border-yellow-500", hoverBorder: "hover:border-yellow-600", iconBg: "bg-yellow-100", iconColor: "text-yellow-600", textColor: "text-yellow-600" },
    red:    { border: "border-red-500",    hoverBorder: "hover:border-red-600",    iconBg: "bg-red-100",    iconColor: "text-red-600",    textColor: "text-red-600"    },
  };

  const cards = [
    { title: "Total documentos", value: documentCount, color: "blue",   icon: FileText    },
    { title: "Vigentes",         value: vigentes,      color: "green",  icon: CheckCircle },
    { title: "Por vencer",       value: porVencer,     color: "yellow", icon: Clock       },
    { title: "Vencidos",         value: vencidos,      color: "red",    icon: XCircle     },
  ];

  const getFileStyle = (filename = "") => {
    const ext = filename.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png"].includes(ext)) return { bg: "bg-green-100", color: "text-green-600" };
    if (ext === "pdf")                        return { bg: "bg-purple-100",   color: "text-purple-600"   };
    return                                           { bg: "bg-red-100",  color: "text-red-600"  };
  };

  return (
    <ProtectedRoute>
      {/* FIX: gap-4 en todo (antes gap-6 + my-6 extra entre bloques) */}
      <div className="h-full flex flex-col gap-4 relative pb-16 md:pb-0">

        {/* HEADER */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">¡Bienvenid@ de nuevo!</h2>
          <p className="text-gray-500 text-sm mt-1">
            Gestiona tus documentos inteligentes, mantente al día con sus estados y recibe asistencia en tiempo real.
          </p>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, i) => {
            const Icon  = card.icon;
            const style = styles[card.color];
            return (
              <div key={i}
                className={`bg-white p-5 rounded-2xl flex items-center gap-4 border-l-4 ${style.border} shadow-sm cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${style.hoverBorder}`}
              >
                <div className={`${style.iconBg} p-3 rounded-xl shrink-0`}>
                  <Icon className={style.iconColor} size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-gray-500 text-sm truncate">{card.title}</p>
                  <p className={`text-xl font-bold ${style.textColor}`}>{card.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ALMACENAMIENTO + TIP IA — FIX: gap-4 sin my-6 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Almacenamiento dinámico */}
          <div className="bg-white rounded-[16px] p-5 border border-slate-100 flex flex-col justify-center"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-blue-500" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
                <span className="text-sm font-bold text-slate-700">Almacenamiento</span>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md transition-colors"
                style={{
                  color:      storagePercent >= 90 ? "#DC2626" : storagePercent >= 70 ? "#D97706" : "#2563EB",
                  background: storagePercent >= 90 ? "#FEE2E2" : storagePercent >= 70 ? "#FEF9C3" : "#EFF6FF",
                }}>
                {storageLoading ? "…" : `${storagePercent}%`}
              </span>
            </div>

            {/* Barra de progreso */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden">
              <div className="h-2.5 rounded-full transition-all duration-700"
                style={{
                  width:      storageLoading ? "0%" : `${storagePercent}%`,
                  background: storageBarColor,
                }}
              />
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>{storageLoading ? "Calculando…" : `${formatBytes(storageUsed)} usados`}</span>
              <span>{formatBytes(STORAGE_LIMIT_BYTES)} disponibles</span>
            </div>
          </div>

          {/* Tip IA */}
          <div className="rounded-[16px] p-5 border border-indigo-100 flex items-start gap-4"
            style={{ background: "linear-gradient(135deg, #F5F3FF 0%, #EFF6FF 100%)" }}>
            <div className="bg-white p-2.5 rounded-xl shadow-sm shrink-0">
              <StarsIcon className="text-purple-500" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-indigo-900 mb-1">Encuentra respuestas al instante</h4>
              <p className="text-xs text-indigo-700/80 leading-relaxed">
                ¿Buscas un dato exacto? Ahorra tiempo leyendo y consulta información de tus documentos directamente con nuestro Asistente IA.
              </p>
            </div>
          </div>
        </div>

        {/* DOCUMENTOS + ALERTAS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">

          <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="text-blue-600" />
              <h3 className="font-semibold text-gray-800">Últimos Documentos</h3>
            </div>
            {ultimosTresDocumentos.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No hay documentos aún</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {ultimosTresDocumentos.map((doc) => {
                  const fileStyle = getFileStyle(doc.filename);
                  return (
                    <li key={doc.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`${fileStyle.bg} p-2 rounded-lg shrink-0`}>
                          <FileText size={16} className={fileStyle.color} />
                        </div>
                        <span className="text-sm text-gray-700 font-medium truncate">{doc.filename}</span>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 shrink-0 ml-2">
                        {new Date(doc.creado_en).toLocaleDateString("es-MX")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="text-yellow-500" />
              <h3 className="font-semibold text-gray-800">Alertas Recientes</h3>
            </div>
            <div className="flex flex-col gap-3">
              {ultimasTresAlertas.length > 0 ? (
                ultimasTresAlertas.map((doc) => {
                  const isVencido = doc.vencimiento_estado === "VENCIDO";
                  const Icon      = isVencido ? XCircle : AlertTriangle;
                  const bgClass   = isVencido ? "bg-red-50 border-red-100"    : "bg-yellow-50 border-yellow-100";
                  const textClass = isVencido ? "text-red-700"                : "text-yellow-700";
                  const iconColor = isVencido ? "text-red-500"                : "text-yellow-500";
                  const mensaje   = isVencido ? "Vencido"                     : "Próximo a vencer";
                  return (
                    <div key={doc.id} className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${bgClass}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`${iconColor} shrink-0`} size={20} />
                        <span className={`text-sm font-medium truncate ${textClass}`}>{doc.filename}</span>
                      </div>
                      <span className={`text-xs font-bold shrink-0 px-2 py-1 rounded-full ${isVencido ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"}`}>
                        {mensaje}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center gap-3 bg-green-50 p-3 rounded-xl border border-green-100">
                  <CheckCircle className="text-green-500 shrink-0" />
                  <span className="text-sm text-green-700">Todos tus documentos están al día</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CHATBOT */}
        <div className="fixed bottom-6 right-6 md:absolute md:bottom-4 md:right-4 z-50">
          <button
            onClick={() => router.push("/usuario/chat")}
            className="bg-blue-600 text-white p-4 rounded-full shadow-[0_4px_20px_rgba(37,99,235,0.4)] hover:bg-blue-700 transition hover:scale-110 animate-pulse"
          >
            <Bot size={24} />
          </button>
        </div>

      </div>
    </ProtectedRoute>
  );
}