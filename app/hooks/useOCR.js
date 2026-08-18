// app/api/ocr/documento-estado/[id]/route.js
import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: docId } = await params;

    const { data: doc, error } = await supabase
      .from("documentos")
      .select("*")
      .eq("id", docId)
      .eq("uid_usuario", user.id)
      .single();

    if (error || !doc) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }

    // 1. Estado Exitoso: Detiene el polling y devuelve la información
    if (doc.estado === "completado" || doc.estado === "listo") {
      return NextResponse.json({
        listo: true,
        finalizado: true,
        estado: doc.estado,
        documento: doc
      });
    }

    // 2. Estado Error: Marcamos listo/finalizado como TRUE para detener el polling en el front
    if (doc.estado === "error") {
      return NextResponse.json({
        listo: true,
        finalizado: true,
        estado: "error",
        error: doc.info_adicional || doc.error_mensaje || "Error al procesar el documento"
      });
    }

    // 3. Aún procesando
    return NextResponse.json({
      listo: false,
      finalizado: false,
      estado: doc.estado || "procesando"
    });

  } catch (err) {
    console.error("Error en GET /api/ocr/documento-estado/[id]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}