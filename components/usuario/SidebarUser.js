"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Bell,
  User,
  HelpCircle,
  Settings,
  LogOut,
  FileStack,
  Bot,
  Ticket
} from "lucide-react";

import { useAuth } from "@/app/context/AuthContext";

export default function SidebarUser() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menu = [
    { name: "Inicio", path: "/usuario", icon: LayoutDashboard },
    { name: "Mis Documentos", path: "/usuario/documentos", icon: FileText },
    { name: "Asistente IA", path: "/usuario/chat", icon:  Bot},
    { name: "Tickets", path: "/usuario/tickets", icon: Ticket },
    { name: "Configuración", path: "/usuario/configuracion", icon: Settings },
  ];

  // 1. Mejoramos la función de logout para limpiar la caché de Next.js
  // En tu SidebarUser.js
  
  const handleLogout = async () => {
    // Ya no usamos router.push aquí.
    // Solo llamamos a la función del contexto y ella hará el trabajo sucio.
    await logout(); 
  };

  return (
    <aside
      className={`bg-white rounded-[32px] flex flex-col justify-between py-8 px-4 h-full transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.02)] shrink-0 ${
        isCollapsed ? "w-[90px]" : "w-[280px]"
      }`}
    >
      <div>
        {/* LOGO */}
        <div className={`flex items-center mb-12 px-2 ${isCollapsed ? "justify-center" : "gap-3"}`}>
          <button onClick={() => setIsCollapsed(!isCollapsed)}>
            <FileStack size={32} className="text-blue-600" />
          </button>

          {!isCollapsed && (
            <h2 className="text-[22px] font-bold text-blue-800">
              SmartDocs
            </h2>
          )}
        </div>

        {/* MENU */}
        <ul className="flex flex-col gap-5">
          {menu.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <li key={item.path} className="relative flex items-center group">
                {isActive && !isCollapsed && (
                  <div className="absolute -left-4 w-1.5 h-8 bg-blue-500 rounded-r-full" />
                )}

                <Link
                  href={item.path}
                  className={`w-full flex items-center py-3.5 px-4 rounded-2xl transition-all
                  ${isCollapsed ? "justify-center" : "gap-4"}
                  ${
                    isActive
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                      : "text-gray-500 hover:bg-blue-500 hover:text-white"
                  }`}
                >
                  <Icon size={22} />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      {/* LOGOUT */}
      <button
        onClick={handleLogout}
        className={`w-full flex items-center py-3.5 px-4 rounded-2xl text-gray-500 hover:bg-red-500 hover:text-white transition-all duration-300 ${
          isCollapsed ? "justify-center" : "gap-4"
        }`}
      >
        <LogOut size={22} />
        {/* 2. Envolvemos el texto en un <span> (en tu código admin sí lo tenías, aquí faltaba) */}
        {!isCollapsed && <span>Cerrar sesión</span>}
      </button>
    </aside>
  );
}