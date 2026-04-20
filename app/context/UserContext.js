"use client";
import { createContext, useContext, useState, useEffect } from "react";
// 1. CAMBIO: Importamos la función del motor nuevo
import { createClient } from "@/app/lib/supabase/client"; 

const UserContext = createContext();

export function UserProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [initialUserCount, setInitialUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 2. CAMBIO: Inicializamos supabase dentro del Provider
  const supabase = createClient()

  // Función para obtener usuarios de la base de datos
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Consultamos la tabla 'usuarios' que creamos en Supabase
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('fecha_registro', { ascending: false });

      if (error) throw error;

      // Transformamos los datos de Supabase al formato que espera tu tabla del admin
      const formattedUsers = data.map(dbUser => {
        // Formatear la fecha
        const fechaObj = new Date(dbUser.fecha_registro);
        const fechaRegistrada = fechaObj.toLocaleDateString('es-ES');
        
        // Formatear último acceso
        let lastAccessFormat = "Nunca";
        if (dbUser.ultimo_acceso) {
            const accesoObj = new Date(dbUser.ultimo_acceso);
            lastAccessFormat = accesoObj.toLocaleDateString('es-ES') + " " + accesoObj.toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'});
        }

        // Si no tiene nombre, usamos el username, si no, "Usuario Nuevo"
        const displayName = dbUser.nombre || dbUser.username || "Usuario Nuevo";

        return {
          id: dbUser.id, 
          name: displayName,
          nombre: dbUser.nombre,     
          apellido: dbUser.apellido, 
          rol: dbUser.rol,          
          username: dbUser.username,
          email: dbUser.email,
          avatar: dbUser.avatar_url || displayName.substring(0, 2).toUpperCase(),
          status: dbUser.estado ? dbUser.estado.charAt(0).toUpperCase() + dbUser.estado.slice(1) : "Pendiente",
          documents: 0, 
          lastAccess: lastAccessFormat,
          registeredAt: fechaRegistrada
        };
      });

      setUsers(formattedUsers);
      setInitialUserCount(formattedUsers.length);
      
    } catch (error) {
      console.error("Error al obtener usuarios de BD:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Ejecutar cuando el Provider se monta
  useEffect(() => {
    fetchUsers();
  }, []);

  // Exponemos fetchUsers por si necesitas recargar la tabla manualmente después de un cambio
  return (
    <UserContext.Provider value={{ users, setUsers, initialUserCount, fetchUsers, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUsers() {
  return useContext(UserContext);
}