// app/hooks/useChat.js
"use client";
import { useState, useCallback } from "react";
import { createClient } from "@/app/lib/supabase/client";

export function useChat() {
  const [mensajes,       setMensajes]       = useState([]);
  const [cargando,       setCargando]       = useState(false);
  const [error,          setError]          = useState(null);
  const [conversacionId, setConversacionId] = useState(null);
  const [docContexto,    setDocContexto]    = useState(null);

  const supabase = createClient();

  // ── Cargar conversación existente ──────────────────────────────────────────
  const cargarConversacion = useCallback(async (id) => {
    const { data } = await supabase
      .from("conversaciones")
      .select("*, documentos(*)")
      .eq("id", id)
      .single();
    if (data) {
      setConversacionId(data.id);
      setMensajes(data.mensajes || []);
      setDocContexto(data.documentos || null);
    }
  }, []);

  // ── Nueva conversación ─────────────────────────────────────────────────────
  const nuevaConversacion = useCallback((docId = null) => {
    setMensajes([]);
    setConversacionId(null);
    setError(null);
    if (!docId) setDocContexto(null);
  }, []);

  // ── Enviar mensaje ─────────────────────────────────────────────────────────
  const enviar = useCallback(async (texto) => {
    if (!texto.trim() || cargando) return;

    const msgUsuario = { rol: "user", contenido: texto.trim(), ts: new Date().toISOString() };
    const historialPrevio = [...mensajes]; // guarda antes de actualizar
    setMensajes((prev) => [...prev, msgUsuario]);
    setCargando(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 30_000);

      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        signal:  controller.signal,
        body: JSON.stringify({
          mensaje:         texto.trim(),
          historial:       historialPrevio,
          conversacion_id: conversacionId,
          doc_contexto_id: docContexto?.id || null,
        }),
      });

      clearTimeout(timeoutId);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}`);
      }

      const msgBot = {
        rol:       "assistant",
        contenido: data.respuesta,
        ts:        new Date().toISOString(),
        fuentes:   data.fuentes || [],
      };

      setMensajes((prev) => [...prev, msgBot]);
      if (data.conversacion_id) setConversacionId(data.conversacion_id);

    } catch (err) {
      const msg = err.name === "AbortError"
        ? "La respuesta tardó demasiado. Intenta de nuevo."
        : err.message || "Error de conexión";

      setError(msg);
      // Quitar el mensaje del usuario si falló
      setMensajes(historialPrevio);
    } finally {
      setCargando(false);
    }
  }, [mensajes, cargando, conversacionId, docContexto]);

  const limpiar = useCallback(() => {
    setMensajes([]);
    setConversacionId(null);
    setDocContexto(null);
    setError(null);
  }, []);

  return {
    mensajes,
    cargando,
    error,
    conversacionId,
    docContexto,
    setDocContexto,
    enviar,
    limpiar,
    nuevaConversacion,
    cargarConversacion,
  };
}