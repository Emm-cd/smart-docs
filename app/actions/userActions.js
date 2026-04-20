// actions/userActions.js
"use server";

import { supabaseAdmin } from "@/app/lib/supabase/supabaseAdmin";

export async function crearUsuarioDB(data) {
  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password, 
      email_confirm: true,
      user_metadata: {
        nombre: data.nombre,
        apellido: data.apellido,
        username: data.username,
        rol: data.rol || 'usuario' 
      }
    });
    if (authError) throw new Error(authError.message);
    return {
      success: true,
      user: {
        id: authData.user.id,
        nombre: data.nombre,
        apellido: data.apellido,
        username: data.username,
        email: data.email,
        estado: 'pendiente', 
        rol: data.rol || 'usuario'
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function editarUsuarioDB(id, data) {
  try {
    const { error } = await supabaseAdmin
      .from("usuarios")
      .update({
        nombre: data.nombre,
        apellido: data.apellido,
        username: data.username,
        rol: data.rol
      })
      .eq("id", id);

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function eliminarUsuarioDB(id) {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw new Error(error.message);
    return { success: true };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function suspenderUsuarioDB(id){
  try {
    const { error } = await supabaseAdmin
      .from("usuarios")
      .update({ estado: "suspendido" }) 
      .eq("id", id);

    if (error) throw new Error(error.message);
    // Se banea el usuario en Supabase Auth para que sus tokens expiren
    await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: '876000h' });
    return { 
      success: true 
    };
  } catch (error) {
    return { 
      success: false, error: error.message
    };
  }
}

// NUEVA FUNCIÓN: Reactivar cuenta
export async function reactivarUsuarioDB(id) {
  try {
    // 1. Cambiamos el estado a activo en tu tabla
    const { error } = await supabaseAdmin
      .from("usuarios")
      .update({ estado: "activo" }) 
      .eq("id", id);

    if (error) throw new Error(error.message);

    // 2. CRÍTICO: Le quitamos el ban en Supabase Auth
    await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: 'none' });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}