// components/chat/ChatInput.jsx
"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Paperclip } from "lucide-react";

export default function ChatInput({ onEnviar, cargando, disabled }) {
  const [texto, setTexto] = useState("");
  const textareaRef = useRef(null);

  // Auto-resize del textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [texto]);

  const handleEnviar = () => {
    if (!texto.trim() || cargando || disabled) return;
    onEnviar(texto);
    setTexto("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  return (
    <div className="px-4 py-3 border-t border-gray-100 bg-white">
      <div
        className={`flex items-end gap-2 bg-gray-50 border rounded-2xl px-3 py-2 transition
          ${disabled ? "opacity-50" : "border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100"}`}
      >
        <textarea
          ref={textareaRef}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || cargando}
          placeholder="Escribe tu pregunta sobre tus documentos…"
          rows={1}
          className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400
                     resize-none outline-none leading-relaxed py-1 max-h-40"
        />
        <button
          onClick={handleEnviar}
          disabled={!texto.trim() || cargando || disabled}
          className="shrink-0 w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center
                     hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed mb-0.5"
        >
          <Send size={14} />
        </button>
      </div>
      <p className="text-center text-[10px] text-gray-400 mt-1.5">
        Enter para enviar · Shift + Enter para nueva línea
      </p>
    </div>
  );
}
