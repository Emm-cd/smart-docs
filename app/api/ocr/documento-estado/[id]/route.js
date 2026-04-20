// app/api/ocr/documento-estado/[id]/route.js
import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const { data: doc, error } = await supabase
      .from("documentos")
      .select("id, estado, tipo_doc, resumen_ia, datos_extraidos, vencimiento_estado, vencimiento_alerta, filename")
      .eq("id", id)
      .eq("uid_usuario", user.id)
      .single();

    if (error || !doc) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      id:                 doc.id,
      estado:             doc.estado,
      tipo_doc:           doc.tipo_doc,
      listo:              doc.estado === "procesado",
      error:              doc.estado === "error",
      resumen:            doc.resumen_ia || "",
      vencimiento_estado: doc.vencimiento_estado,
      vencimiento_alerta: doc.vencimiento_alerta,
      filename:           doc.filename,
    });
  } catch (err) {
    console.error("❌ Error estado documento:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}