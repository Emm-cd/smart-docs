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

    if (doc.estado === "completado" || doc.estado === "listo") {
      return NextResponse.json({
        listo: true,
        estado: doc.estado,
        documento: doc
      });
    }

    if (doc.estado === "error") {
      return NextResponse.json({
        listo: false,
        error: doc.error_mensaje || "Error al procesar el documento"
      });
    }

    // Si continúa en estado "procesando"
    return NextResponse.json({
      listo: false,
      estado: "procesando"
    });

  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}