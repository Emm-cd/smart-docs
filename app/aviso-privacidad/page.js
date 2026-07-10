export default function AvisoPrivacidadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-blue-100">
        <h1 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-3">
          <span className="text-3xl">📋</span> Aviso de Privacidad
        </h1>
        <p className="text-sm text-slate-500 mb-8">
          Última actualización: <strong>Mayo 2026</strong>
        </p>

        <div className="prose prose-slate max-w-none prose-sm sm:prose-base">
          <p>
            <strong>SmartDocs</strong>, con domicilio en San Juan del Río, Querétaro, México,
            es el responsable del tratamiento de sus datos personales, en cumplimiento con la
            <strong> Ley Federal de Protección de Datos Personales en Posesión de Particulares (LFPDPPP)</strong>.
          </p>

          <h2>1. Datos personales recopilados</h2>
          <p>Para la prestación de nuestros servicios, recopilamos los siguientes datos:</p>
          <ul>
            <li><strong>Nombre y apellido</strong> – para identificar al usuario.</li>
            <li><strong>Correo electrónico</strong> – para comunicación y recuperación de cuenta.</li>
            <li><strong>Usuario</strong> – identificador único dentro de la plataforma.</li>
            <li><strong>Contraseña</strong> (almacenada con hash seguro mediante bcrypt).</li>
            <li><strong>Documentos</strong> que el usuario sube voluntariamente para su procesamiento.</li>
            <li><strong>Metadatos de uso</strong> (fechas de acceso, tipos de documentos).</li>
          </ul>

          <h2>2. Finalidad del tratamiento</h2>
          <p>Sus datos serán utilizados exclusivamente para:</p>
          <ul>
            <li>Creación y gestión de su cuenta de usuario.</li>
            <li>Autenticación y control de acceso a la plataforma.</li>
            <li>Procesamiento de documentos mediante OCR (reconocimiento óptico de caracteres).</li>
            <li>Gestión de tickets de soporte y atención al cliente.</li>
            <li>Envío de notificaciones sobre vencimiento de documentos y alertas importantes.</li>
            <li>Mejora continua del servicio y análisis de uso.</li>
          </ul>

          <h2>3. Transferencia de datos personales</h2>
          <p>
            Sus datos pueden ser transferidos a terceros proveedores de servicios que nos ayudan a operar la plataforma,
            siempre bajo estrictas medidas de seguridad y confidencialidad:
          </p>
          <ul>
            <li><strong>Supabase (USA)</strong> – almacenamiento de base de datos y autenticación.</li>
            <li><strong>Railway (USA)</strong> – procesamiento de OCR en contenedores Docker.</li>
            <li><strong>Vercel (USA)</strong> – hosting y despliegue de la aplicación.</li>
            <li><strong>Groq API (USA)</strong> – modelo de lenguaje para el asistente inteligente.</li>
          </ul>
          <p>
            Estas transferencias se realizan con el consentimiento del titular y bajo acuerdos que garantizan
            la protección de sus datos conforme a estándares internacionales.
          </p>

          <h2>4. Derechos ARCO</h2>
          <p>
            Usted tiene derecho a ejercer los derechos de <strong>Acceso, Rectificación, Cancelación y Oposición (ARCO)</strong>
            sobre sus datos personales. Para ello, puede enviar un correo electrónico a:
          </p>
          <p className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <strong>privacidad@smartdocs.com</strong>
          </p>
          <p>
            Su solicitud será atendida en un plazo máximo de <strong>20 días hábiles</strong> conforme a la LFPDPPP.
          </p>

          <h2>5. Plazos de retención</h2>
          <ul>
            <li><strong>Datos de cuenta:</strong> Se conservan mientras la cuenta esté activa. Al cancelar la cuenta, se eliminan en un plazo de 30 días.</li>
            <li><strong>Documentos procesados:</strong> Se conservan por un período de <strong>5 años</strong> para fines fiscales y de archivo, a menos que el usuario solicite su eliminación anticipada.</li>
            <li><strong>Tickets de soporte:</strong> Se conservan por <strong>2 años</strong> para seguimiento y mejora del servicio.</li>
          </ul>

          <h2>6. Medidas de seguridad</h2>
          <p>Implementamos las siguientes medidas técnicas y organizativas para proteger sus datos:</p>
          <ul>
            <li><strong>Cifrado HTTPS</strong> en todas las comunicaciones.</li>
            <li><strong>Autenticación segura</strong> con Supabase (bcrypt para contraseñas).</li>
            <li><strong>Row Level Security (RLS)</strong> en la base de datos, asegurando que cada usuario solo vea sus propios datos.</li>
            <li><strong>Control de acceso basado en roles (RBAC)</strong> para administradores y usuarios.</li>
            <li><strong>Monitoreo y logs</strong> de accesos y actividades sospechosas.</li>
          </ul>

          <h2>7. Cambios al Aviso de Privacidad</h2>
          <p>
            Cualquier modificación a este aviso será publicada en nuestra página web y, si es relevante,
            notificada a los usuarios a través de correo electrónico. Le recomendamos revisar periódicamente este documento.
          </p>

          <h2>8. Contacto</h2>
          <p>
            Si tiene dudas sobre el tratamiento de sus datos personales, puede contactarnos en:
          </p>
          <p>
            <strong>Correo:</strong> privacidad@smartdocs.com<br />
            <strong>Dirección:</strong> San Juan del Río, Querétaro, México.
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-blue-100 flex justify-between items-center text-xs text-slate-400">
          <span>SmartDocs © 2026</span>
          <span>Versión 1.0</span>
        </div>
      </div>
    </div>
  );
}
