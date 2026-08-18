// app/hooks/useOCR.js
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Upload, ScanSearch, Sparkles, Save, CheckCircle2 } from "lucide-react";

export const PASOS = [
  { label: "Subiendo archivo",            Icon: Upload       },
];

const POLL_INTERVAL = 4000;   // ms entre cada consulta de estado
const POLL_TIMEOUT  = 300000; // 5 min máximo esperando

export function useOCR({ onDocumentoListo } = {}) {
  const [resultado,   setResultado]   = useState(null);
  const [cargando,    setCargando]    = useState(false);
  const [error,       setError]       = useState(null);
  const [paso,        setPaso]        = useState(-1);
  // Estado del procesamiento en background
  const [procesando,  setProcesando]  = useState(false);   // OCR corriendo en server
  const [docIdActivo, setDocIdActivo] = useState(null);    // ID del doc en espera
  const [docListo,    setDocListo]    = useState(false);   // OCR terminó
  const [docInfo,     setDocInfo]     = useState(null);    // info del doc terminado

  const pollRef   = useRef(null);
  const startedAt = useRef(null);

  // ── Polling de estado ──────────────────────────────────────────────────────
  const iniciarPolling = useCallback((docId) => {
    setDocIdActivo(docId);
    setProcesando(true);
    setDocListo(false);
    startedAt.current = Date.now();

    clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      // Timeout de seguridad
      if (Date.now() - startedAt.current > POLL_TIMEOUT) {
        clearInterval(pollRef.current);
        setProcesando(false);
        setError("El procesamiento tardó demasiado. Revisa el documento en Mis Documentos.");
        return;
      }

      try {
        const res  = await fetch(`/api/ocr/documento-estado/${docId}`);
        const data = await res.json();

        if (data.listo) {
          clearInterval(pollRef.current);
          setProcesando(false);
          setDocListo(true);
          setDocInfo(data);
          onDocumentoListo?.(data);
        } else if (data.error) {
          clearInterval(pollRef.current);
          setProcesando(false);
          setError("Error al procesar el documento. Intenta de nuevo.");
        }
        // si data.estado === "procesando" seguimos esperando
      } catch {
        // error de red temporal — seguir intentando
      }
    }, POLL_INTERVAL);
  }, [onDocumentoListo]);

  useEffect(() => () => clearInterval(pollRef.current), []);

  // ── Documento genérico ─────────────────────────────────────────────────────
  const analizarDocumento = async (archivo) => {
    setCargando(true);
    setError(null);
    setResultado(null);
    setDocListo(false);

    try {
      setPaso(0);
      const form = new FormData();
      form.append("archivo", archivo);

      setPaso(1);
      const res  = await fetch("/api/ocr/analizar-documento", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir el archivo");

      setPaso(2); // "Generando descripción" — el OCR corre en background
      setResultado(data);

      // Iniciar polling si hay doc_id
      if (data.doc_id) {
        setPaso(3);
        iniciarPolling(data.doc_id);
      } else {
        setPaso(4);
      }

      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setCargando(false);
    }
  };

  // ── INE (frente + reverso) ─────────────────────────────────────────────────
  const analizarINE = async (frente, reverso) => {
    setCargando(true);
    setError(null);
    setResultado(null);
    setDocListo(false);

    try {
      setPaso(0);
      const form = new FormData();
      form.append("frente",  frente);
      form.append("reverso", reverso);

      setPaso(1);
      const res  = await fetch("/api/ocr/analizar-ine", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir la INE");

      setPaso(2);
      setResultado(data);

      if (data.doc_id) {
        setPaso(3);
        iniciarPolling(data.doc_id);
      } else {
        setPaso(4);
      }

      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setCargando(false);
    }
  };

  // ── Acciones sobre documentos guardados ───────────────────────────────────
  const eliminarDocumento = async (docId) => {
    const res  = await fetch(`/api/ocr/documentos/${docId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No se pudo eliminar");
    return data;
  };

  const renombrarDocumento = async (docId, nuevoNombre) => {
    const res  = await fetch(`/api/ocr/documentos/${docId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ filename: nuevoNombre }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No se pudo renombrar");
    return data;
  };

  const limpiar = () => {
    clearInterval(pollRef.current);
    setResultado(null);
    setError(null);
    setPaso(-1);
    setProcesando(false);
    setDocListo(false);
    setDocInfo(null);
    setDocIdActivo(null);
  };

  const cerrarNotificacionListo = () => {
    setDocListo(false);
    setDocInfo(null);
  };

  return {
    // upload / OCR
    resultado,
    cargando,
    error,
    paso,
    // background processing
    procesando,
    docIdActivo,
    docListo,
    docInfo,
    // funciones
    analizarDocumento,
    analizarINE,
    eliminarDocumento,
    renombrarDocumento,
    limpiar,
    cerrarNotificacionListo,
  };
}