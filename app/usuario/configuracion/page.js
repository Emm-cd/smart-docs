"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";

/* ── Icons (Usando Lucide React para hacer match con tu Dashboard) ── */
import { 
  User, 
  AtSign, 
  Mail, 
  Lock, 
  AlertTriangle, 
  Trash2, 
  Save, 
  Shield, 
  CheckCircle 
} from "lucide-react";

export default function ConfiguracionPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    username: "",
    email: "",
    password: "", 
  });

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setForm({
          nombre: user.user_metadata?.nombre || "",
          apellido: user.user_metadata?.apellido || "",
          username: user.user_metadata?.username || "",
          email: user.email || "",
          password: "",
        });
      }
      setLoading(false);
    }
    loadUser();
  }, [supabase.auth]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setAlert({ type: "", message: "" }); 
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAlert({ type: "", message: "" });

    const updates = { 
      email: form.email, 
      data: { 
        nombre: form.nombre, 
        apellido: form.apellido,
        username: form.username
      } 
    };
    if (form.password) updates.password = form.password;

    const { error } = await supabase.auth.updateUser(updates);
    setSaving(false);

    if (error) {
      setAlert({ type: "error", message: error.message });
    } else {
      setAlert({ type: "success", message: "Datos actualizados correctamente." });
      setForm((prev) => ({ ...prev, password: "" })); 
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    const { error } = await supabase.rpc('delete_user_account'); 
    
    if (error) {
      setAlert({ type: "error", message: "Error al eliminar. Verifica la función RPC." });
      setDeleting(false);
      setShowConfirmDelete(false);
      return;
    }
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return <div className="h-full flex items-center justify-center text-gray-400">Cargando perfil...</div>;

  return (
    <ProtectedRoute>
      <div className="h-full flex flex-col gap-4 relative pb-16 md:pb-0">
        
        {/* HEADER (Estilo idéntico a tu Dashboard) */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Configuración de Cuenta</h2>
          <p className="text-gray-500 text-sm mt-1">
            Gestiona tu información personal y preferencias de seguridad.
          </p>
        </div>

        {/* ALERTA DE ÉXITO O ERROR */}
        {alert.message && (
          <div className={`p-4 rounded-2xl text-sm font-medium flex items-center gap-3 w-full max-w-5xl ${alert.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
            {alert.type === 'success' ? <CheckCircle size={20} className="text-green-500" /> : <AlertTriangle size={20} className="text-red-500" />}
            {alert.message}
          </div>
        )}

        {/* CONTENEDOR CENTRAL (Limitado a max-w-5xl para que no se estire feo) */}
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
          
          {/* COLUMNA IZQUIERDA: DATOS PERSONALES */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 p-2.5 rounded-xl shrink-0">
                <User className="text-blue-600" size={20} />
              </div>
              <h3 className="font-semibold text-gray-800 text-lg">Datos Personales</h3>
            </div>

            <form id="profile-form" onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nombre</label>
                  <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 bg-gray-50 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                    <User size={18} className="text-gray-400" />
                    <input type="text" name="nombre" value={form.nombre} onChange={handleChange} required className="w-full bg-transparent text-sm text-gray-800 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Apellido</label>
                  <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 bg-gray-50 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                    <User size={18} className="text-gray-400" />
                    <input type="text" name="apellido" value={form.apellido} onChange={handleChange} required className="w-full bg-transparent text-sm text-gray-800 focus:outline-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nombre de Usuario</label>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 bg-gray-50 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                  <AtSign size={18} className="text-gray-400" />
                  <input type="text" name="username" value={form.username} onChange={handleChange} placeholder="ej. erickN84" required className="w-full bg-transparent text-sm text-gray-800 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Correo Electrónico</label>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 bg-gray-50 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                  <Mail size={18} className="text-gray-400" />
                  <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full bg-transparent text-sm text-gray-800 focus:outline-none" />
                </div>
              </div>
            </form>
          </div>

          {/* COLUMNA DERECHA: SEGURIDAD Y ZONA DE PELIGRO */}
          <div className="flex flex-col gap-4">
            
            {/* Tarjeta de Seguridad */}
            <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-5 flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-indigo-100 p-2.5 rounded-xl shrink-0">
                  <Shield className="text-indigo-600" size={20} />
                </div>
                <h3 className="font-semibold text-gray-800 text-lg">Seguridad</h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Actualizar Contraseña <span className="font-normal text-gray-400 capitalize">(Opcional)</span>
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 bg-gray-50 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                  <Lock size={18} className="text-gray-400" />
                  <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Deja en blanco para mantener la actual" className="w-full bg-transparent text-sm text-gray-800 focus:outline-none placeholder:text-gray-400" />
                </div>
              </div>

              <div className="pt-4 mt-auto">
                <button type="submit" form="profile-form" disabled={saving} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 shadow-md shadow-blue-500/20">
                  <Save size={18} />
                  {saving ? "Guardando cambios..." : "Guardar Cambios"}
                </button>
              </div>
            </div>

            {/* Tarjeta de Zona de Peligro (Estilo Alerta Dashboard) */}
            <div className="bg-red-50 p-5 md:p-6 rounded-2xl border border-red-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-xl shrink-0 shadow-sm">
                  <AlertTriangle className="text-red-500" size={20} />
                </div>
                <h3 className="font-semibold text-gray-800">Zona de Peligro</h3>
              </div>

              {!showConfirmDelete ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                  <p className="text-sm text-red-800/80">
                    Eliminar tu cuenta borrará todos tus documentos de forma permanente.
                  </p>
                  <button type="button" onClick={() => setShowConfirmDelete(true)} className="shrink-0 flex items-center justify-center gap-2 text-sm font-bold text-red-600 hover:text-red-700 bg-white border border-red-200 hover:bg-red-50 px-4 py-2.5 rounded-xl transition-colors shadow-sm">
                    <Trash2 size={16} />
                    Eliminar cuenta
                  </button>
                </div>
              ) : (
                <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm mt-2">
                  <p className="text-sm font-bold text-red-600 mb-4 text-center">¿Seguro? Esta acción es irreversible y perderás todo.</p>
                  <div className="flex gap-3">
                    <button type="button" onClick={handleDeleteAccount} disabled={deleting} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 shadow-sm shadow-red-500/20">
                      {deleting ? "Borrando..." : "Sí, eliminar"}
                    </button>
                    <button type="button" onClick={() => setShowConfirmDelete(false)} disabled={deleting} className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-colors">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </ProtectedRoute>
  );
}