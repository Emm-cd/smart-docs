"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, User2 } from "lucide-react";
import { createClient } from "@/app/lib/supabase/client"; 

export default function NavbarUser() {
  const supabase = createClient();
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [userData, setUserData] = useState({
    nombre: "",
    apellido: "",
    username: "",
  });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from("usuarios")
          .select("nombre, apellido, username")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error(error.message);
        } else {
          setUserData({
            nombre: data?.nombre || "",
            apellido: data?.apellido || "",
            username: data?.username || "usuario",
          });
        }
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      setTime(now.toLocaleTimeString("es-MX"));
      setDate(
        now.toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 🔹 Construcción del nombre
  const fullName = `${userData.nombre} ${userData.apellido}`.trim();

  return (
    <header className="bg-white rounded-2xl flex justify-between items-center py-4 px-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
          <User2 size={20} />
        </div>

        <span className="text-gray-700">
          ¡Hola,{" "}
          <span className="text-blue-600 font-bold">
            {fullName || "Usuario"}
          </span>
          !
          - @{userData.username}
        </span>
      </div>

      <div className="flex gap-8 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar size={18} />
          {date}
        </div>

        <div className="flex items-center gap-2">
          <Clock size={18} />
          {time}
        </div>
      </div>
    </header>
  );
}