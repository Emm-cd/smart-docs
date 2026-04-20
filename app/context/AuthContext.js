"use client";
import { createContext, useContext, useEffect, useState } from "react";
// 1. IMPORTANTE: Cambia esta línea
import { createClient } from "@/app/lib/supabase/client"; 

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 2. IMPORTANTE: Agrega esta línea para inicializar supabase
  const supabase = createClient();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    getSession();
    // Escuchar cambios de estado (login, ñogout, cambio de contraseña)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      // SE BORRA LA SESION DE SUPABASE
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null); 
      
      // SE DA UN TIEMPO DE ESPERA PARA QUE LAS COOKIES SE LIMPIEN ANTES DE REDIRIGIR 
      setTimeout(() => {
        window.location.href = "/login"; 
      }, 300);
    } catch (error) {
      console.error("Error al cerrar sesión:", error.message);
    }
  };

  // --- 2. NUEVO EFECTO: TEMPORIZADOR DE INACTIVIDAD ---
  useEffect(() => {
    // Si no hay un usuario logueado, no hacemos nada. 
    // Esto evita que el temporizador corra en la pantalla de login.
    if (!user) return;

    let timeoutId;
    const INACTIVITY_TIME = 30 * 60 * 1000; 

    const resetTimer = () =>{
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log("Sesión expirada por inactividad de 30 minutos");
        logout(); 
      }, INACTIVITY_TIME);
    };

    // Lista de eventos que consideramos como "actividad" por parte del usuario
    const activeEvents = [
      "mousedown", "mousemove",
      "keypress", "scroll", "touchstart"
    ];


    resetTimer();
    activeEvents.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activeEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [user]); // reacciona cada vez que la variable 'user' cambia

  return (
    <AuthContext.Provider value={{ user, logout, loading }}>
      {!loading ? (
        children
      ) : (
        <div className="h-screen flex items-center justify-center font-sans text-gray-600">
          Cargando sesión...
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);