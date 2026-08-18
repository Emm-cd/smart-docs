// app/api/ocr/analizar-documento/route.js
import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";

const NEXT_PUBLIC_OCR_API_URL = process.env.NEXT_PUBLIC_OCR_API_URL || "http://127.0.0.1:8000";

function limpiarNombreArchivo(nombre) {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "");
}

export async function POST(request) {
  let docData = null;
  let uid = null;

  try {
    // ── 1. Auth ────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    uid = user.id;
    const { data: { session } } = await supabase.auth.getSession();
    const jwt = session?.access_token;

    // ── 2. Leer archivo ────────────────────────────────────────────────────
    const formData = await request.formData();
    const archivo  = formData.get("archivo");
    if (!archivo) {
      return NextResponse.json({ error: "No se envió ningún archivo" }, { status: 400 });
    }

    const filename = limpiarNombreArchivo(archivo.name);
    const buffer   = Buffer.from(await archivo.arrayBuffer());

    // ── 3. Subir a Supabase Storage ─────────────────────────────────────────
    const storagePath = `${uid}/${Date.now()}_${filename}`;
    const { error: storageError } = await supabase.storage
      .from("documentos")
      .upload(storagePath, buffer, {
        contentType: archivo.type,
        upsert: false,
      });

    if (storageError) {
      console.error("❌ Error Supabase Storage:", storageError.message);
      return NextResponse.json({ error: "Error al guardar el archivo" }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from("documentos")
      .getPublicUrl(storagePath);
    const urlArchivo = urlData.publicUrl;

    // ── 4. Insertar registro inicial ("procesando") ─────────────────────────
    const { data: newDoc, error: dbError } = await supabase
      .from("documentos")
      .insert({
        uid_usuario: uid,
        filename,
        storage_path: storagePath,
        url_archivo:  urlArchivo,
        tipo_doc:     "PROCESANDO",
        estado:       "procesando",
        extension:    filename.split(".").pop().toLowerCase(),
        tipo_mime:    archivo.type,
        tamano:       buffer.length,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("❌ Error Supabase DB Insert:", dbError.message);
      return NextResponse.json({ error: "Error en base de datos" }, { status: 500 });
    }

    docData = newDoc;

    // ── 5. Obtener datos del perfil del usuario ──────────────────────────────
    const { data: perfil } = await supabase
      .from("usuarios")
      .select("nombre, apellido, email")
      .eq("id", uid)
      .maybeSingle();

    // ── 6. Disparar OCR en FastAPI en segundo plano de forma segura ──────────
    const ocrForm = new FormData();
    const blob = new Blob([buffer], { type: archivo.type });
    ocrForm.append("archivo", blob, filename);

    // Endpoint de FastAPI
    // En app/api/ocr/analizar-documento/route.js
    const targetUrl = `${process.env.NEXT_PUBLIC_OCR_API_URL}/api/ocr/analizar-y-actualizar`;

    // Ejecutamos la petición de fondo capturando cualquier error de red
    fetch(targetUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "X-Doc-Id":    docData.id,
        "X-Uid":       uid,
        "X-Email":     perfil?.email    || user.email || "",
        "X-Nombre":    perfil?.nombre   || "",
        "X-Apellido":  perfil?.apellido || "",
      },
      body: ocrForm,
    })
    .then(async (res) => {
      if (!res.ok) {
        const errText = await res.text();
        console.error(`FastAPI devolvió status ${res.status}: ${errText}`);
      } else {
        console.log(`FastAPI recibió el documento correctamente (${docData.id})`);
      }
    })
    .catch(async (e) => {
      console.error("No se pudo conectar con FastAPI:", e.message);
      // En caso de que FastAPI esté caído, marcamos el documento con error en Supabase
      await supabase
        .from("documentos")
        .update({ estado: "error", info_adicional: "Servidor OCR no disponible" })
        .eq("id", docData.id);
    });

    // ── 7. Respuesta inmediata al frontend ──────────────────────────────────
    return NextResponse.json({
      doc_id:              docData?.id || null,
      storage_path:        storagePath,
      url_archivo:         urlArchivo,
      estado:              "procesando",
      mensaje:             "Archivo guardado. El análisis OCR se realiza en segundo plano.",
      documento_detectado: "PROCESANDO",
      data:                {},
      resumen:             "",
      vencimiento:         { estado: "SIN_FECHA", alerta: false },
      metadata:            { filename, calidad_imagen: {}, fuente_datos_principal: "pendiente" },
    });

  } catch (err) {
    console.error("❌ Error en POST /api/ocr/analizar-documento:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}