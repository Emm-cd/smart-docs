"use client";

import { Users, FileText, Briefcase, TrendingUp, TrendingDown } from "lucide-react";

// Mapeo de colores y sus versiones "suaves" para el fondo
const configMap = {
  users: {
    icon: Users,
    colorMain: "bg-amber-500",      
    colorSoft: "bg-amber-500/10",   
    textColor: "text-amber-600"
  },
  documents: {
    icon: FileText,
    colorMain: "bg-emerald-500",    
    colorSoft: "bg-emerald-500/10",
    textColor: "text-emerald-600"
  },
  crm: {
    icon: Briefcase,
    colorMain: "bg-blue-500",       
    colorSoft: "bg-blue-500/10",
    textColor: "text-blue-600"
  },
};

export default function Card({ type, title, total, percentage }) {
  // SEGURO: Convertimos estrictamente a número. Así, si llega -25, sabrá que es negativo.
  const numPercentage = Number(percentage) || 0;
  const isPositive = numPercentage >= 0;
  
  const config = configMap[type] || configMap.users;
  const Icon = config.icon;

  return (
    <div 
      className={`
        relative rounded-2xl p-[18px_20px] min-h-[140px] 
        flex flex-col justify-between border border-slate-100 
        transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)]
        ${config.colorSoft}
      `}
    >
      <div className={`absolute top-4 right-4 w-14 h-14 rounded-full flex items-center justify-center text-white ${config.colorMain}`}>
        <Icon size={28} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-black">
          {title}
        </span>
        <span className="text-[26px] font-semibold text-gray-900 leading-none mt-1">
          {total}
        </span>
        <span className="text-xs text-gray-400 mt-1">
          Total acumulado
        </span>
      </div>

      {/* Aquí aplicamos los colores dinámicos basados en isPositive */}
      <div 
        className={`
          absolute bottom-4 right-4 flex items-center gap-1 text-xs font-semibold
          ${isPositive ? "text-emerald-500" : "text-red-500"}
        `}
      >
        {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        {Math.abs(numPercentage)}%
      </div>
    </div>
  );
}