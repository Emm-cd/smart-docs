"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, FileText, Settings,
  LogOut, FileStack, Ticket, X, Menu,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

const menu = [
  { name: "Dashboard",   path: "/admin",               icon: LayoutDashboard },
  { name: "Usuarios",    path: "/admin/usuarios",       icon: Users           },
  { name: "Documentos",  path: "/admin/documentos",     icon: FileText        },
  { name: "Tickets",     path: "/admin/tickets",        icon: Ticket          },
];

export default function Sidebar() {
  const pathname     = usePathname();
  const { logout }   = useAuth();
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavLink = ({ item, onClick }) => {
    const Icon     = item.icon;
    const isActive = pathname === item.path;
    return (
      <li className="relative flex items-center group">
        {isActive && !collapsed && (
          <div className="absolute -left-4 w-1.5 h-8 bg-blue-500 rounded-r-full hidden lg:block" />
        )}
        <Link
          href={item.path}
          onClick={onClick}
          className={`w-full flex items-center py-3.5 px-4 rounded-2xl text-[15px] font-medium transition-all duration-200
            ${collapsed ? "justify-center lg:justify-center" : "gap-4"}
            ${isActive
              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
              : "text-gray-500 hover:bg-blue-500 hover:text-white"
            }`}
          title={collapsed ? item.name : ""}
        >
          <Icon size={22} strokeWidth={isActive ? 2.5 : 2}
            className={`transition-colors ${isActive ? "text-white" : "text-gray-400 group-hover:text-white"}`}
          />
          {!collapsed && <span>{item.name}</span>}
        </Link>
      </li>
    );
  };

  return (
    <>
      {/* ── DESKTOP SIDEBAR ─────────────────────────────────── */}
      <aside className={`hidden lg:flex bg-white rounded-[32px] flex-col justify-between py-8 px-4 h-full transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.02)] shrink-0 z-10
        ${collapsed ? "w-[90px]" : "w-[280px]"}`}>
        <div>
          {/* Logo */}
          <div className={`flex items-center mb-12 px-2 ${collapsed ? "justify-center" : "gap-3"}`}>
            <button onClick={() => setCollapsed(!collapsed)}
              className="focus:outline-none hover:scale-110 transition-transform cursor-pointer"
              title="Colapsar menú">
              <FileStack size={32} className="text-blue-600" />
            </button>
            {!collapsed && (
              <h2 className="text-[22px] font-bold text-blue-800 tracking-wide">SmartDocs</h2>
            )}
          </div>
          {/* Menu */}
          <ul className="list-none p-0 flex flex-col gap-5">
            {menu.map(item => <NavLink key={item.path} item={item} />)}
          </ul>
        </div>
        {/* Logout */}
        <div className="mt-auto pt-4 border-t border-gray-100">
          <button onClick={logout}
            className={`w-full flex items-center py-3.5 px-4 rounded-2xl text-[15px] font-medium text-gray-500 transition-all hover:bg-red-500 hover:text-white group
              ${collapsed ? "justify-center" : "gap-4"}`}
            title={collapsed ? "Cerrar sesión" : ""}>
            <LogOut size={22} className="text-gray-400 group-hover:text-white transition-colors" />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* ── MOBILE: BOTTOM NAV ──────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around px-2 py-2">
          {menu.slice(0, 4).map(item => {
            const Icon     = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all min-w-[56px]
                  ${isActive ? "text-blue-600" : "text-gray-400"}`}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className={`text-[10px] font-medium ${isActive ? "text-blue-600" : "text-gray-400"}`}>
                  {item.name.split(" ")[0]}
                </span>
                {isActive && <span className="w-1 h-1 rounded-full bg-blue-500" />}
              </Link>
            );
          })}
          {/* Logout en mobile */}
          <button onClick={logout}
            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-gray-400 min-w-[56px]">
            <LogOut size={22} strokeWidth={1.8} />
            <span className="text-[10px] font-medium">Salir</span>
          </button>
        </div>
      </nav>
    </>
  );
}