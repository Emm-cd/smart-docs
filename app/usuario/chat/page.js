// app/usuario/chat/page.js
"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import ChatWindow from "@/components/usuario/ChatWindow";
import { useChat } from "@/app/hooks/useChat";

export default function ChatPage() {
  const hook = useChat();

  return (
    <ProtectedRoute>
      <div className="h-[calc(100vh-120px)] flex flex-col">
        <div className="mb-4 shrink-0">
          <h2 className="text-2xl font-bold text-gray-800">Asistente IA</h2>
          <p className="text-gray-500 text-sm">
            Pregúntame sobre tus documentos, fechas, datos extraídos o cualquier duda
          </p>
        </div>
        <div className="flex-1 min-h-0">
          <ChatWindow hook={hook} />
        </div>
      </div>
    </ProtectedRoute>
  );
}