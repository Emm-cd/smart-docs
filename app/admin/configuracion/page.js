"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Settings, HardDrive, Users, Save, AlertTriangle,
  CheckCircle2, Loader2, Shield, ToggleLeft, ToggleRight,
  X, Pencil, ChevronDown, UserCheck, Ban, Mail,
  Database, Info,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { createClient } from "@/app/lib/supabase/client";

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
const formatFecha = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
};
function getUserNombre(u) {
  if (!u) return "—";
  if (u.nombre) return `${u.nombre} ${u.apellido || ""}`.trim();
  return u.email ?? u.id?.slice(0, 8) + "…";
}

const CONFIG_META = {
  almacenamiento_limite_mb: { label: "Límite de almacenamiento por usuario (MB)", descripcion: "Espacio máximo permitido por usuario",              tipo: "number",  unidad: "MB", Icon: HardDrive, grupo: "almacenamiento" },
  tamano_maximo_archivo_mb: { label: "Tamaño máximo de archivo (MB)",             descripcion: "Tamaño máximo permitido por archivo subido",         tipo: "number",  unidad: "MB", Icon: Database,  grupo: "almacenamiento" },
  tipos_archivo_permitidos: { label: "Tipos de archivo permitidos",               descripcion: "Extensiones separadas por coma (pdf,jpg,png)",        tipo: "text",              Icon: Shield,   grupo: "archivos"       },
  registro_habilitado:      { label: "Registro de nuevos usuarios",               descripcion: "Permite que nuevos usuarios se registren",            tipo: "boolean",           Icon: Users,    grupo: "acceso"         },
  mantenimiento:            { label: "Modo mantenimiento",                         descripcion: "Bloquea el acceso a usuarios no administradores",     tipo: "boolean",           Icon: Settings, grupo: "acceso"         },
};

const GRUPOS = {
  almacenamiento: { label: "Almacenamiento",    color: "text-blue-600",   bg: "bg-blue-50"   },
  archivos:       { label: "Archivos",           color: "text-teal-600",   bg: "bg-teal-50"   },
  acceso:         { label: "Acceso y Seguridad", color: "text-purple-600", bg: "bg-purple-50" },
};

const ROLES_LABEL = {
  admin:   { label: "Administrador", color: "bg-purple-100 text-purple-700" },
  usuario: { label: "Usuario",       color: "bg-blue-100 text-blue-700"     },
};

const ESTADO_LABEL = {
  activo:    { label: "Activo",    color: "bg-green-100 text-green-700"  },
  inactivo:  { label: "Inactivo",  color: "bg-gray-100 text-gray-500"    },
  bloqueado: { label: "Bloqueado", color: "bg-red-100 text-red-600"      },
};

function Toast({ message, tipo }) {
  return (
    <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium ${
      tipo === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"
    }`}>
      {tipo === "error" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
      {message}
    </div>
  );
}

// ── FIX: componente separado para evitar hooks dentro de .map() ───
function ConfigRow({ clave, label, descripcion, tipo, unidad, Icon, grupoCfg, valorInicial, onSave, onToggle, isLoading }) {
  // ✅ Los hooks ahora están en un componente real, no en un .map()
  const [local, setLocal] = useState(valorInicial);

  useEffect(() => {
    setLocal(valorInicial);
  }, [valorInicial]);

  return (
    <div className="px-5 py-4 flex items-center gap-4">
      <div className={`p-2.5 rounded-xl shrink-0 ${grupoCfg.bg}`}>
        <Icon size={16} className={grupoCfg.color} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-800">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{descripcion}</p>
      </div>

      {tipo === "boolean" ? (
        <button
          onClick={() => onToggle(clave, valorInicial)}
          disabled={isLoading}
          className="shrink-0 flex items-center gap-2 transition">
          {isLoading
            ? <Loader2 size={24} className="animate-spin text-gray-400" />
            : valorInicial === "true"
              ? <ToggleRight size={32} className="text-blue-600" />
              : <ToggleLeft  size={32} className="text-gray-400" />}
          <span className={`text-sm font-semibold ${valorInicial === "true" ? "text-blue-600" : "text-gray-400"}`}>
            {valorInicial === "true" ? "Activado" : "Desactivado"}
          </span>
        </button>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <input
              type={tipo === "number" ? "number" : "text"}
              value={local}
              onChange={e => setLocal(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500"
            />
            {unidad && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                {unidad}
              </span>
            )}
          </div>
          <button
            onClick={() => onSave(clave, local)}
            disabled={isLoading || local === valorInicial}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition disabled:opacity-40">
            {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            Guardar
          </button>
        </div>
      )}
    </div>
  );
}

function TabGeneral({ supabase }) {
  const [configs,   setConfigs]   = useState({});
  const [loading,   setLoading]   = useState(true);
  const [guardando, setGuardando] = useState({});
  const [toast,     setToast]     = useState(null);
  const [noTabla,   setNoTabla]   = useState(false);

  const showToast = (message, tipo = "success") => {
    setToast({ message, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("configuracion_sistema").select("*");
    if (error) {
      if (error.code === "42P01") setNoTabla(true);
      else console.error(error.message);
      setLoading(false);
      return;
    }
    const map = {};
    (data || []).forEach(row => { map[row.clave] = row.valor; });
    setConfigs(map);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const handleSave = async (clave, valor) => {
    setGuardando(g => ({ ...g, [clave]: true }));
    const { error } = await supabase
      .from("configuracion_sistema")
      .upsert({ clave, valor: String(valor), actualizado_en: new Date().toISOString() }, { onConflict: "clave" });
    if (error) {
      showToast("Error al guardar: " + error.message, "error");
    } else {
      setConfigs(c => ({ ...c, [clave]: String(valor) }));
      showToast("Configuración guardada correctamente");
    }
    setGuardando(g => ({ ...g, [clave]: false }));
  };

  const handleToggle = async (clave, actual) => {
    const nuevo = actual === "true" ? "false" : "true";
    await handleSave(clave, nuevo);
  };

  if (noTabla) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-4">
        <AlertTriangle size={24} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-800 mb-1">Tabla no encontrada</p>
          <p className="text-sm text-amber-700 mb-3">
            La tabla <code className="bg-amber-100 px-1 rounded">configuracion_sistema</code> no existe.
            Ejecuta el script <b>admin-schemas.sql</b> en el SQL Editor de Supabase.
          </p>
          <button onClick={fetchConfigs} className="text-sm font-semibold text-amber-700 underline">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Agrupar claves por grupo
  const porGrupo = {};
  Object.entries(CONFIG_META).forEach(([clave, meta]) => {
    if (!porGrupo[meta.grupo]) porGrupo[meta.grupo] = [];
    porGrupo[meta.grupo].push({ clave, ...meta });
  });

  return (
    <div className="space-y-6">
      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
        ))
      ) : (
        Object.entries(porGrupo).map(([grupo, items]) => {
          const grupoCfg = GRUPOS[grupo];
          return (
            <div key={grupo} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className={`px-5 py-3 border-b border-gray-100 flex items-center gap-2 ${grupoCfg.bg}`}>
                <span className={`text-xs font-bold uppercase tracking-wide ${grupoCfg.color}`}>
                  {grupoCfg.label}
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {/* ✅ ConfigRow es un componente real → hooks válidos */}
                {items.map(({ clave, label, descripcion, tipo, unidad, Icon }) => (
                  <ConfigRow
                    key={clave}
                    clave={clave}
                    label={label}
                    descripcion={descripcion}
                    tipo={tipo}
                    unidad={unidad}
                    Icon={Icon}
                    grupoCfg={grupoCfg}
                    valorInicial={configs[clave] ?? ""}
                    onSave={handleSave}
                    onToggle={handleToggle}
                    isLoading={!!guardando[clave]}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}
      {toast && <Toast message={toast.message} tipo={toast.tipo} />}
    </div>
  );
}

function TabUsuarios({ supabase }) {
  const [usuarios,     setUsuarios]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [toast,        setToast]        = useState(null);
  const [editando,     setEditando]     = useState(null);
  const [guardando,    setGuardando]    = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);

  const showToast = (message, tipo = "success") => {
    setToast({ message, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nombre, apellido, email, username, rol, estado, fecha_registro, almacenamiento_usado, almacenamiento_limite")
      .order("fecha_registro", { ascending: false });
    if (error) console.error(error.message);
    setUsuarios(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);

  const handleUpdateField = async (id, campo, valor) => {
    setGuardando(`${id}-${campo}`);
    const { error } = await supabase.from("usuarios").update({ [campo]: valor }).eq("id", id);
    if (error) {
      showToast("Error al actualizar: " + error.message, "error");
    } else {
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, [campo]: valor } : u));
      showToast("Usuario actualizado correctamente");
      setEditando(null);
    }
    setGuardando(null);
    setOpenDropdown(null);
  };

  const usuariosFiltrados = useMemo(() => {
    const term = search.toLowerCase();
    return usuarios.filter(u =>
      getUserNombre(u).toLowerCase().includes(term) ||
      (u.email ?? "").toLowerCase().includes(term) ||
      (u.username ?? "").toLowerCase().includes(term)
    );
  }, [usuarios, search]);

  return (
    <div className="space-y-4" onClick={() => setOpenDropdown(null)}>
      <div className="relative">
        <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, email o username…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="py-3.5 px-5">Usuario</th>
                <th className="py-3.5 px-5">Almacenamiento</th>
                <th className="py-3.5 px-5">Rol</th>
                <th className="py-3.5 px-5">Estado</th>
                <th className="py-3.5 px-5">Registro</th>
                <th className="py-3.5 px-5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="py-3.5 px-5">
                        <div className="h-4 bg-gray-100 rounded-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                    Sin usuarios encontrados
                  </td>
                </tr>
              ) : usuariosFiltrados.map(u => {
                const rolInfo    = ROLES_LABEL[u.rol]    ?? { label: u.rol,    color: "bg-gray-100 text-gray-600" };
                const estadoInfo = ESTADO_LABEL[u.estado] ?? { label: u.estado, color: "bg-gray-100 text-gray-600" };
                const usado      = u.almacenamiento_usado  ?? 0;
                const limite     = u.almacenamiento_limite ?? (100 * 1024 * 1024);
                const pct        = Math.min(Math.round((usado / limite) * 100), 100);
                const isEditandoLimite = editando?.id === u.id && editando?.campo === "almacenamiento_limite";

                return (
                  <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                          {getUserNombre(u).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{getUserNombre(u)}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[180px]">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-5">
                      <div className="w-32">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{formatBytes(usado)}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full transition-all"
                            style={{ width: `${pct}%`, background: pct >= 90 ? "#EF4444" : pct >= 70 ? "#F59E0B" : "#3B82F6" }} />
                        </div>
                        {isEditandoLimite ? (
                          <div className="flex items-center gap-1 mt-1.5">
                            <input type="number" defaultValue={Math.round(limite / (1024 * 1024))}
                              id={`limite-${u.id}`}
                              className="w-16 text-xs border border-gray-300 rounded-lg px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                              autoFocus />
                            <span className="text-xs text-gray-400">MB</span>
                            <button
                              onClick={() => {
                                const val = parseInt(document.getElementById(`limite-${u.id}`).value);
                                if (!isNaN(val)) handleUpdateField(u.id, "almacenamiento_limite", val * 1024 * 1024);
                              }}
                              disabled={guardando === `${u.id}-almacenamiento_limite`}
                              className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-1 rounded-lg">
                              {guardando === `${u.id}-almacenamiento_limite` ? "…" : "OK"}
                            </button>
                            <button onClick={() => setEditando(null)} className="text-gray-400 p-0.5">
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditando({ id: u.id, campo: "almacenamiento_limite" })}
                            className="mt-1 text-[10px] text-blue-500 hover:text-blue-700 flex items-center gap-0.5 transition">
                            <Pencil size={9} /> Límite: {Math.round(limite / (1024 * 1024))} MB
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-5">
                      <div className="relative">
                        <button
                          onClick={e => { e.stopPropagation(); setOpenDropdown(openDropdown === `rol-${u.id}` ? null : `rol-${u.id}`); }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border cursor-pointer transition hover:opacity-80 ${rolInfo.color} border-current/20`}>
                          {rolInfo.label} <ChevronDown size={10} />
                        </button>
                        {openDropdown === `rol-${u.id}` && (
                          <div className="absolute top-full mt-1 left-0 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1.5 min-w-[140px]">
                            {Object.entries(ROLES_LABEL).map(([key, cfg]) => (
                              <button key={key} onClick={() => handleUpdateField(u.id, "rol", key)}
                                className={`w-full text-left px-4 py-2 text-xs font-semibold transition ${u.rol === key ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}>
                                {cfg.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-5">
                      <div className="relative">
                        <button
                          onClick={e => { e.stopPropagation(); setOpenDropdown(openDropdown === `est-${u.id}` ? null : `est-${u.id}`); }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer hover:opacity-80 transition ${estadoInfo.color}`}>
                          {estadoInfo.label} <ChevronDown size={10} />
                        </button>
                        {openDropdown === `est-${u.id}` && (
                          <div className="absolute top-full mt-1 left-0 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1.5 min-w-[140px]">
                            {Object.entries(ESTADO_LABEL).map(([key, cfg]) => (
                              <button key={key} onClick={() => handleUpdateField(u.id, "estado", key)}
                                className={`w-full text-left px-4 py-2 text-xs font-semibold transition ${u.estado === key ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}>
                                {cfg.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-5 text-xs text-gray-500">{formatFecha(u.fecha_registro)}</td>

                    <td className="py-3.5 px-5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {u.estado !== "bloqueado" ? (
                          <button onClick={() => handleUpdateField(u.id, "estado", "bloqueado")}
                            title="Bloquear usuario"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition">
                            <Ban size={15} />
                          </button>
                        ) : (
                          <button onClick={() => handleUpdateField(u.id, "estado", "activo")}
                            title="Activar usuario"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition">
                            <UserCheck size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!loading && (
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
            {usuariosFiltrados.length} de {usuarios.length} usuario{usuarios.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
      {toast && <Toast message={toast.message} tipo={toast.tipo} />}
    </div>
  );
}

export default function ConfiguracionAdminPage() {
  const supabase  = useMemo(() => createClient(), []);
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { key: "general",  label: "General",  Icon: Settings },
    { key: "usuarios", label: "Usuarios", Icon: Users    },
  ];

  return (
    <ProtectedRoute>
      <div className="w-full flex flex-col gap-5 p-4 md:p-6 pt-2 md:pt-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-sm text-gray-500 mt-0.5">Parámetros del sistema, usuarios y permisos</p>
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
          {tabs.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === key ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {activeTab === "general" && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex gap-3 items-start">
            <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Esta pestaña requiere la tabla <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">configuracion_sistema</code>.
              Si no existe, ejecuta <b>admin-schemas.sql</b> en el SQL Editor de Supabase.
            </p>
          </div>
        )}

        {activeTab === "general"  && <TabGeneral  supabase={supabase} />}
        {activeTab === "usuarios" && <TabUsuarios supabase={supabase} />}
      </div>
    </ProtectedRoute>
  );
}