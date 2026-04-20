"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Solo actuamos cuando ya terminó de cargar la sesión de Supabase
    if (!loading) {
      if (!user) {
        // 1. Si no hay usuario logueado, lo mandamos al login
        router.push("/login");
      } else if (requireAdmin && user.app_metadata?.rol !== 'admin') {
        // 2. Si es una ruta de admin, pero el usuario no tiene ese rol
        router.push("/usuario"); // o la ruta que uses para tus usuarios normales
      }
    }
  }, [user, loading, router, requireAdmin]);

  // Mientras verifica la sesión, mostramos algo genérico
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Verificando permisos...
      </div>
    );
  }

  // Si no hay usuario o no tiene el rol, retornamos null para no renderizar la página protegida
  if (!user) return null;
  if (requireAdmin && user.app_metadata?.rol !== 'admin') return null;

  // Si pasa todas las pruebas de seguridad, mostramos la página
  return <>{children}</>;
}   