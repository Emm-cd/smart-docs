"use client";

import { useState, useRef } from "react";
import {
  Upload, FileText, CheckCircle2, AlertTriangle,
  Loader2, Lock, X, FileImage,
} from "lucide-react";

/**
 * SubirDocumento
 * Props:
 *  - onSuccess(data) → llamado cuando el backend termina de recibir el archivo
 *    data = { doc_id, estado, metadata: { filename } }
 */
export default function SubirDocumento({ onSuccess }) {
  const [tab,      setTab]      = useState("general"); // "general" | "ine"
  const [archivo,  setArchivo]  = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error,    setError]    = useState(null);
  const inputRef = useRef(null);

  // ── Manejar selección de archivo ────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_MB = 10;
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`El archivo supera los ${MAX_MB} MB permitidos.`);
      return;
    }
    setArchivo(file);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setArchivo(file);
      setError(null);
    }
  };

  // ── Subir y analizar ────────────────────────────────────────────
  const handleAnalizar = async () => {
    if (!archivo) return;
    setSubiendo(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("archivo", archivo);

      const res  = await fetch("/api/ocr/analizar-documento", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al analizar el documento. Intenta de nuevo.");
        return;
      }

      onSuccess(data);
    } catch {
      setError("Error de conexión. Por favor intenta de nuevo.");
    } finally {
      setSubiendo(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="p-4 space-y-4">

      {/* Toggle de pestañas */}
      <div className="flex rounded-2xl bg-gray-100 p-1 gap-1">
        {["general", "ine"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
              tab === t
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "general" ? "Documento General" : "INE / Credencial"}
          </button>
        ))}
      </div>

      {/* ── Tab: Documento General ──────────────────────────────── */}
      {tab === "general" && (
        <>
          {/* Zona de carga */}
          <div
            onClick={() => !subiendo && inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
              archivo
                ? "border-green-300 bg-green-50 hover:border-green-400"
                : "border-blue-200 bg-blue-50/30 hover:border-blue-400 hover:bg-blue-50"
            } ${subiendo ? "pointer-events-none opacity-70" : ""}`}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
            />

            {/* Estado: archivo cargado ✓ */}
            {archivo ? (
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                    <FileImage size={28} className="text-green-500" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                    <CheckCircle2 size={14} className="text-white" />
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-green-700 text-sm">Archivo Cargado</p>
                  <p className="text-xs text-green-600/80 mt-0.5 bg-green-100 px-3 py-1 rounded-full max-w-[220px] truncate mx-auto">
                    {archivo.name}
                  </p>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); setArchivo(null); }}
                  className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                >
                  <X size={12} /> Quitar archivo
                </button>
              </div>
            ) : (
              /* Estado: sin archivo */
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Upload size={26} className="text-blue-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-700 text-sm">
                    Selecciona o arrastra un archivo
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    PDF, JPG o PNG · Máx 10 MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
              <AlertTriangle size={15} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Botón analizar */}
          <button
            onClick={handleAnalizar}
            disabled={!archivo || subiendo}
            className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-200"
          >
            {subiendo ? (
              <><Loader2 size={18} className="animate-spin" /> Analizando…</>
            ) : (
              <><FileText size={18} /> Analizar Documento</>
            )}
          </button>
        </>
      )}

      {/* ── Tab: INE / Credencial — BLOQUEADO ─────────────────────── */}
      {tab === "ine" && (
        <div className="flex flex-col items-center justify-center gap-4 py-6">
          {/* Ícono de candado */}
          <div className="relative">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
              <Lock size={28} className="text-gray-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold shadow-sm">
              v2
            </div>
          </div>

          <div className="text-center">
            <p className="font-bold text-gray-700 text-sm">Función no disponible</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Disponible en la siguiente versión de SmartDocs
            </p>
          </div>

          {/* Nota informativa */}
          <div className="w-full bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-left">
            <p className="text-xs font-semibold text-blue-700 mb-1">🚀 Próximamente</p>
            <p className="text-xs text-blue-600/80 leading-relaxed">
              Estamos desarrollando el análisis automático de INE / Credencial con lectura
              del frente y reverso, verificación de vigencia y extracción de datos CURP,
              clave de elector y más.
            </p>
          </div>

          {/* Botón deshabilitado (referencia visual) */}
          <button
            disabled
            className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gray-200 text-gray-400 cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Lock size={16} />
            Analizar INE
          </button>
        </div>
      )}
    </div>
  );
}