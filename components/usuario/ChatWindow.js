"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/app/lib/supabase/client";
import MessageBubble, { TypingIndicator } from "./MessageBubble";
import ChatInput from "./ChatInput";
import {
  Bot, Plus, FileText, CreditCard, FileBadge, ScrollText,
  UserCheck, Receipt, ChevronRight, X, Sparkles,
  MessageSquare
} from "lucide-react";

// ── Helpers de estilo por tipo doc ──────────────────────────────────────────
const docStyle = (tipo) => {
  const t = (tipo || "").toUpperCase();
  if (t === "INE" || t.includes("CREDENCIAL"))
    return { icon: <CreditCard size={14} />, color: "text-green-600", bg: "bg-green-50" };
  if (t === "PASAPORTE")
    return { icon: <FileBadge size={14} />,  color: "text-blue-600",  bg: "bg-blue-50"  };
  if (t === "ACTA_NACIMIENTO")
    return { icon: <ScrollText size={14} />, color: "text-orange-600", bg: "bg-orange-50" };
  if (t === "FORMATO_CURP")
    return { icon: <UserCheck size={14} />,  color: "text-purple-600", bg: "bg-purple-50" };
  if (t.includes("CONSTANCIA") || t.includes("FISCAL"))
    return { icon: <Receipt size={14} />,    color: "text-teal-600",   bg: "bg-teal-50"   };
  return { icon: <FileText size={14} />,     color: "text-gray-500",   bg: "bg-gray-100"  };
};

// ── Componente principal ─────────────────────────────────────────────────────
export default function ChatWindow({ hook }) {
  const {
    mensajes, cargando, error,
    conversacionId, docContexto, setDocContexto,
    enviar, limpiar, nuevaConversacion, cargarConversacion,
  } = hook;

  const [documentos, setDocumentos] = useState([]);
  const [conversaciones, setConversaciones] = useState([]);
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [nombreUsuario, setNombreUsuario] = useState("");

  const supabase = createClient();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, cargando]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("usuarios")
          .select("nombre, apellido")
          .eq("id", user.id)
          .single();
        if (!error && data) {
          const fullName = `${data.nombre} ${data.apellido}`.trim();
          setNombreUsuario(fullName);
        }
      }
    };
    fetchUser();
  }, [supabase]);

  const cargarDatos = useCallback(async () => {
    setLoadingDocs(true);
    const [{ data: docs }, { data: convs }] = await Promise.all([
      supabase.from("documentos").select("id,tipo_doc,filename,resumen_ia")
        .is("eliminado_en", null).order("creado_en", { ascending: false }),
      supabase.from("conversaciones").select("id,mensajes,creado_en,doc_contexto_id")
        .order("actualizado_en", { ascending: false }).limit(20),
    ]);
    setDocumentos(docs || []);
    setConversaciones(convs || []);
    setLoadingDocs(false);
  }, [supabase]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const handleNueva = () => {
    nuevaConversacion();
    setSidebarAbierto(false);
  };

  const handleCargarConv = (conv) => {
    cargarConversacion(conv.id);
    setSidebarAbierto(false);
  };

  const handleSeleccionarDoc = (doc) => {
    setDocContexto(doc);
    setSidebarAbierto(false);
  };

  const convLabel = (conv) => {
    const msgs = conv.mensajes || [];
    const primero = msgs.find((m) => m.rol === "user");
    if (primero) return primero.contenido.slice(0, 46) + (primero.contenido.length > 46 ? "…" : "");
    return "Conversación";
  };

  return (
    <div className="flex w-full h-[calc(100vh-220px)] min-h-[500px] overflow-hidden rounded-2xl border border-gray-200 shadow-sm bg-white">

      {/* SIDEBAR */}
      <aside className={`flex-col border-r border-gray-100 bg-gray-50 transition-all duration-200 
        ${sidebarAbierto ? "flex w-72" : "hidden lg:flex lg:w-64"}`}>

        <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <span className="text-sm font-semibold text-gray-700">Conversaciones</span>
          <button onClick={handleNueva} className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">
            <Plus size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">
              Preguntar sobre…
            </p>
            {loadingDocs ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-9 bg-gray-200 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                <button
                  onClick={() => { setDocContexto(null); setSidebarAbierto(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition
                    ${!docContexto ? "bg-blue-600 text-white" : "hover:bg-white text-gray-600"}`}
                >
                  <Sparkles size={13} />
                  Todos mis documentos
                </button>
                {documentos.map((doc) => {
                  const s = docStyle(doc.tipo_doc);
                  const activo = docContexto?.id === doc.id;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => handleSeleccionarDoc(doc)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition text-left
                        ${activo ? "bg-blue-600 text-white" : "hover:bg-white text-gray-600"}`}
                    >
                      <span className={activo ? "text-white" : s.color}>{s.icon}</span>
                      <span className="truncate">{doc.filename}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {conversaciones.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">
                Historial
              </p>
              <div className="space-y-1">
                {conversaciones.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleCargarConv(conv)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition text-left
                      ${conversacionId === conv.id ? "bg-blue-50 text-blue-700 border border-blue-100" : "hover:bg-white text-gray-500"}`}
                  >
                    <MessageSquare size={12} />
                    <span className="truncate">{convLabel(conv)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Header Fijo */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <MessageSquare size={16} className="text-gray-400" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">Asistente de Documentos</p>
          </div>
          <button onClick={handleNueva} className="text-gray-400 hover:text-blue-600 transition">
            <Plus size={18} />
          </button>
        </div>

        {/* Mensajes con Scroll Interno */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {mensajes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in zoom-in duration-300">
              <div className="bg-blue-50 p-4 rounded-full mb-4">
                <Bot size={40} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Bienvenido, {nombreUsuario || "Usuario"}
              </h2>
              <p className="text-gray-500 max-w-xs">
                ¿En qué te puedo ayudar con tus documentos hoy?
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {mensajes.map((msg, i) => (
                <MessageBubble key={i} mensaje={msg} />
              ))}
              {cargando && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input Fijo al final */}
        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <ChatInput onEnviar={enviar} cargando={cargando} />
        </div>
      </div>
    </div>
  );
}