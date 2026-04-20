"use client";

import { useState } from "react";
import { Search, Filter, Edit2, Trash2, ShieldAlert, Key, UserCog, ChevronDown, X, Check, MoreVertical, CheckCircle, XCircle, ShieldCheck } from "lucide-react";
import { useUsers } from "@/app/context/UserContext";
// 1. CAMBIAR IMPORTACIÓN
import { createClient } from "@/app/lib/supabase/client"; 
import { crearUsuarioDB, editarUsuarioDB, eliminarUsuarioDB, suspenderUsuarioDB, reactivarUsuarioDB } from "@/app/actions/userActions";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function UsuariosPage() {
  // 2. INICIALIZAR SUPABASE
  const supabase = createClient();
  const { users, setUsers } = useUsers();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [activityFilter, setActivityFilter] = useState("Todas");
  const [roleFilter, setRoleFilter] = useState("Todos"); 
  
  const [openDropdown, setOpenDropdown] = useState(null); 
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // Consolidamos todos los campos, incluyendo password
  const [formData, setFormData] = useState({ nombre: "", apellido: "", username: "", email: "", password: "" });
  const [nombreError, setNombreError] = useState("");
  const [apellidoError, setApellidoError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState(""); 
  const [passwordError, setPasswordError] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredUsers = users.filter((user) => {
    const fullName = user.name || `${user.nombre} ${user.apellido}`; 
    const matchesSearch = 
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "Todos" || user.status === statusFilter;
    const userRole = user.rol?.toLowerCase() || "usuario";
    const matchesRole = roleFilter === "Todos" || userRole === roleFilter.toLowerCase();
    const matchesActivity = activityFilter === "Todas" || true; 
    return matchesSearch && matchesStatus && matchesRole && matchesActivity;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Activo": return "bg-emerald-100 text-emerald-700";
      case "Pendiente": return "bg-amber-100 text-amber-700";
      case "Suspendido": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getRoleColor = (rol) => {
    const normalizeRol = rol?.toLowerCase() || 'usuario';
    return normalizeRol === 'admin' ? "bg-purple-100 text-purple-700 font-bold" : "bg-blue-100 text-blue-700 font-bold";
  };

  const openModal = (type, user = null) => {
    setSelectedUser(user);
    setModalType(type);
    if (type === 'edit' && user) {
      const [nombreData, ...apellidoData] = (user.nombre || user.name || "").split(" "); 
      setFormData({ 
        nombre: user.nombre || nombreData || "", 
        apellido: user.apellido || apellidoData.join(" ") || "", 
        username: user.username || "", 
        email: user.email,
        password: "" // No mostramos password al editar
      });
    } else {
      setFormData({ nombre: "", apellido: "", username: "", email: "", password: "" });
    }
    setOpenActionMenu(null);
    clearErrors();
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedUser(null);
    setFormData({ nombre: "", apellido: "", username: "", email: "", password: "" });
    clearErrors();
  };

  const clearErrors = () => {
    setNombreError(""); setApellidoError(""); setUsernameError(""); setEmailError(""); setPasswordError("");
  };

  const handleConfirmAction = async () => {
    if (modalType === 'new' || modalType === 'edit') {
      let isValid = true;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.nombre.trim()) { setNombreError("Requerido."); isValid = false; }
      if (!formData.apellido.trim()) { setApellidoError("Requerido."); isValid = false; }
      if (!formData.username.trim()) { setUsernameError("Requerido."); isValid = false; }
      if (!emailRegex.test(formData.email)) { setEmailError("Ingresa un correo válido."); isValid = false; }
      
      // Validación estricta de contraseña solo en creación
      if (modalType === 'new') {
        if (!formData.password) { setPasswordError("La contraseña es requerida."); isValid = false; }
        else if (formData.password.length < 6) { setPasswordError("Mínimo 6 caracteres."); isValid = false; }
      }
      if (!isValid) return; 
    }
    
    setIsSubmitting(true);
    try {
      if (modalType === 'new') {
        const result = await crearUsuarioDB({
          nombre: formData.nombre.trim(),
          apellido: formData.apellido.trim(),
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password, 
          status: "Activo", 
          rol: 'usuario'
        });
        
        if (!result.success) throw new Error(result.error || "Error al crear en base de datos.");
        
        const newUserId = result.user?.id || result.id || Date.now().toString();

        const newUser = {
          id: newUserId,
          nombre: formData.nombre.trim(),
          apellido: formData.apellido.trim(),
          name: `${formData.nombre.trim()} ${formData.apellido.trim()}`,
          username: formData.username.trim(),
          email: formData.email.trim(),
          avatar: formData.nombre.trim().substring(0, 2).toUpperCase(),
          status: "Activo", 
          rol: "usuario",
          documents: 0,
          lastAccess: "Sin acceso previo",
          registeredAt: new Date().toLocaleDateString('es-ES')
        };
        
        setUsers([...users, newUser]);
        setNotification({ type: "success", title: "¡Usuario Creado!", message: "El usuario ha sido registrado correctamente." });

      } else if (modalType === 'edit' && selectedUser) {
        const result = await editarUsuarioDB(selectedUser.id, {
          nombre: formData.nombre.trim(),
          apellido: formData.apellido.trim(),
          username: formData.username.trim(),
          email: formData.email.trim(),
          rol: selectedUser.rol 
        });
        
        if (!result.success) throw new Error(result.error);
        
        setUsers(users.map(u => u.id === selectedUser.id ? { 
          ...u, 
          nombre: formData.nombre.trim(),
          apellido: formData.apellido.trim(),
          name: `${formData.nombre.trim()} ${formData.apellido.trim()}`,
          username: formData.username.trim(),
          email: formData.email.trim() 
        } : u));
        setNotification({ type: "success", title: "¡Datos Actualizados!", message: "La información del usuario ha sido modificada con éxito." });
        
      } else if (modalType === 'delete' && selectedUser) {
        const result = await eliminarUsuarioDB(selectedUser.id);
        if (!result.success) throw new Error(result.error);
        setUsers(users.filter(u => u.id !== selectedUser.id));
        setNotification({ type: "success", title: "¡Usuario Eliminado!", message: "El usuario fue eliminado correctamente." });
        
      } else if (modalType === 'suspend' && selectedUser) {
        const result = await suspenderUsuarioDB(selectedUser.id);
        if (!result.success) throw new Error(result.error); 
        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, status: "Suspendido" } : u));
        setNotification({ type: "success", title: "¡Usuario Suspendido!", message: "El usuario ha sido suspendido." });
      }
      if (modalType === 'reactivate') {
        const response = await reactivarUsuarioDB(selectedUser.id);
        
        if (response.success) {
          setUsers(users.map(u => u.id === selectedUser.id ? { ...u, status: 'Activo' } : u));
          
          setNotification({
            type: 'success',
            title: 'Cuenta reactivada',
            message: `La cuenta de ${selectedUser.nombre} ha sido reactivada exitosamente.`
          });
          closeModal(); // Importante cerrar el modal al terminar
        } else {
          setNotification({
            type: 'error',
            title: 'Error al reactivar',
            message: response.error || 'Ocurrió un error inesperado.'
          });
        }
      }
    } catch (error) {
      console.error("Error en la acción:", error);
      // Manejo de error general
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="w-full flex flex-col gap-4 relative h-full overflow-hidden" 
        onClick={() => { setOpenDropdown(null); setOpenActionMenu(null); }}>
        {/* ENCABEZADO Y BOTÓN DE ACCIÓN */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="text-sm text-gray-500 mt-1">Administra lo relacionado a tus usuarios.</p>
          </div>
          <button onClick={() => openModal('new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-blue-600/20"
          > + Nuevo Usuario</button></div>
          
        {/* BARRA DE FILTROS */}
        <div className="relative z-20 bg-white p-4 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col md:flex-row gap-4 items-center justify-between shrink-0">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Buscar por nombre, usuario o email..." 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <div className="flex w-full md:w-auto items-center gap-3 flex-wrap pb-1 md:pb-0 z-10">
            <div className="flex items-center gap-2 text-gray-500 font-medium text-sm mr-2">
              <Filter size={18} /><span>Filtros:</span>
            </div>
            {/* FILTRO DE ROL */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { setOpenDropdown(openDropdown === 'role' ? null : 'role'); setOpenActionMenu(null); }}
                className={`flex items-center gap-2 text-sm py-2.5 px-4 rounded-xl border-none outline-none transition-colors w-32 justify-between
                  ${openDropdown === 'role' ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-500/20' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
              ><span className="capitalize">Rol: <b>{roleFilter}</b></span>
                <ChevronDown size={16} className={`transition-transform ${openDropdown === 'role' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'role' && (
                <div className="absolute top-full mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1 animate-in fade-in zoom-in-95 duration-100">
                  {["Todos", "Admin", "Usuario"].map((opcion) => (
                    <button key={opcion}onClick={() => { setRoleFilter(opcion); setOpenDropdown(null); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                    >{opcion}{roleFilter === opcion && <Check size={16} className="text-blue-600" />}</button>))} </div> )}
            </div>
            {/* FILTRO DE ESTADO */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { setOpenDropdown(openDropdown === 'status' ? null : 'status'); setOpenActionMenu(null); }}
                className={`flex items-center gap-2 text-sm py-2.5 px-4 rounded-xl border-none outline-none transition-colors w-36 justify-between
                  ${openDropdown === 'status' ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-500/20' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
              ><span>Estado: <b>{statusFilter}</b></span>
                <ChevronDown size={16} className={`transition-transform ${openDropdown === 'status' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'status' && (
                <div className="absolute top-full mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1 animate-in fade-in zoom-in-95 duration-100">
                  {["Todos", "Activo", "Pendiente", "Suspendido"].map((opcion) => (
                    <button key={opcion} onClick={() => { setStatusFilter(opcion); setOpenDropdown(null); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                    >{opcion}{statusFilter === opcion && <Check size={16} className="text-blue-600" />} </button>
                  ))}
                </div>
              )}
            </div>
            {/* FILTRO DE ACTIVIDADES */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { setOpenDropdown(openDropdown === 'activity' ? null : 'activity'); setOpenActionMenu(null); }}
                className={`flex items-center gap-2 text-sm py-2.5 px-4 rounded-xl border-none outline-none transition-colors w-40 justify-between
                  ${openDropdown === 'activity' ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-500/20' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
              ><span>Actividad: <b>{activityFilter}</b></span>
                <ChevronDown size={16} className={`transition-transform ${openDropdown === 'activity' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'activity' && (
                <div className="absolute top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1 animate-in fade-in zoom-in-95 duration-100">
                  {["Todas", "Reciente", "Inactivo"].map((opcion) => (
                    <button key={opcion} onClick={() => { setActivityFilter(opcion); setOpenDropdown(null); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                    > {opcion}{activityFilter === opcion && <Check size={16} className="text-blue-600" />}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CONTENEDOR PRINCIPAL DE LA TABLA */}
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col flex-1 overflow-hidden">
          <div className="w-full flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="w-full text-left border-collapse relative">
              <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Documentos</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Último acceso</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Registro</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                            {user.avatar || (user.nombre ? user.nombre.substring(0,2).toUpperCase() : 'US')}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900">{user.nombre} {user.apellido}</span>
                              {user.username && <span className="text-xs text-gray-400">@{user.username}</span>}
                            </div>
                            <span className="text-xs text-gray-500">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>{user.status || 'Activo'}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-md text-xs uppercase tracking-wider ${getRoleColor(user.rol)}`}>{user.rol?.toLowerCase() || 'usuario'}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          {user.rol?.toLowerCase() === 'admin' ? (<span className="italic text-gray-400 text-xs">No aplica</span>) : (
                            <><span className="font-semibold text-gray-900">{user.documents || 0}</span> docs</>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">{user.lastAccess || '-'}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{user.registeredAt || '-'}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button title="Editar usuario" onClick={() => openModal('edit', user)} 
                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><Edit2 size={18} />
                          </button>
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => { setOpenActionMenu(openActionMenu === user.id ? null : user.id); setOpenDropdown(null); }}
                              className={`p-2 rounded-lg transition-all ${openActionMenu === user.id ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`} >
                              <MoreVertical size={18} /></button>
                            {openActionMenu === user.id && (
                              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-gray-100 z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100">
                                <button onClick={() => openModal('reset', user)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 transition-colors">
                                  <Key size={16} /><span>Resetear contraseña</span></button>
                                <div className="w-full h-px bg-gray-100 my-1.5"></div>
                                {user.status?.toLowerCase() === 'suspendido' ? (
                                  <button onClick={() => openModal('reactivate', user)} 
                                    className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center gap-3 transition-colors">
                                    <ShieldCheck size={16} /><span>Reactivar cuenta</span>
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => openModal('suspend', user)} 
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-600 flex items-center gap-3 transition-colors"
                                  >
                                    <ShieldAlert size={16} /><span>Suspender cuenta</span>
                                  </button>
                                )}
                                <button onClick={() => openModal('delete', user)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors">
                                  <Trash2 size={16} /><span>Eliminar usuario</span></button>
                              </div>)}</div></div></td> 
                          </tr>
                  ))) : (
                  <tr>
                    <td colSpan="7" className="py-10 text-center text-gray-500">
                      No se encontraron usuarios que coincidan con la búsqueda o filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between shrink-0 bg-white">
            <span className="text-sm text-gray-500"> Mostrando <span className="font-medium text-gray-900">{filteredUsers.length}</span> usuarios </span>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg font-medium transition-colors disabled:opacity-50" disabled>Anterior</button>
              <button className="px-3 py-1.5 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg font-medium transition-colors disabled:opacity-50" disabled={filteredUsers.length === 0}>Siguiente</button>
            </div>
          </div>
        </div>

        {/* --- MODAL DE FORMULARIOS / CONFIRMACIONES --- */}
        {modalType && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center p-5 border-b border-gray-100">
                <h3 className="font-semibold text-lg text-gray-900">
                  {modalType === 'new' && "Crear Nuevo Usuario"}
                  {modalType === 'edit' && "Editar Usuario"}
                  {modalType === 'reset' && "Resetear Contraseña"}
                  {modalType === 'suspend' && "Suspender Cuenta"}
                  {modalType === 'reactivate' && "Reactivar Cuenta"} {/* NUEVO */}
                  {modalType === 'delete' && "Eliminar Usuario"}
                </h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1 rounded-lg transition-colors" disabled={isSubmitting}>
                  <X size={20} /> </button>
              </div>
              <div className="p-5">
                {(modalType === 'delete' || modalType === 'suspend' || modalType === 'reactivate') && (
                  <p className="text-gray-600 text-sm">
                    ¿Estás seguro de que deseas {modalType === 'delete' ? 'eliminar' : modalType === 'suspend' ? 'suspender' : 'reactivar'} a <span className="font-bold text-gray-900">{selectedUser?.nombre} {selectedUser?.apellido}</span>? 
                    {modalType === 'delete' ? " Esta acción no se puede deshacer." : 
                    modalType === 'suspend' ? " El usuario no podrá acceder a sus documentos hasta que se reactive." :
                    " El usuario recuperará el acceso inmediato a su cuenta."} {/* NUEVO */}
                  </p>
                )}
                {modalType === 'reset' && (
                  <p className="text-gray-600 text-sm">
                    Se enviará un correo electrónico a <span className="font-bold text-gray-900">{selectedUser?.email}</span> con las instrucciones para crear una nueva contraseña.
                  </p>
                )}
                {(modalType === 'new' || modalType === 'edit') && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Nombre(s)</label>
                        <input type="text" placeholder="Ej. María"
                          className={`w-full border ${nombreError ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'} rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 transition-colors`} 
                          value={formData.nombre} onChange={(e) => { setFormData({...formData, nombre: e.target.value}); if (nombreError) setNombreError("");}} />
                        {nombreError && <span className="text-xs text-red-500 mt-1 block">{nombreError}</span>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Apellido(s)</label>
                        <input type="text" placeholder="Ej. Sánchez" 
                          className={`w-full border ${apellidoError ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'} rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 transition-colors`} 
                          value={formData.apellido} onChange={(e) => { setFormData({...formData, apellido: e.target.value}); if (apellidoError) setApellidoError(""); }} /> 
                        {apellidoError && <span className="text-xs text-red-500 mt-1 block">{apellidoError}</span>}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Nombre de Usuario</label>
                      <input type="text" placeholder="Ej. msanchez"
                        className={`w-full border ${usernameError ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'} rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 transition-colors`} 
                        value={formData.username} onChange={(e) => { setFormData({...formData, username: e.target.value}); if (usernameError) setUsernameError(""); }} />
                      {usernameError && <span className="text-xs text-red-500 mt-1 block">{usernameError}</span>}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Correo Electrónico</label>
                      <input type="email" placeholder="maria@empresa.com"
                        className={`w-full border ${emailError ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'} rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 transition-colors`} 
                        value={formData.email} disabled={modalType === 'edit'} 
                        onChange={(e) => { setFormData({...formData, email: e.target.value}); if (emailError) setEmailError("");}}/>
                      {emailError && <span className="text-xs text-red-500 mt-1 block">{emailError}</span>}
                      {modalType === 'edit' && <span className="text-[10px] text-gray-400 mt-1 block">El correo electrónico no se puede modificar por seguridad.</span>}
                    </div>
                    
                    {/* CAMPO DE CONTRASEÑA SOLO VISIBLE AL CREAR USUARIO */}
                    {modalType === 'new' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Contraseña</label>
                        <input type="password" placeholder="Mínimo 6 caracteres"
                          className={`w-full border ${passwordError ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'} rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 transition-colors`} 
                          value={formData.password} onChange={(e) => { setFormData({...formData, password: e.target.value}); if (passwordError) setPasswordError("");}}/>
                        {passwordError && <span className="text-xs text-red-500 mt-1 block">{passwordError}</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                <button onClick={closeModal} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50">Cancelar</button>
                <button onClick={handleConfirmAction} disabled={isSubmitting}
                  className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors shadow-sm disabled:opacity-70
                    ${modalType === 'delete' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 
                      modalType === 'suspend' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 
                      modalType === 'reactivate' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : /* NUEVO */
                      'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'}`}>
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    modalType === 'new' ? 'Crear Usuario' : 
                    modalType === 'edit' ? 'Guardar Cambios' : 
                    modalType === 'delete' ? 'Eliminar Definitivamente' : 
                    modalType === 'reactivate' ? 'Confirmar Reactivación' : /* NUEVO */
                    'Confirmar Acción'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- MODAL DE NOTIFICACIÓN (ÉXITO/ERROR) --- */}
        {notification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 text-center">
              <div className="flex justify-center mb-4">
                {notification.type === 'success' ? (
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center"><CheckCircle size={32} className="text-emerald-500" /></div>
                ) : (
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center"><XCircle size={32} className="text-red-500" /></div>
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{notification.title}</h3>
              <p className="text-sm text-gray-600 mb-6">{notification.message}</p>
              <button onClick={() => setNotification(null)}
                className={`w-full py-2.5 rounded-xl font-medium transition-colors text-white shadow-sm
                  ${notification.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'}`}
              >Aceptar</button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}