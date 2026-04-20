// app/api/chat/route.js
import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions";
const TIMEOUT_MS   = 25_000;

// ── Fetch con timeout ──────────────────────────────────────────────────────
async function fetchConTimeout(url, opciones, ms) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...opciones, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export async function POST(request) {
  try {
    // ── 1. Auth ──────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const uid = session.user.id;

    // ── 2. Body ───────────────────────────────────────────────────────────
    const body = await request.json();
    const { mensaje, historial = [], conversacion_id, doc_contexto_id } = body;

    if (!mensaje?.trim()) {
      return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY no configurada en .env" },
        { status: 503 }
      );
    }

    // ── 3. Documentos del usuario ─────────────────────────────────────────
    let documentos = [];
    if (doc_contexto_id) {
      const { data } = await supabase
        .from("documentos")
        .select("id,tipo_doc,filename,datos_extraidos,resumen_ia,fecha_vencimiento,vencimiento_estado")
        .eq("id", doc_contexto_id)
        .eq("uid_usuario", uid)
        .is("eliminado_en", null)
        .single();
      if (data) documentos = [data];
    } else {
      const { data } = await supabase
        .from("documentos")
        .select("id,tipo_doc,filename,datos_extraidos,resumen_ia,fecha_vencimiento,vencimiento_estado")
        .eq("uid_usuario", uid)
        .is("eliminado_en", null)
        .order("creado_en", { ascending: false })
        .limit(8);
      documentos = data || [];
    }

    // ── 4. Construir contexto ─────────────────────────────────────────────
    let contexto = "";
    if (documentos.length === 0) {
      contexto = "El usuario aún no tiene documentos cargados.";
    } else {
      contexto = documentos.map((doc) => {
        const datos = doc.datos_extraidos || {};
        const campos = Object.entries(datos)
          .map(([k, v]) => {
            const val = typeof v === "object" && v !== null && "valor" in v ? v.valor : v;
            if (!val || val === "null") return null;
            return `  • ${k.replace(/_/g, " ")}: ${val}`;
          })
          .filter(Boolean)
          .join("\n");

        const partes = [
          `📄 ${doc.tipo_doc} — ${doc.filename}`,
          doc.resumen_ia ? `   Resumen: ${doc.resumen_ia}` : "",
          doc.fecha_vencimiento
            ? `   Vencimiento: ${doc.fecha_vencimiento} (${doc.vencimiento_estado})`
            : "",
          campos ? `   Datos:\n${campos}` : "",
        ].filter(Boolean);

        return partes.join("\n");
      }).join("\n\n");
    }

    // ── 5. Prompt del sistema ──────────────────────────────────────────────
    const systemPrompt = `Eres DocuBot, el asistente inteligente de DocuManager, una app mexicana de gestión de documentos personales.

DOCUMENTOS DEL USUARIO:
${contexto}

INSTRUCCIONES:
- Responde SIEMPRE en español, de forma clara, amable y concisa.
- Si la pregunta es sobre un dato que está arriba, dalo con precisión.
- Si el dato NO está en los documentos, dilo claramente: "No encontré ese dato en tus documentos".
- Nunca inventes datos (nombres, fechas, CURPs, RFCs, etc.).
- Si un documento está vencido o próximo a vencer, menciónalo.
- Usa **negrita** para resaltar datos clave.
- Máximo 3-4 oraciones salvo que pidan más detalle.
- Si el usuario solo saluda, salúdalo y pregunta en qué puedes ayudarle.`;

    // ── 6. Mensajes para Groq ─────────────────────────────────────────────
    const messages = [
      { role: "system", content: systemPrompt },
      // Historial reciente (máximo 8 turnos)
      ...historial.slice(-8).map((m) => ({
        role:    m.rol === "user" ? "user" : "assistant",
        content: m.contenido,
      })),
      { role: "user", content: mensaje },
    ];

    // ── 7. Llamar a Groq ──────────────────────────────────────────────────
    const groqRes = await fetchConTimeout(
      GROQ_URL,
      {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          Authorization:   `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model:       "llama-3.1-8b-instant",
          messages,
          max_tokens:  600,
          temperature: 0.4,
        }),
      },
      TIMEOUT_MS
    );

    if (!groqRes.ok) {
      const errText = await groqRes.text().catch(() => "");
      console.error("❌ Groq error:", groqRes.status, errText);
      return NextResponse.json(
        { error: `Error de Groq (${groqRes.status}). Verifica tu GROQ_API_KEY.` },
        { status: 502 }
      );
    }

    const groqData  = await groqRes.json();
    const respuesta = groqData.choices?.[0]?.message?.content?.trim() || "Sin respuesta.";

    // ── 8. Detectar fuentes mencionadas ───────────────────────────────────
    const fuentes = documentos
      .filter((d) =>
        respuesta.toLowerCase().includes(d.tipo_doc.toLowerCase()) ||
        respuesta.toLowerCase().includes(d.filename.toLowerCase().split("_")[0])
      )
      .map((d) => d.filename)
      .slice(0, 2);

    // ── 9. Guardar conversación ───────────────────────────────────────────
    const msgUser = { rol: "user",      contenido: mensaje,   ts: new Date().toISOString() };
    const msgBot  = { rol: "assistant", contenido: respuesta, ts: new Date().toISOString(), fuentes };
    const nuevosMsgs = [...historial, msgUser, msgBot];

    let conv_id = conversacion_id || null;

    if (conv_id) {
      await supabase
        .from("conversaciones")
        .update({ mensajes: nuevosMsgs, actualizado_en: new Date().toISOString() })
        .eq("id", conv_id)
        .eq("uid_usuario", uid);
    } else {
      const { data: nueva } = await supabase
        .from("conversaciones")
        .insert({
          uid_usuario:     uid,
          doc_contexto_id: doc_contexto_id || null,
          mensajes:        nuevosMsgs,
        })
        .select("id")
        .single();
      conv_id = nueva?.id || null;
    }

    // ── 10. Respuesta ─────────────────────────────────────────────────────
    return NextResponse.json({ respuesta, fuentes, conversacion_id: conv_id });

  } catch (err) {
    if (err.name === "AbortError") {
      return NextResponse.json(
        { error: "La respuesta tardó demasiado. Intenta de nuevo." },
        { status: 504 }
      );
    }
    console.error("❌ /api/chat error:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}