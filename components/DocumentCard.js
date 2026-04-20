// app/components/DocumentCard.jsx
"use client";
import { useState, useRef, useEffect } from "react";
import {
  FileText, Trash2, Pencil, CheckCircle2, AlertTriangle,
  Clock, Loader2, X, Check, ExternalLink,
} from "lucide-react";

// ── Mapa de tipo → etiqueta legible ──────────────────────────────────────────
const TIPO_LABEL = {
  INE:            "INE / Credencial",
  PASAPORTE:      "Pasaporte",
  CONSTANCIA_SAT: "Constancia SAT",
  FORMATO_CURP:   "Documento CURP",
  ACTA_NACIMIENTO:"Acta de Nacimiento",
  OTROS:          "Documento",
  PROCESANDO:     "Procesando…",
};

// ── Chip de vencimiento ────────────────────────────────────────────────────────
function VencimientoChip({ estado, alerta }) {
  if (estado === "SIN_FECHA" || !estado) return null;
  const map = {
    VIGENTE:        { label: "Vigente",          color: "#22c55e", bg: "rgba(34,197,94,0.1)"  },
    PROXIMO_VENCER: { label: "Próximo a vencer", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    VENCIDO:        { label: "Vencido",           color: "#ef4444", bg: "rgba(239,68,68,0.1)"  },
  };
  const cfg = map[estado] || map.VIGENTE;
  return (
    <span className="dc-chip" style={{ color: cfg.color, background: cfg.bg }}>
      {alerta && <AlertTriangle size={11} />}
      {cfg.label}
    </span>
  );
}

/**
 * DocumentCard
 *
 * Props:
 *  - doc          {object}   fila de la tabla documentos
 *  - onEliminar   {function(id)} callback tras eliminar
 *  - onRenombrar  {function(id, nuevoNombre)} callback tras renombrar
 *  - onClick      {function(doc)} abrir detalle (solo si no está procesando)
 */
export default function DocumentCard({ doc, onEliminar, onRenombrar, onClick }) {
  const procesando = doc.estado === "procesando";

  // ── Estado local ────────────────────────────────────────────────────────────
  const [renombrando,  setRenombrando]  = useState(false);
  const [nuevoNombre,  setNuevoNombre]  = useState(doc.filename || "");
  const [guardando,    setGuardando]    = useState(false);
  const [eliminando,   setEliminando]   = useState(false);
  const [confirmDel,   setConfirmDel]   = useState(false);
  const [errLocal,     setErrLocal]     = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (renombrando) inputRef.current?.focus();
  }, [renombrando]);

  // ── Guardar nombre ──────────────────────────────────────────────────────────
  const guardarNombre = async () => {
    const nombre = nuevoNombre.trim();
    if (!nombre || nombre === doc.filename) { setRenombrando(false); return; }
    setGuardando(true);
    setErrLocal("");
    try {
      const res  = await fetch(`/api/ocr/documentos/${doc.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ filename: nombre }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al renombrar");
      onRenombrar?.(doc.id, nombre);
      setRenombrando(false);
    } catch (e) {
      setErrLocal(e.message);
    } finally {
      setGuardando(false);
    }
  };

  // ── Eliminar ────────────────────────────────────────────────────────────────
  const handleEliminar = async () => {
    if (!confirmDel) { setConfirmDel(true); return; }
    setEliminando(true);
    setErrLocal("");
    try {
      const res  = await fetch(`/api/ocr/documentos/${doc.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar");
      onEliminar?.(doc.id);
    } catch (e) {
      setErrLocal(e.message);
      setEliminando(false);
      setConfirmDel(false);
    }
  };

  // ── Fecha legible ────────────────────────────────────────────────────────────
  const fecha = doc.created_at
    ? new Date(doc.created_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  return (
    <article
      className={`dc-card ${procesando ? "dc-card--processing" : ""}`}
      onClick={!procesando && !renombrando ? () => onClick?.(doc) : undefined}
      tabIndex={procesando ? -1 : 0}
      onKeyDown={(e) => { if (e.key === "Enter" && !procesando && !renombrando) onClick?.(doc); }}
      aria-label={`Documento: ${doc.filename}`}
    >
      {/* ── Shimmer cuando procesa ─────────────────────────────────────────── */}
      {procesando && <div className="dc-shimmer" aria-hidden="true" />}

      {/* ── Cabecera ───────────────────────────────────────────────────────── */}
      <div className="dc-header">
        <div className="dc-icon-wrap" aria-hidden="true">
          {procesando
            ? <Loader2 size={22} className="dc-spin" />
            : <FileText size={22} />}
        </div>
        <div className="dc-meta">
          {/* Nombre / Input renombrar */}
          {renombrando ? (
            <div className="dc-rename-row" onClick={(e) => e.stopPropagation()}>
              <input
                ref={inputRef}
                className="dc-rename-input"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")  guardarNombre();
                  if (e.key === "Escape") { setRenombrando(false); setNuevoNombre(doc.filename); }
                }}
                maxLength={120}
              />
              <button className="dc-action dc-action--confirm" onClick={guardarNombre} disabled={guardando} title="Guardar">
                {guardando ? <Loader2 size={14} className="dc-spin" /> : <Check size={14} />}
              </button>
              <button className="dc-action dc-action--cancel" onClick={() => { setRenombrando(false); setNuevoNombre(doc.filename); }} title="Cancelar">
                <X size={14} />
              </button>
            </div>
          ) : (
            <h3 className="dc-name" title={doc.filename}>{doc.filename}</h3>
          )}

          <div className="dc-row">
            <span className="dc-tipo">{TIPO_LABEL[doc.tipo_doc] || doc.tipo_doc}</span>
            {fecha && <span className="dc-fecha">{fecha}</span>}
          </div>
        </div>
      </div>

      {/* ── Chips ──────────────────────────────────────────────────────────── */}
      <div className="dc-chips">
        {procesando
          ? <span className="dc-chip dc-chip--processing"><Loader2 size={11} className="dc-spin" /> Analizando…</span>
          : <VencimientoChip estado={doc.vencimiento_estado} alerta={doc.vencimiento_alerta} />}
      </div>

      {/* ── Error local ────────────────────────────────────────────────────── */}
      {errLocal && <p className="dc-err">{errLocal}</p>}

      {/* ── Acciones (solo si no procesa) ──────────────────────────────────── */}
      {!procesando && (
        <div className="dc-footer" onClick={(e) => e.stopPropagation()}>
          {/* Renombrar */}
          {!renombrando && (
            <button
              className="dc-action-btn"
              onClick={() => { setRenombrando(true); setNuevoNombre(doc.filename); setConfirmDel(false); setErrLocal(""); }}
              title="Renombrar"
            >
              <Pencil size={14} /> Renombrar
            </button>
          )}

          {/* Eliminar / Confirmar */}
          {!confirmDel ? (
            <button
              className="dc-action-btn dc-action-btn--danger"
              onClick={() => { setConfirmDel(true); setRenombrando(false); }}
              title="Eliminar"
              disabled={eliminando}
            >
              <Trash2 size={14} /> Eliminar
            </button>
          ) : (
            <div className="dc-confirm">
              <span className="dc-confirm-text">¿Eliminar?</span>
              <button className="dc-action-btn dc-action-btn--danger-solid" onClick={handleEliminar} disabled={eliminando}>
                {eliminando ? <Loader2 size={13} className="dc-spin" /> : <Trash2 size={13} />}
                Sí, borrar
              </button>
              <button className="dc-action-btn" onClick={() => setConfirmDel(false)}>
                <X size={13} /> No
              </button>
            </div>
          )}

          {/* Ver detalle */}
          {!renombrando && !confirmDel && (
            <button className="dc-action-btn dc-action-btn--primary" onClick={() => onClick?.(doc)}>
              <ExternalLink size={14} /> Ver
            </button>
          )}
        </div>
      )}

      {/* ── Hint "no clickeable" cuando procesa ────────────────────────────── */}
      {procesando && (
        <p className="dc-processing-hint">
          <Clock size={12} /> El análisis continúa en segundo plano
        </p>
      )}

      <style>{`
        .dc-card {
          position: relative; overflow: hidden;
          background: #0f1117;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 18px;
          display: flex; flex-direction: column; gap: 10px;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
          font-family: system-ui, sans-serif;
        }
        .dc-card:not(.dc-card--processing) {
          cursor: pointer;
        }
        .dc-card:not(.dc-card--processing):hover {
          border-color: rgba(255,255,255,0.14);
          box-shadow: 0 8px 28px rgba(0,0,0,0.4);
          transform: translateY(-2px);
        }
        .dc-card--processing {
          cursor: default;
          border-color: rgba(59,130,246,0.2);
          background: rgba(59,130,246,0.03);
        }

        /* ── Shimmer ───────────────────────────────────────────── */
        .dc-shimmer {
          position: absolute; inset: 0; z-index: 0;
          background: linear-gradient(90deg,
            transparent 0%, rgba(59,130,246,0.06) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: dc-shimmer 2s linear infinite;
        }
        @keyframes dc-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }

        .dc-header {
          display: flex; gap: 12px; align-items: flex-start; position: relative; z-index: 1;
        }
        .dc-icon-wrap {
          width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
          background: rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.5);
        }
        .dc-card--processing .dc-icon-wrap { color: #60a5fa; background: rgba(59,130,246,0.1); }

        .dc-meta { flex: 1; min-width: 0; }
        .dc-name {
          font-size: 0.9rem; font-weight: 600; color: #f1f5f9;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          margin: 0 0 4px; max-width: 100%;
        }
        .dc-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .dc-tipo  { font-size: 0.72rem; color: rgba(255,255,255,0.35); }
        .dc-fecha { font-size: 0.72rem; color: rgba(255,255,255,0.22); }

        /* ── Chips ─────────────────────────────────────────────── */
        .dc-chips { display: flex; gap: 6px; flex-wrap: wrap; position: relative; z-index: 1; }
        .dc-chip {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 0.7rem; font-weight: 600; padding: 3px 8px;
          border-radius: 20px;
        }
        .dc-chip--processing { color: #60a5fa; background: rgba(59,130,246,0.1); }

        /* ── Rename input ──────────────────────────────────────── */
        .dc-rename-row {
          display: flex; gap: 4px; align-items: center; width: 100%;
        }
        .dc-rename-input {
          flex: 1; min-width: 0; background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.14); border-radius: 7px;
          padding: 5px 8px; font-size: 0.85rem; color: #f1f5f9;
          outline: none;
        }
        .dc-rename-input:focus { border-color: #3b82f6; }
        .dc-action {
          width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.15s, color 0.15s;
        }
        .dc-action--confirm { background: rgba(34,197,94,0.1);  color: #4ade80; border: 1px solid rgba(34,197,94,0.2); }
        .dc-action--confirm:hover { background: rgba(34,197,94,0.2); }
        .dc-action--cancel  { background: rgba(239,68,68,0.08); color: #f87171; border: 1px solid rgba(239,68,68,0.15); }
        .dc-action--cancel:hover  { background: rgba(239,68,68,0.15); }

        /* ── Footer ────────────────────────────────────────────── */
        .dc-footer {
          display: flex; gap: 6px; flex-wrap: wrap;
          border-top: 1px solid rgba(255,255,255,0.05);
          padding-top: 10px; position: relative; z-index: 1;
        }
        .dc-action-btn {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 0.76rem; font-weight: 500; padding: 5px 10px;
          border-radius: 7px; cursor: pointer;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.5);
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          white-space: nowrap;
        }
        .dc-action-btn:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.8); }
        .dc-action-btn--danger       { color: rgba(248,113,113,0.7);  border-color: rgba(239,68,68,0.12); }
        .dc-action-btn--danger:hover { color: #f87171; background: rgba(239,68,68,0.08); }
        .dc-action-btn--danger-solid { background: rgba(239,68,68,0.12); color: #f87171; border-color: rgba(239,68,68,0.2); }
        .dc-action-btn--danger-solid:hover { background: rgba(239,68,68,0.2); }
        .dc-action-btn--primary      { background: rgba(59,130,246,0.1); color: #60a5fa; border-color: rgba(59,130,246,0.2); margin-left: auto; }
        .dc-action-btn--primary:hover { background: rgba(59,130,246,0.18); }
        .dc-action-btn:disabled { opacity: 0.5; pointer-events: none; }

        /* ── Confirm ────────────────────────────────────────────── */
        .dc-confirm { display: flex; gap: 5px; align-items: center; flex-wrap: wrap; }
        .dc-confirm-text { font-size: 0.76rem; color: rgba(248,113,113,0.7); margin-right: 2px; }

        .dc-err {
          font-size: 0.75rem; color: #f87171;
          background: rgba(239,68,68,0.08); border-radius: 6px;
          padding: 6px 10px; margin: 0; position: relative; z-index: 1;
        }

        /* ── Hint procesando ────────────────────────────────────── */
        .dc-processing-hint {
          display: flex; align-items: center; gap: 5px;
          font-size: 0.72rem; color: rgba(255,255,255,0.25);
          margin: 0; position: relative; z-index: 1;
        }

        /* ── Spin ───────────────────────────────────────────────── */
        .dc-spin { animation: dc-spin-anim 1s linear infinite; }
        @keyframes dc-spin-anim { to { transform: rotate(360deg); } }
      `}</style>
    </article>
  );
}
