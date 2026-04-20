"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import SidebarUser from "@/components/usuario/SidebarUser";
import NavbarUser from "@/components/usuario/NavbarUser";

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading]);

  if (loading) return <p className="p-10">Cargando...</p>;

  return (
    <div className="bg-[#f6f8fb] min-h-screen p-3 md:p-4">
      
      <div className="flex flex-col lg:flex-row gap-4 min-h-[calc(100vh-1.5rem)] lg:h-[calc(100vh-2rem)]">
        <SidebarUser />
        {/* MAIN */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <NavbarUser />
          {/* CONTENIDO */}
          <main className="bg-white rounded-2xl p-4 md:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-auto flex-1 relative">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}