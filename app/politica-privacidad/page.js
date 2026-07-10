export default function PoliticaPrivacidadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-blue-100">
        <h1 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-3">
          <span className="text-3xl">📄</span> Política de Privacidad
        </h1>
        <p className="text-sm text-slate-500 mb-8">
          Última actualización: <strong>Mayo 2026</strong>
        </p>

        <div className="prose prose-slate max-w-none prose-sm sm:prose-base">
          <h2>1. Responsable del tratamiento</h2>
          <p>
            <strong>SmartDocs</strong> es una plataforma SaaS de gestión documental, operada por el equipo de desarrollo
            con domicilio en San Juan del Río, Querétaro, México. Somos responsables del tratamiento de sus datos personales.
          </p>

          <h2>2. Datos personales que tratamos</h2>
          <p>Tratamos únicamente los datos estrictamente necesarios para la prestación del servicio:</p>
          <ul>
            <li>Datos de identificación (nombre, apellido).</li>
            <li>Datos de contacto (correo electrónico).</li>
            <li>Credenciales de acceso (usuario y contraseña hasheada).</li>
            <li>Documentos e imágenes que el usuario sube voluntariamente.</li>
            <li>Información de uso de la plataforma (fechas, tipos de interacción).</li>
          </ul>
          <p><strong>No recopilamos datos sensibles</strong> como origen étnico, salud, orientación sexual, etc.</p>

          <h2>3. Finalidad del tratamiento</h2>
          <p>Sus datos se utilizan para:</p>
          <ul>
            <li><strong>Prestar el servicio:</strong> autenticación, procesamiento de documentos, chat IA, notificaciones.</li>
            <li><strong>Mejorar la experiencia:</strong> analizar patrones de uso y optimizar la interfaz.</li>
            <li><strong>Atención al cliente:</strong> responder consultas y gestionar tickets de soporte.</li>
            <li><strong>Cumplir obligaciones legales:</strong> conservación de registros fiscales y de seguridad.</li>
          </ul>

          <h2>4. Base legal para el tratamiento</h2>
          <p>El tratamiento de sus datos se basa en:</p>
          <ul>
            <li><strong>Consentimiento explícito</strong> del titular, manifestado al aceptar este documento y el Aviso de Privacidad.</li>
            <li><strong>Ejecución de un contrato</strong> (términos de servicio) para la prestación del servicio.</li>
            <li><strong>Interés legítimo</strong> para garantizar la seguridad y mejora del servicio.</li>
          </ul>

          <h2>5. Medidas de seguridad implementadas</h2>
          <ul>
            <li><strong>Cifrado de extremo a extremo</strong> en todas las comunicaciones (TLS 1.3).</li>
            <li><strong>Almacenamiento seguro</strong> con cifrado en reposo en Supabase.</li>
            <li><strong>Autenticación robusta</strong> con bcrypt (factor de costo 10) para contraseñas.</li>
            <li><strong>Control de acceso granular</strong> mediante políticas RLS en base de datos.</li>
            <li><strong>Registro de auditoría</strong> de accesos y acciones críticas.</li>
            <li><strong>Actualizaciones periódicas</strong> de dependencias y parches de seguridad.</li>
          </ul>

          <h2>6. Plazos de retención de datos</h2>
          <ul>
            <li><strong>Datos de cuenta:</strong> Se conservan mientras la cuenta esté activa. Tras la cancelación, se eliminan en un máximo de 30 días.</li>
            <li><strong>Documentos subidos:</strong> Se conservan por 5 años para cumplir con obligaciones fiscales, a menos que el usuario solicite su eliminación anticipada.</li>
            <li><strong>Logs de acceso:</strong> Se conservan por 1 año para fines de seguridad y auditoría.</li>
            <li><strong>Tickets de soporte:</strong> Se conservan por 2 años para seguimiento y mejora.</li>
          </ul>

          <h2>7. Ejercicio de derechos ARCO</h2>
          <p>
            Usted puede ejercer sus derechos de <strong>Acceso, Rectificación, Cancelación y Oposición</strong>
            enviando un correo electrónico a:
          </p>
          <p className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <strong>privacidad@smartdocs.com</strong>
          </p>
          <p>
            En su solicitud debe incluir:
          </p>
          <ul>
            <li>Nombre completo y correo registrado.</li>
            <li>Descripción clara del derecho que desea ejercer.</li>
            <li>Copia de identificación oficial (para verificar identidad).</li>
          </ul>
          <p>
            Atenderemos su solicitud en un plazo máximo de <strong>20 días hábiles</strong>, conforme a la LFPDPPP.
          </p>

          <h2>8. Transferencias de datos personales</h2>
          <p>
            Sus datos pueden ser transferidos a los siguientes proveedores de servicios, que actúan como encargados del tratamiento:
          </p>
          <table className="border-collapse border border-slate-300 w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="border border-slate-300 p-2 text-left">Proveedor</th>
                <th className="border border-slate-300 p-2 text-left">País</th>
                <th className="border border-slate-300 p-2 text-left">Finalidad</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2"><strong>Supabase</strong></td>
                <td className="border border-slate-300 p-2">USA</td>
                <td className="border border-slate-300 p-2">Base de datos, autenticación, almacenamiento</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2"><strong>Railway</strong></td>
                <td className="border border-slate-300 p-2">USA</td>
                <td className="border border-slate-300 p-2">Procesamiento OCR (contenedores Docker)</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2"><strong>Vercel</strong></td>
                <td className="border border-slate-300 p-2">USA</td>
                <td className="border border-slate-300 p-2">Hosting y despliegue de la aplicación</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2"><strong>Groq</strong></td>
                <td className="border border-slate-300 p-2">USA</td>
                <td className="border border-slate-300 p-2">Modelo de lenguaje para asistente IA</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-2 text-xs text-slate-500">
            Todas estas transferencias se realizan bajo acuerdos de confidencialidad y con las medidas de seguridad adecuadas.
          </p>

          <h2>9. Notificación de brechas de seguridad</h2>
          <p>
            En caso de una brecha de seguridad que afecte sus datos personales, nos comprometemos a:
          </p>
          <ul>
            <li>Contener la brecha en un plazo de <strong>24 horas</strong>.</li>
            <li>Evaluar el impacto en un plazo de <strong>48 horas</strong>.</li>
            <li>Notificar al <strong>INAI</strong> dentro de las <strong>72 horas</strong> siguientes a la detección.</li>
            <li>Comunicar a los usuarios afectados de manera inmediata.</li>
          </ul>

          <h2>10. Cambios a la Política de Privacidad</h2>
          <p>
            Nos reservamos el derecho de actualizar esta política. Cualquier cambio será publicado en esta misma página
            y, si es significativo, le notificaremos por correo electrónico.
          </p>

          <h2>11. Contacto</h2>
          <p>
            Para cualquier consulta sobre privacidad, comuníquese con nosotros:
          </p>
          <p>
            <strong>Correo:</strong> privacidad@smartdocs.com<br />
            <strong>Teléfono:</strong> +52 (427) 123 4567 <br />
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
