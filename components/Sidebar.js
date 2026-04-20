"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; 
import {
  LayoutDashboard, Users, FileText, Briefcase, Settings, HelpCircle, LogOut, FileStack,
  Ticket
} from "lucide-react";
// 1. NUEVO: Importamos tu hook de autenticación
import { useAuth } from "@/app/context/AuthContext"; 

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter(); 
  
  // 2. NUEVO: Extraemos la función logout de tu contexto
  const { logout } = useAuth(); 
  
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menu = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { name: "Usuarios", path: "/admin/usuarios", icon: Users },
    { name: "Documentos", path: "/admin/documentos", icon: FileText },
    { name: "Tickets", path: "/admin/tickets", icon: Ticket },
    //{ name: "Configuración", path: "/admin/configuracion", icon: Settings },
  ];

  const handleLogout = async () => {
    // Ya no usamos router.push aquí.
    // Solo llamamos a la función del contexto y ella hará el trabajo sucio.
    await logout(); 
  };

  return (
    <aside 
      className={`bg-white rounded-[32px] flex flex-col justify-between py-8 px-4 h-full transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.02)] z-10 shrink-0 ${isCollapsed ? "w-[90px]" : "w-[280px]"}`}
    >
      <div>
        {/* LOGO Y BOTÓN DE COLAPSAR */}
        <div className={`flex items-center mb-12 px-2 ${isCollapsed ? "justify-center" : "gap-3"}`}>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="focus:outline-none hover:scale-110 transition-transform cursor-pointer"
            title="Ocultar/Mostrar menú"
          >
            <FileStack size={32} className="text-blue-600" />
          </button>
          
          {!isCollapsed && (
            <h2 className="text-[22px] font-bold text-blue-800 tracking-wide">
              SmartDocs
            </h2>
          )}
        </div>

        {/* MENU */}
        <ul className="list-none p-0 flex flex-col gap-5">
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
                  className={`
                    w-full flex items-center py-3.5 px-4 rounded-2xl text-[15px] font-medium transition-all duration-300
                    ${isCollapsed ? "justify-center" : "gap-4"}
                    ${isActive 
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30" 
                      : "text-gray-500 hover:bg-blue-500 hover:text-white"
                    }
                  `}
                  title={isCollapsed ? item.name : ""}
                >
                  <Icon 
                    size={22} 
                    strokeWidth={isActive ? 2.5 : 2} 
                    className={`transition-colors duration-300 ${isActive ? "text-white" : "text-gray-400 group-hover:text-white"}`} 
                  />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* CERRAR SESIÓN */}
      <div className="mt-auto pt-4 border-t border-gray-100">
        <button 
          // 4. NUEVO: Llamamos a la función que creamos
          onClick={handleLogout}
          className={`w-full flex items-center py-3.5 px-4 rounded-2xl text-[15px] font-medium text-gray-500 transition-all duration-300 hover:bg-red-500 hover:text-white group ${isCollapsed ? "justify-center" : "gap-4"}`}
          title={isCollapsed ? "Cerrar sesión" : ""}
        >
          <LogOut 
            size={22} 
            className="text-gray-400 transition-colors duration-300 group-hover:text-white" 
          />
          {!isCollapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
      
    </aside>
  );
}