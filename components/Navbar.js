"use client";

import { useEffect, useState } from "react";
import { Shield, Calendar, Clock } from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";

export default function Navbar() {
  const supabase = createClient();
  const [time,     setTime]     = useState("");
  const [date,     setDate]     = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("usuarios")
        .select("nombre")
        .eq("id", user.id)
        .single();
      setUserName(data?.nombre || "Admin");
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setDate(now.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="bg-white rounded-2xl flex items-center justify-between py-3 px-4 sm:py-4 sm:px-6 mb-4 sm:mb-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">

      {/* Avatar + saludo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shrink-0">
          <Shield size={18} />
        </div>
        <p className="font-medium text-gray-700 text-sm sm:text-base">
          ¡Hola,{" "}
          <span className="text-blue-600 font-bold">
            {userName || "Cargando…"}!
          </span>
        </p>
      </div>

      {/* Fecha + hora en desktop */}
      {(date || time) && (
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400 shrink-0" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-2 min-w-[115px] justify-end">
            <Clock size={16} className="text-gray-400 shrink-0" />
            <span className="font-mono">{time}</span>
          </div>
        </div>
      )}

      {/* Solo hora en tablet/móvil */}
      {time && (
        <div className="flex md:hidden items-center gap-1.5 text-sm text-gray-600">
          <Clock size={15} className="text-gray-400 shrink-0" />
          <span className="font-mono text-xs">{time}</span>
        </div>
      )}
    </header>
  );
}