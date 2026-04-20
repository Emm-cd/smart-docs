// components/chat/MessageBubble.jsx
"use client";
import { Bot, User, FileText } from "lucide-react";

// Formatea la hora HH:MM
const hora = (ts) => {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
};

// Convierte **negrita** y saltos de línea simples
function formatearTexto(texto) {
  const partes = texto.split(/(\*\*[^*]+\*\*)/g);
  return partes.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    }
    // Saltos de línea
    return p.split("\n").map((linea, j, arr) => (
      <span key={`${i}-${j}`}>
        {linea}
        {j < arr.length - 1 && <br />}
      </span>
    ));
  });
}

export default function MessageBubble({ mensaje }) {
  const esUsuario = mensaje.rol === "user";

  return (
    <div className={`flex gap-3 ${esUsuario ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${esUsuario
            ? "bg-blue-600 text-white"
            : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
          }`}
      >
        {esUsuario ? <User size={15} /> : <Bot size={15} />}
      </div>

      {/* Burbuja */}
      <div className={`max-w-[80%] flex flex-col gap-1 ${esUsuario ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
            ${esUsuario
              ? "bg-blue-600 text-white rounded-tr-sm"
              : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm"
            }`}
        >
          {formatearTexto(mensaje.contenido)}
        </div>

        {/* Fuentes de documentos referenciados */}
        {!esUsuario && mensaje.fuentes?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {mensaje.fuentes.map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-600
                           border border-indigo-100 rounded-full px-2 py-0.5 font-medium"
              >
                <FileText size={9} />
                {f}
              </span>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-gray-400 px-1">{hora(mensaje.ts)}</span>
      </div>
    </div>
  );
}

// ── Skeleton de carga (mientras el asistente responde) ───────────────────────
export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600
                      text-white flex items-center justify-center">
        <Bot size={15} />
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
