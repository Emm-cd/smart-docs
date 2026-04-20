// app/api/ocr/analizar-documento/route.js
import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";

const NEXT_PUBLIC_OCR_API_URL = process.env.NEXT_PUBLIC_OCR_API_URL || "http://127.0.0.1:8000";

function limpiarNombreArchivo(nombre) {
  return nombre
    .normalize("NFD") // quita acentos
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_") // espacios → _
    .replace(/[^a-zA-Z0-9._-]/g, ""); // solo caracteres seguros
}


export async function POST(request) {
  try {
    // ── 1. Auth ────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const uid = user.id;
    const { data: { session } } = await supabase.auth.getSession();
    const jwt = session?.access_token;

    // ── 2. Leer archivo ────────────────────────────────────────────────────
    const formData = await request.formData();
    const archivo  = formData.get("archivo");
    if (!archivo) {
      return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
    }

    const arrayBuffer = await archivo.arrayBuffer();
    const buffer      = Buffer.from(arrayBuffer);
    const originalName = archivo.name;
    const filename = limpiarNombreArchivo(originalName);
    const extension   = filename.split(".").pop()?.toLowerCase() || "";
    const tipoMime    = archivo.type || "application/octet-stream";
    const tamano      = buffer.length;

    // ── 3. Subir a Storage INMEDIATAMENTE ──────────────────────────────────
    const timestamp   = Date.now();
    const storagePath = `${uid}/${timestamp}_${filename}`;

    const { error: storageError } = await supabase.storage
      .from("documentos")
      .upload(storagePath, buffer, { contentType: tipoMime, upsert: false });

    if (storageError) {
      console.error("❌ Storage upload failed:", storageError.message);
      return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 });
    }

    // URL firmada de 7 días
    const { data: signedData } = await supabase.storage
      .from("documentos")
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7);
    const urlArchivo = signedData?.signedUrl || "";

    // ── 4. Insertar registro "procesando" en documentos ────────────────────
    const { data: docData, error: docError } = await supabase
      .from("documentos")
      .insert({
        uid_usuario:  uid,
        filename,
        storage_path: storagePath,
        url_archivo:  urlArchivo,
        tipo_doc:     "PROCESANDO",
        datos_extraidos: {},
        resumen_ia:   "",
        estado:       "procesando",
        extension,
        tipo_mime:    tipoMime,
        tamano,
        vencimiento_estado: "SIN_FECHA",
        vencimiento_alerta: false,
      })
      .select()
      .single();

    if (docError) {
      console.error("❌ Error insertando doc:", docError.message);
    }

    // ── 5. Registrar en historial ──────────────────────────────────────────
    if (docData?.id) {
      await supabase.from("historial_documentos").insert({
        uid_usuario: uid,
        doc_id:      docData.id,
        evento:      "subido",
        detalle:     `Archivo ${filename} subido. Procesamiento OCR en curso.`,
      });
    }

    // ── 6. Disparar OCR en background (fire-and-forget) ───────────────────
    // NO esperamos la respuesta — el OCR actualiza el registro en segundo plano
    // ── 6. Disparar OCR en background ───────────────────────────────
    if (jwt && docData?.id) {
      const ocrForm = new FormData();
      ocrForm.append("archivo", new Blob([buffer], { type: tipoMime }), filename);

      // Obtener perfil del usuario para el email
      const { data: perfil } = await supabase
        .from("usuarios")
        .select("nombre, apellido, email")
        .eq("id", uid)
        .single();

      fetch(`${NEXT_PUBLIC_OCR_API_URL}/api/ocr/analizar-y-actualizar`, {
        method:  "POST",
        headers: {
          Authorization:  `Bearer ${jwt}`,
          "X-Doc-Id":     docData.id,
          "X-Uid":        uid,
          "X-Email":      perfil?.email    || user.email || "",  // ← NUEVO
          "X-Nombre":     perfil?.nombre   || "",                // ← NUEVO
          "X-Apellido":   perfil?.apellido || "",                // ← NUEVO
        },
        body: ocrForm,
      }).catch((e) => console.warn("⚠ OCR background error:", e.message));
    }

    // ── 7. Respuesta inmediata al cliente ──────────────────────────────────
    return NextResponse.json({
      doc_id:        docData?.id || null,
      storage_path:  storagePath,
      url_archivo:   urlArchivo,
      estado:        "procesando",
      mensaje:       "Archivo guardado. El análisis OCR se realiza en segundo plano.",
      // Compatibilidad con SubirDocumento.jsx
      documento_detectado: "PROCESANDO",
      data:          {},
      resumen:       "",
      vencimiento:   { estado: "SIN_FECHA", alerta: false },
      metadata:      { filename, calidad_imagen: {}, fuente_datos_principal: "pendiente" },
    });

  } catch (error) {
    console.error("❌ Error en proxy OCR:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}