"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, User2, Menu } from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";

export default function NavbarUser() {
  const supabase = createClient();
  const [time,     setTime]     = useState("");
  const [date,     setDate]     = useState("");
  const [userData, setUserData] = useState({ nombre: "", apellido: "", username: "" });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("usuarios")
        .select("nombre, apellido, username")
        .eq("id", user.id)
        .single();
      if (data) setUserData({ nombre: data.nombre || "", apellido: data.apellido || "", username: data.username || "usuario" });
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("es-MX"));
      setDate(now.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const fullName = `${userData.nombre} ${userData.apellido}`.trim();
  const initials = (userData.nombre?.[0] || "") + (userData.apellido?.[0] || "");

  return (
    <header className="bg-white rounded-2xl flex items-center justify-between py-3 px-4 sm:py-4 sm:px-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">

      {/* Avatar + saludo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
          {initials || <User2 size={18} />}
        </div>
        <div className="min-w-0">
          <p className="text-gray-700 text-sm sm:text-base truncate">
            ¡Hola, <span className="text-blue-600 font-bold">{fullName || "Usuario"}</span>!
          </p>
          {/* username solo en sm+ */}
          <p className="text-xs text-gray-400 hidden sm:block">@{userData.username}</p>
        </div>
      </div>

      {/* Fecha y hora — ocultas en mobile */}
      {(date || time) && (
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400 shrink-0" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-2 min-w-[100px] justify-end">
            <Clock size={16} className="text-gray-400 shrink-0" />
            <span className="font-mono">{time}</span>
          </div>
        </div>
      )}

      {/* Solo hora en tablet */}
      {time && (
        <div className="flex md:hidden items-center gap-1.5 text-sm text-gray-600">
          <Clock size={15} className="text-gray-400 shrink-0" />
          <span className="font-mono text-xs">{time}</span>
        </div>
      )}
    </header>
  );
}