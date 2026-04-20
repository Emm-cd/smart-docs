// app/api/ocr/documentos/[id]/route.js
import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Obtener el storage_path antes de borrar
    const { data: doc } = await supabase
      .from("documentos")
      .select("storage_path, uid_usuario")
      .eq("id", id)
      .eq("uid_usuario", user.id)
      .single();

    if (!doc) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }

    // Borrar archivo en Storage
    if (doc.storage_path) {
      const { error: storageErr } = await supabase.storage
        .from("documentos")
        .remove([doc.storage_path]);
      if (storageErr) {
        console.warn("⚠ No se pudo borrar del storage:", storageErr.message);
      }
    }

    // Borrar historial asociado
    await supabase
      .from("historial_documentos")
      .delete()
      .eq("doc_id", id);

    // Borrar registro en DB
    const { error: dbErr } = await supabase
      .from("documentos")
      .delete()
      .eq("id", id)
      .eq("uid_usuario", user.id);

    if (dbErr) {
      console.error("❌ Error borrando doc:", dbErr.message);
      return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, mensaje: "Documento eliminado" });
  } catch (err) {
    console.error("❌ DELETE documento:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ── PATCH (renombrar) ─────────────────────────────────────────────────────────
export async function PATCH(request, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body   = await request.json();
    const nuevoNombre = (body.filename || "").trim();

    if (!nuevoNombre || nuevoNombre.length < 1) {
      return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
    }
    if (nuevoNombre.length > 120) {
      return NextResponse.json({ error: "Nombre demasiado largo" }, { status: 400 });
    }

    const { error: dbErr } = await supabase
      .from("documentos")
      .update({ filename: nuevoNombre })
      .eq("id", id)
      .eq("uid_usuario", user.id);

    if (dbErr) {
      console.error("❌ Error renombrando:", dbErr.message);
      return NextResponse.json({ error: "Error al renombrar" }, { status: 500 });
    }

    // Registrar en historial
    await supabase.from("historial_documentos").insert({
      uid_usuario: user.id,
      doc_id:      id,
      evento:      "renombrado",
      detalle:     `Renombrado a: ${nuevoNombre}`,
    });

    return NextResponse.json({ ok: true, filename: nuevoNombre });
  } catch (err) {
    console.error("❌ PATCH documento:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}