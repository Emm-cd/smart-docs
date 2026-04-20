// src/app/lib/supabaseAdmin.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Usamos la llave secreta de administrador
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Faltan las variables de entorno de Supabase Admin.");
}

// Creamos un cliente con permisos absolutos
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false // No queremos que esto afecte tu sesión en el navegador
  }
});