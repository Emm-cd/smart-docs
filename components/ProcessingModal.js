// app/components/ProcessingModal.jsx
"use client";
import { useEffect, useState } from "react";
import { X, FileSearch, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";

// ── Spinner SVG ────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg
      className="pm-spinner"
      viewBox="0 0 50 50"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
    </svg>
  );
}

// ── Pulso de puntos animados ───────────────────────────────────────────────────
function PulseDots() {
  return (
    <span className="pm-dots" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

/**
 * ProcessingModal
 *
 * Props:
 *  - open          {boolean}   mostrar/ocultar
 *  - listo         {boolean}   OCR terminó
 *  - errorMsg      {string}    error si lo hay
 *  - filename      {string}    nombre del archivo
 *  - onClose       {function}  cerrar modal (no cancela el análisis)
 *  - onVerDoc      {function}  navegar a Mis Documentos
 */
export default function ProcessingModal({
  open     = false,
  listo    = false,
  errorMsg = null,
  filename = "tu documento",
  onClose,
  onVerDoc,
}) {
  const [visible, setVisible] = useState(false);
  const [fase,    setFase]    = useState("procesando"); // "procesando" | "listo" | "error"

  // Animación de entrada
  useEffect(() => {
    if (open)  { setVisible(true); }
    else       { const t = setTimeout(() => setVisible(false), 300); return () => clearTimeout(t); }
  }, [open]);

  // Cambiar fase según estado
  useEffect(() => {
    if (errorMsg)     setFase("error");
    else if (listo)   setFase("listo");
    else              setFase("procesando");
  }, [listo, errorMsg]);

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`pm-backdrop ${open ? "pm-backdrop--in" : "pm-backdrop--out"}`}
        onClick={fase === "procesando" ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Estado del análisis"
        className={`pm-panel ${open ? "pm-panel--in" : "pm-panel--out"}`}
      >
        {/* Botón cerrar — siempre visible */}
        <button
          className="pm-close"
          onClick={onClose}
          aria-label="Cerrar"
          title={fase === "procesando" ? "Cerrar (el análisis continuará)" : "Cerrar"}
        >
          <X size={18} />
        </button>

        {/* Contenido según fase */}
        {fase === "procesando" && (
          <div className="pm-body">
            <div className="pm-icon-wrap pm-icon-wrap--blue">
              <FileSearch size={28} strokeWidth={1.5} />
              <Spinner />
            </div>
            <h2 className="pm-title">Analizando documento<PulseDots /></h2>
            <p className="pm-file">{filename}</p>
            <p className="pm-desc">
              Estamos extrayendo la información de tu documento con OCR.
              Este proceso puede tardar <strong>varios minutos</strong>.
            </p>
            <div className="pm-hint">
              <span className="pm-hint-dot" />
              Puedes cerrar esta ventana — el análisis continuará en segundo plano.
            </div>
          </div>
        )}

        {fase === "listo" && (
          <div className="pm-body">
            <div className="pm-icon-wrap pm-icon-wrap--green">
              <CheckCircle2 size={28} strokeWidth={1.5} />
            </div>
            <h2 className="pm-title pm-title--green">¡Análisis completado!</h2>
            <p className="pm-file">{filename}</p>
            <p className="pm-desc">
              Tu documento fue procesado correctamente.
              Ya puedes consultarlo en <strong>Mis Documentos</strong>.
            </p>
            <div className="pm-actions">
              <button className="pm-btn pm-btn--primary" onClick={onVerDoc}>
                Ver en Mis Documentos <ExternalLink size={14} />
              </button>
              <button className="pm-btn pm-btn--ghost" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </div>
        )}

        {fase === "error" && (
          <div className="pm-body">
            <div className="pm-icon-wrap pm-icon-wrap--red">
              <AlertCircle size={28} strokeWidth={1.5} />
            </div>
            <h2 className="pm-title pm-title--red">Error al procesar</h2>
            <p className="pm-file">{filename}</p>
            <p className="pm-desc">
              {errorMsg || "Ocurrió un error al analizar el documento. Intenta de nuevo."}
            </p>
            <div className="pm-actions">
              <button className="pm-btn pm-btn--ghost" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        /* ── Variables ───────────────────────────────────────────── */
        .pm-backdrop {
          position: fixed; inset: 0;
          background: rgba(10, 12, 20, 0.55);
          backdrop-filter: blur(4px);
          z-index: 999;
          transition: opacity 0.28s ease;
        }
        .pm-backdrop--in  { opacity: 1; }
        .pm-backdrop--out { opacity: 0; pointer-events: none; }

        .pm-panel {
          position: fixed;
          left: 50%; top: 50%;
          transform: translate(-50%, -50%);
          z-index: 1000;
          width: min(420px, 92vw);
          background: #0f1117;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          box-shadow: 0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
          overflow: hidden;
          transition: opacity 0.28s ease, transform 0.28s cubic-bezier(0.34,1.56,0.64,1);
        }
        .pm-panel--in  { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        .pm-panel--out { opacity: 0; transform: translate(-50%, -50%) scale(0.94); pointer-events: none; }

        .pm-close {
          position: absolute; top: 14px; right: 14px;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 50%;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .pm-close:hover { background: rgba(255,255,255,0.12); color: #fff; }

        .pm-body {
          padding: 40px 32px 32px;
          display: flex; flex-direction: column; align-items: center;
          text-align: center; gap: 12px;
          font-family: system-ui, sans-serif;
        }

        /* ── Icono ────────────────────────────────────────────────── */
        .pm-icon-wrap {
          position: relative;
          width: 72px; height: 72px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%;
          margin-bottom: 4px;
        }
        .pm-icon-wrap--blue  { background: rgba(59,130,246,0.12); color: #60a5fa; }
        .pm-icon-wrap--green { background: rgba(34,197,94,0.12);  color: #4ade80; }
        .pm-icon-wrap--red   { background: rgba(239,68,68,0.12);  color: #f87171; }

        /* ── Spinner ──────────────────────────────────────────────── */
        .pm-spinner {
          position: absolute; inset: 0; width: 100%; height: 100%;
          animation: pm-spin 1.4s linear infinite;
        }
        .pm-spinner circle {
          stroke: #3b82f6;
          stroke-linecap: round;
          stroke-dasharray: 80;
          stroke-dashoffset: 60;
          animation: pm-dash 1.4s ease-in-out infinite;
        }
        @keyframes pm-spin { to { transform: rotate(360deg); } }
        @keyframes pm-dash {
          0%   { stroke-dashoffset: 80; }
          50%  { stroke-dashoffset: 20; }
          100% { stroke-dashoffset: 80; }
        }

        /* ── Texto ────────────────────────────────────────────────── */
        .pm-title {
          font-size: 1.15rem; font-weight: 700; color: #f1f5f9;
          margin: 0; letter-spacing: -0.02em;
        }
        .pm-title--green { color: #4ade80; }
        .pm-title--red   { color: #f87171; }

        .pm-file {
          font-size: 0.78rem; color: rgba(255,255,255,0.35);
          background: rgba(255,255,255,0.04);
          padding: 3px 10px; border-radius: 20px;
          max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          margin: 0;
        }

        .pm-desc {
          font-size: 0.875rem; color: rgba(255,255,255,0.55);
          line-height: 1.6; margin: 0;
        }
        .pm-desc strong { color: rgba(255,255,255,0.8); }

        /* ── Hint ─────────────────────────────────────────────────── */
        .pm-hint {
          display: flex; align-items: center; gap: 8px;
          font-size: 0.78rem; color: rgba(255,255,255,0.35);
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px; padding: 10px 14px;
          margin-top: 4px;
        }
        .pm-hint-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #3b82f6; flex-shrink: 0;
          animation: pm-pulse 2s ease-in-out infinite;
        }
        @keyframes pm-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.75); }
        }

        /* ── Botones ──────────────────────────────────────────────── */
        .pm-actions {
          display: flex; flex-direction: column; gap: 8px;
          width: 100%; margin-top: 4px;
        }
        .pm-btn {
          width: 100%; padding: 11px 20px;
          border-radius: 10px; font-size: 0.9rem; font-weight: 600;
          cursor: pointer; display: flex; align-items: center;
          justify-content: center; gap: 6px;
          transition: opacity 0.15s, transform 0.1s;
        }
        .pm-btn:active { transform: scale(0.98); }
        .pm-btn--primary {
          background: #3b82f6; color: #fff; border: none;
        }
        .pm-btn--primary:hover { opacity: 0.88; }
        .pm-btn--ghost {
          background: transparent; color: rgba(255,255,255,0.4);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .pm-btn--ghost:hover { color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.04); }

        /* ── Dots animados ────────────────────────────────────────── */
        .pm-dots { display: inline-flex; gap: 3px; margin-left: 2px; }
        .pm-dots span {
          width: 4px; height: 4px; border-radius: 50%;
          background: currentColor; opacity: 0.5;
          animation: pm-blink 1.4s ease-in-out infinite;
        }
        .pm-dots span:nth-child(2) { animation-delay: 0.2s; }
        .pm-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pm-blink {
          0%, 80%, 100% { opacity: 0.25; } 40% { opacity: 1; }
        }
      `}</style>
    </>
  );
}
