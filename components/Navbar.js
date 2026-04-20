"use client"; 

import { useEffect, useState } from "react";
import { Shield, Calendar, Clock } from "lucide-react";
import { createClient } from "@/app/lib/supabase/client"; 

export default function Navbar() {
  const supabase = createClient();
  // Estados para guardar la hora, fecha y nombre del usuario
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [userName, setUserName] = useState(""); // Estado inicial vacío

  // useEffect para obtener los datos del usuario logueado
  useEffect(() => {
    const fetchUserData = async () => {
      // 1. Obtenemos el usuario de la sesión actual
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // 2. Buscamos su nombre en la tabla 'usuarios' usando su ID
        const { data, error } = await supabase
          .from("usuarios")
          .select("nombre")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error al obtener el nombre:", error.message);
          setUserName("Admin"); // Fallback por si hay un error
        } else if (data) {
          setUserName(data.nombre); // Guardamos el nombre ("Emma", etc.)
        }
      }
    };

    fetchUserData();
  }, []);

  // useEffect para la fecha y hora (tal como lo tenías)
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      
      setTime(
        now.toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );

      setDate(
        now.toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      );
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white rounded-2xl flex items-center justify-between py-4 px-6 mb-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      
      {/* Saludo y Avatar */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
          <Shield size={20} />
        </div>
        <span className="font-medium text-gray-700">
          ¡Hola, <span className="text-blue-600 font-bold">{userName || "Cargando..."}!</span>
        </span>
      </div>

      {/* Fecha y Hora Dinámicas */}
      {(date || time) && (
        <div className="flex items-center gap-8 text-sm font-medium text-gray-600">
          
          <div className="flex items-center gap-2.5">
            <Calendar size={18} className="text-gray-800" />
            <span className="">{date}</span>
          </div>

          <div className="flex items-center gap-2.5 w-[115px] justify-end">
            <Clock size={18} className="text-gray-800" />
            <span>{time}</span>
          </div>
          
        </div>
      )}
      
    </header>
  );
}