// app/api/ocr/analizar-ine/route.js
import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";

const OCR_API_URL = process.env.OCR_API_URL || "http://127.0.0.1:8000";

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

    // ── 2. Leer archivos ───────────────────────────────────────────────────
    const formData = await request.formData();
    const frente   = formData.get("frente");
    const reverso  = formData.get("reverso");
    if (!frente || !reverso) {
      return NextResponse.json({ error: "Se requieren frente y reverso" }, { status: 400 });
    }

    const [bufFrente, bufReverso] = await Promise.all([
      frente.arrayBuffer().then(Buffer.from),
      reverso.arrayBuffer().then(Buffer.from),
    ]);

    const filenameF = frente.name;
    const mimeF     = frente.type  || "image/jpeg";
    const mimeR     = reverso.type || "image/jpeg";
    const tamano    = bufFrente.length + bufReverso.length;
    const ts        = Date.now();

    // ── 3. Subir AMBAS imágenes a Storage en paralelo ──────────────────────
    const pathFrente  = `${uid}/${ts}_${filenameF}`;
    const pathReverso = `${uid}/${ts}_reverso_${reverso.name}`;

    const [upFrente, upReverso] = await Promise.all([
      supabase.storage.from("documentos").upload(pathFrente,  bufFrente,  { contentType: mimeF, upsert: false }),
      supabase.storage.from("documentos").upload(pathReverso, bufReverso, { contentType: mimeR, upsert: false }),
    ]);

    if (upFrente.error) console.error("❌ Storage frente:", upFrente.error.message);
    if (upReverso.error) console.error("❌ Storage reverso:", upReverso.error.message);

    // URL firmada del frente (la que se muestra al usuario)
    const { data: signedData } = await supabase.storage
      .from("documentos")
      .createSignedUrl(pathFrente, 60 * 60 * 24 * 7);
    const urlArchivo = signedData?.signedUrl || "";

    // ── 4. Insertar registro "procesando" ──────────────────────────────────
    const { data: docData } = await supabase
      .from("documentos")
      .insert({
        uid_usuario:  uid,
        filename:     filenameF,
        storage_path: pathFrente,
        url_archivo:  urlArchivo,
        tipo_doc:     "INE",
        datos_extraidos: {},
        resumen_ia:   "",
        estado:       "procesando",
        extension:    filenameF.split(".").pop()?.toLowerCase() || "jpg",
        tipo_mime:    mimeF,
        tamano,
        vencimiento_estado: "SIN_FECHA",
        vencimiento_alerta: false,
      })
      .select()
      .single();

    // ── 5. Historial ───────────────────────────────────────────────────────
    if (docData?.id) {
      await supabase.from("historial_documentos").insert({
        uid_usuario: uid,
        doc_id:      docData.id,
        evento:      "subido",
        detalle:     `INE subida (frente + reverso). Procesamiento OCR en curso.`,
      });
    }

    // ── 6. OCR en background ───────────────────────────────────────────────
    if (jwt && docData?.id) {
      const ocrForm = new FormData();
      ocrForm.append("frente",  new Blob([bufFrente],  { type: mimeF }), filenameF);
      ocrForm.append("reverso", new Blob([bufReverso], { type: mimeR }), reverso.name);

      fetch(`${OCR_API_URL}/api/ocr/analizar-ine-y-actualizar`, {
        method:  "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "X-Doc-Id":    docData.id,
          "X-Uid":       uid,
        },
        body: ocrForm,
      }).catch((e) => console.warn("⚠ OCR INE background error:", e.message));
    }

    // ── 7. Respuesta inmediata ─────────────────────────────────────────────
    return NextResponse.json({
      doc_id:       docData?.id || null,
      storage_path: pathFrente,
      url_archivo:  urlArchivo,
      estado:       "procesando",
      mensaje:      "INE guardada. El análisis OCR se realiza en segundo plano.",
      documento_detectado: "INE",
      data:         {},
      resumen:      "",
      vencimiento:  { estado: "SIN_FECHA", alerta: false },
      metadata: {
        filename_frente:  filenameF,
        filename_reverso: reverso.name,
        fuente_datos_principal: "pendiente",
      },
    });

  } catch (error) {
    console.error("❌ Error proxy INE:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}